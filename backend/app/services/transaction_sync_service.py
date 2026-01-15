"""
Transaction Sync Service

Handles syncing transactions from Plaid to our database.
"""

from datetime import datetime
from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session

from app.repositories.connected_account_repository import connected_account_repository
from app.repositories.transaction_repository import transaction_repository
from app.services.plaid_service import plaid_service
from app.utils.encryption import encryption_service
from app.models.connected_account import ConnectedAccount


class TransactionSyncService:
    """Service for syncing Plaid transactions."""
    
    def sync_transactions_for_account(
        self, 
        db: Session, 
        connected_account_id: str, 
        user_id: str
    ) -> Tuple[bool, Dict]:
        """
        Sync transactions for a single connected account.
        
        Uses Plaid's transactions/sync endpoint for incremental updates.
        
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
        
        # Track results
        total_added = 0
        total_modified = 0
        total_removed = 0
        cursor = account.transactions_cursor
        
        try:
            # Keep syncing until we've fetched all updates
            while True:
                sync_result = plaid_service.sync_transactions(access_token, cursor)
                
                # Process added transactions
                for txn_data in sync_result['added']:
                    # Only save transactions for this account
                    if txn_data['plaid_account_id'] == account.plaid_account_id:
                        txn_data['connected_account_id'] = connected_account_id
                        transaction_repository.upsert_by_plaid_transaction_id(db, txn_data, user_id)
                        total_added += 1
                
                # Process modified transactions
                for txn_data in sync_result['modified']:
                    if txn_data['plaid_account_id'] == account.plaid_account_id:
                        txn_data['connected_account_id'] = connected_account_id
                        transaction_repository.upsert_by_plaid_transaction_id(db, txn_data, user_id)
                        total_modified += 1
                
                # Process removed transactions
                for plaid_txn_id in sync_result['removed']:
                    if transaction_repository.delete_by_plaid_transaction_id(db, plaid_txn_id, user_id):
                        total_removed += 1
                
                # Update cursor for next sync
                cursor = sync_result['next_cursor']
                
                # Check if more data available
                if not sync_result['has_more']:
                    break
            
            # Save the cursor for next sync
            connected_account_repository.update(db, connected_account_id, {
                'transactions_cursor': cursor,
                'last_synced_at': datetime.utcnow(),
                'last_sync_error': None,
            }, user_id)
            
            return True, {
                'added': total_added,
                'modified': total_modified,
                'removed': total_removed,
            }
            
        except Exception as e:
            error_msg = f"Transaction sync failed: {str(e)}"
            print(f"[sync_transactions_for_account] {error_msg}")
            
            connected_account_repository.update(db, connected_account_id, {
                'last_sync_error': error_msg,
            }, user_id)
            
            return False, {'error': error_msg}
    
    def sync_transactions_for_user(self, db: Session, user_id: str) -> Dict:
        """
        Sync transactions for all active connected accounts for a user.
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            Dictionary with sync results
        """
        accounts = connected_account_repository.get_active_accounts(db, user_id)
        
        results = {
            'total_accounts': len(accounts),
            'successful': 0,
            'failed': 0,
            'total_added': 0,
            'total_modified': 0,
            'total_removed': 0,
            'errors': [],
        }
        
        for account in accounts:
            success, result = self.sync_transactions_for_account(db, account.id, user_id)
            
            if success:
                results['successful'] += 1
                results['total_added'] += result.get('added', 0)
                results['total_modified'] += result.get('modified', 0)
                results['total_removed'] += result.get('removed', 0)
            else:
                results['failed'] += 1
                results['errors'].append({
                    'account_id': account.id,
                    'account_name': account.account_name,
                    'error': result.get('error', 'Unknown error'),
                })
        
        return results


# Singleton instance
transaction_sync_service = TransactionSyncService()
