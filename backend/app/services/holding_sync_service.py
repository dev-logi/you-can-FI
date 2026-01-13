"""
Holding Sync Service

Handles syncing investment holdings from Plaid to our database.
"""

from datetime import datetime
from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session

from app.repositories.connected_account_repository import connected_account_repository
from app.repositories.security_repository import security_repository
from app.repositories.holding_repository import holding_repository
from app.services.plaid_service import plaid_service
from app.utils.encryption import encryption_service


class HoldingSyncService:
    """Service for syncing Plaid investment holdings."""
    
    def sync_holdings_for_account(
        self, 
        db: Session, 
        connected_account_id: str, 
        user_id: str
    ) -> Tuple[bool, Dict]:
        """
        Sync holdings for a single connected account.
        
        Args:
            db: Database session
            connected_account_id: ID of the connected account
            user_id: User ID
            
        Returns:
            Tuple of (success, result_dict)
        """
        # Get connected account
        account = connected_account_repository.get(db, connected_account_id, user_id)
        if not account:
            return False, {'error': 'Connected account not found'}
        
        if not account.is_active:
            return False, {'error': 'Account is not active'}
        
        # Decrypt access token
        try:
            access_token = encryption_service.decrypt(account.plaid_access_token)
        except Exception as e:
            error_msg = f"Failed to decrypt access token: {str(e)}"
            return False, {'error': error_msg}
        
        try:
            # Fetch holdings and securities from Plaid
            sync_result = plaid_service.get_holdings(access_token)
            
            # 1. Update/Create Securities
            security_id_map = {} # Maps plaid_security_id to our internal security.id
            for s_data in sync_result['securities']:
                plaid_sec_id = s_data['security_id']
                # Map plaid field names to our model field names
                sec_in = {
                    'plaid_security_id': plaid_sec_id,
                    'name': s_data['name'],
                    'ticker_symbol': s_data['ticker_symbol'],
                    'is_cash_equivalent': s_data['is_cash_equivalent'],
                    'type': s_data['type'],
                    'close_price': s_data['close_price'],
                    'close_price_as_of': s_data['close_price_as_of'],
                    'iso_currency_code': s_data['iso_currency_code'],
                }
                security = security_repository.upsert_by_plaid_id(db, sec_in)
                security_id_map[plaid_sec_id] = security.id
            
            # 2. Delete existing holdings for this account (full refresh)
            holding_repository.delete_by_account(db, connected_account_id, user_id)
            
            # 3. Create new holdings
            total_added = 0
            for h_data in sync_result['holdings']:
                # Only process holdings for this specific account
                if h_data['account_id'] == account.plaid_account_id:
                    holding_in = {
                        'connected_account_id': connected_account_id,
                        'security_id': security_id_map.get(h_data['security_id']),
                        'institution_price': h_data['institution_price'],
                        'institution_price_as_of': h_data['institution_price_as_of'],
                        'institution_value': h_data['institution_value'],
                        'cost_basis': h_data['cost_basis'],
                        'quantity': h_data['quantity'],
                        'iso_currency_code': h_data['iso_currency_code'],
                    }
                    
                    if holding_in['security_id']:
                        holding_repository.create(db, holding_in, user_id)
                        total_added += 1
            
            # Update account sync status
            connected_account_repository.update(db, connected_account_id, {
                'last_synced_at': datetime.utcnow(),
                'last_sync_error': None,
            }, user_id)
            
            return True, {
                'added': total_added,
                'securities': len(security_id_map)
            }
            
        except Exception as e:
            error_msg = f"Holdings sync failed: {str(e)}"
            print(f"[sync_holdings_for_account] {error_msg}")
            
            connected_account_repository.update(db, connected_account_id, {
                'last_sync_error': error_msg,
            }, user_id)
            
            return False, {'error': error_msg}


# Singleton instance
holding_sync_service = HoldingSyncService()
