"""
Account Sync Service

Handles syncing Plaid accounts to assets/liabilities.
"""

from datetime import datetime
from typing import Optional, Tuple, Dict
from sqlalchemy.orm import Session

from app.repositories.connected_account_repository import connected_account_repository
from app.repositories.asset_repository import asset_repository
from app.repositories.liability_repository import liability_repository
from app.services.plaid_service import plaid_service
from app.utils.encryption import encryption_service
from app.models.connected_account import ConnectedAccount


# Mapping from Plaid account types to our categories
PLAID_TO_ASSET_CATEGORY = {
    ('depository', 'checking'): 'cash',
    ('depository', 'savings'): 'savings',
    ('depository', 'money market'): 'savings',
    ('depository', 'cd'): 'savings',
    ('investment', '401k'): 'retirement_401k',
    ('investment', '403b'): 'retirement_401k',
    ('investment', 'ira'): 'retirement_ira',
    ('investment', 'roth'): 'retirement_roth',
    ('investment', 'hsa'): 'retirement_hsa',
    ('investment', 'pension'): 'retirement_pension',
    ('investment', 'brokerage'): 'brokerage',
    ('investment', '529'): 'other',
    ('other', 'other'): 'other',
}

PLAID_TO_LIABILITY_CATEGORY = {
    ('credit', 'credit card'): 'credit_card',
    ('loan', 'auto'): 'auto_loan',
    ('loan', 'student'): 'student_loan',
    ('loan', 'mortgage'): 'mortgage',
    ('loan', 'personal'): 'personal_loan',
    ('other', 'other'): 'other',
}


class AccountSyncService:
    """Service for syncing Plaid accounts to assets/liabilities."""
    
    def map_plaid_to_category(self, plaid_type: str, plaid_subtype: Optional[str]) -> Tuple[Optional[str], bool]:
        """
        Map Plaid account type/subtype to our category.
        
        Args:
            plaid_type: Plaid account type (e.g., 'depository', 'credit', 'loan')
            plaid_subtype: Plaid account subtype (e.g., 'checking', 'credit card')
            
        Returns:
            Tuple of (category, is_asset) where category is None if unmapped
        """
        subtype = (plaid_subtype or '').lower()
        type_key = (plaid_type.lower(), subtype)
        
        # Check asset categories
        if type_key in PLAID_TO_ASSET_CATEGORY:
            return PLAID_TO_ASSET_CATEGORY[type_key], True
        
        # Check liability categories
        if type_key in PLAID_TO_LIABILITY_CATEGORY:
            return PLAID_TO_LIABILITY_CATEGORY[type_key], False
        
        # Try with just type (no subtype)
        type_only_key = (plaid_type.lower(), '')
        if type_only_key in PLAID_TO_ASSET_CATEGORY:
            return PLAID_TO_ASSET_CATEGORY[type_only_key], True
        if type_only_key in PLAID_TO_LIABILITY_CATEGORY:
            return PLAID_TO_LIABILITY_CATEGORY[type_only_key], False
        
        # Default fallback
        if plaid_type.lower() in ['depository', 'investment']:
            return 'other', True
        elif plaid_type.lower() in ['credit', 'loan']:
            return 'other', False
        
        return None, False
    
    def sync_account(self, db: Session, connected_account_id: str, user_id: str) -> Tuple[bool, Optional[str]]:
        """
        Sync a single connected account.
        
        Args:
            db: Database session
            connected_account_id: ID of the connected account
            user_id: User ID
            
        Returns:
            Tuple of (success, error_message)
        """
        account = connected_account_repository.get(db, connected_account_id, user_id)
        if not account:
            return False, "Connected account not found"
        
        if not account.is_active:
            return False, "Account is not active"
        
        # Decrypt access token
        try:
            access_token = encryption_service.decrypt(account.plaid_access_token)
        except Exception as e:
            error_msg = f"Failed to decrypt access token: {str(e)}"
            connected_account_repository.update(db, account.id, {
                'last_sync_error': error_msg
            }, user_id)
            return False, error_msg
        
        # Get balance from Plaid
        balance_info = plaid_service.get_balance(access_token, account.plaid_account_id)
        if not balance_info:
            error_msg = "Failed to fetch balance from Plaid"
            connected_account_repository.update(db, account.id, {
                'last_sync_error': error_msg
            }, user_id)
            return False, error_msg
        
        # Determine balance value (use current for most accounts, available for credit)
        balance = balance_info.get('current') or balance_info.get('available') or 0.0
        
        # Map to our category
        category, is_asset = self.map_plaid_to_category(account.account_type, account.account_subtype)
        if not category:
            error_msg = f"Unable to map account type {account.account_type}/{account.account_subtype}"
            connected_account_repository.update(db, account.id, {
                'last_sync_error': error_msg
            }, user_id)
            return False, error_msg
        
        # Update or create asset/liability
        try:
            if is_asset:
                self._create_or_update_asset(db, account, category, balance, user_id)
            else:
                # For liabilities, balance is typically negative (owed amount)
                # Plaid returns positive values for credit card balances
                liability_balance = abs(balance) if balance < 0 else balance
                self._create_or_update_liability(db, account, category, liability_balance, user_id)
            
            # Update sync status
            connected_account_repository.update(db, account.id, {
                'last_synced_at': datetime.utcnow(),
                'last_sync_error': None
            }, user_id)
            
            return True, None
        except Exception as e:
            error_msg = f"Error syncing account: {str(e)}"
            connected_account_repository.update(db, account.id, {
                'last_sync_error': error_msg
            }, user_id)
            return False, error_msg
    
    def sync_all_accounts(self, db: Session, user_id: str) -> Dict[str, any]:
        """
        Sync all active connected accounts for a user.
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            Dictionary with sync results
        """
        accounts = connected_account_repository.get_active_accounts(db, user_id)
        results = {
            'total': len(accounts),
            'successful': 0,
            'failed': 0,
            'errors': []
        }
        
        for account in accounts:
            success, error = self.sync_account(db, account.id, user_id)
            if success:
                results['successful'] += 1
            else:
                results['failed'] += 1
                results['errors'].append({
                    'account_id': account.id,
                    'account_name': account.account_name,
                    'error': error
                })
        
        return results
    
    def _create_or_update_asset(
        self, 
        db: Session, 
        connected_account: ConnectedAccount, 
        category: str, 
        balance: float,
        user_id: str
    ) -> None:
        """Create or update an asset from a connected account."""
        # Check if asset already exists for this connected account
        existing_assets = asset_repository.get_all(db, user_id)
        asset = next(
            (a for a in existing_assets if a.connected_account_id == connected_account.id),
            None
        )
        
        if asset:
            # Update existing asset
            asset_repository.update(db, asset.id, {
                'value': balance,
                'last_synced_at': datetime.utcnow(),
            }, user_id)
        else:
            # Create new asset
            asset_repository.create(db, {
                'category': category,
                'name': f"{connected_account.institution_name} {connected_account.account_name}",
                'value': balance,
                'connected_account_id': connected_account.id,
                'is_connected': True,
                'last_synced_at': datetime.utcnow(),
            }, user_id)
    
    def _create_or_update_liability(
        self, 
        db: Session, 
        connected_account: ConnectedAccount, 
        category: str, 
        balance: float,
        user_id: str
    ) -> None:
        """Create or update a liability from a connected account."""
        # Check if liability already exists for this connected account
        existing_liabilities = liability_repository.get_all(db, user_id)
        liability = next(
            (l for l in existing_liabilities if l.connected_account_id == connected_account.id),
            None
        )
        
        if liability:
            # Update existing liability
            liability_repository.update(db, liability.id, {
                'balance': balance,
                'last_synced_at': datetime.utcnow(),
            }, user_id)
        else:
            # Create new liability
            liability_repository.create(db, {
                'category': category,
                'name': f"{connected_account.institution_name} {connected_account.account_name}",
                'balance': balance,
                'connected_account_id': connected_account.id,
                'is_connected': True,
                'last_synced_at': datetime.utcnow(),
            }, user_id)


# Singleton instance
account_sync_service = AccountSyncService()

