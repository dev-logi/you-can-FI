"""
Batch Sync Service

Handles batch syncing of Plaid data for all users or specific users.
Used by scheduled jobs to keep database updated with fresh Plaid data.
"""

from datetime import datetime
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import distinct

from app.models.connected_account import ConnectedAccount
from app.services.account_sync_service import account_sync_service
from app.services.transaction_sync_service import transaction_sync_service
from app.services.holding_sync_service import holding_sync_service


class BatchSyncService:
    """Service for batch syncing Plaid data."""
    
    def get_all_user_ids(self, db: Session) -> List[str]:
        """Get all unique user IDs that have connected accounts."""
        result = db.query(distinct(ConnectedAccount.user_id)).filter(
            ConnectedAccount.is_active == True
        ).all()
        return [row[0] for row in result]
    
    def sync_user(self, db: Session, user_id: str) -> Dict:
        """
        Sync all data for a specific user.
        
        Syncs:
        1. Account balances
        2. Transactions (for non-investment accounts)
        3. Holdings (for investment accounts)
        
        Args:
            db: Database session
            user_id: User ID to sync
            
        Returns:
            Dictionary with sync results
        """
        results = {
            'user_id': user_id,
            'accounts_synced': 0,
            'accounts_failed': 0,
            'transactions_added': 0,
            'transactions_modified': 0,
            'transactions_removed': 0,
            'holdings_synced': 0,
            'errors': [],
        }
        
        # Get all active connected accounts for user
        accounts = db.query(ConnectedAccount).filter(
            ConnectedAccount.user_id == user_id,
            ConnectedAccount.is_active == True
        ).all()
        
        for account in accounts:
            try:
                # 1. Sync balance (updates asset/liability values)
                success, error = account_sync_service.sync_account(db, account.id, user_id)
                
                if success:
                    results['accounts_synced'] += 1
                else:
                    results['accounts_failed'] += 1
                    results['errors'].append({
                        'account_id': account.id,
                        'account_name': account.account_name,
                        'stage': 'balance_sync',
                        'error': error,
                    })
                    continue  # Skip transaction/holding sync if balance sync failed
                
                # 2. Sync transactions or holdings based on account type
                if account.account_type == 'investment':
                    # Sync holdings for investment accounts
                    try:
                        holding_result = holding_sync_service.sync_holdings_for_account(
                            db, account.id, user_id
                        )
                        results['holdings_synced'] += holding_result.get('holdings_synced', 0)
                    except Exception as e:
                        results['errors'].append({
                            'account_id': account.id,
                            'account_name': account.account_name,
                            'stage': 'holdings_sync',
                            'error': str(e),
                        })
                else:
                    # Sync transactions for non-investment accounts
                    try:
                        txn_success, txn_result = transaction_sync_service.sync_transactions_for_account(
                            db, account.id, user_id
                        )
                        if txn_success:
                            results['transactions_added'] += txn_result.get('added', 0)
                            results['transactions_modified'] += txn_result.get('modified', 0)
                            results['transactions_removed'] += txn_result.get('removed', 0)
                        else:
                            results['errors'].append({
                                'account_id': account.id,
                                'account_name': account.account_name,
                                'stage': 'transaction_sync',
                                'error': txn_result.get('error', 'Unknown error'),
                            })
                    except Exception as e:
                        results['errors'].append({
                            'account_id': account.id,
                            'account_name': account.account_name,
                            'stage': 'transaction_sync',
                            'error': str(e),
                        })
                        
            except Exception as e:
                results['accounts_failed'] += 1
                results['errors'].append({
                    'account_id': account.id,
                    'account_name': account.account_name,
                    'stage': 'general',
                    'error': str(e),
                })
        
        return results
    
    def sync_all_users(self, db: Session) -> Dict:
        """
        Sync all data for all users with connected accounts.
        
        Args:
            db: Database session
            
        Returns:
            Dictionary with aggregated sync results
        """
        user_ids = self.get_all_user_ids(db)
        
        results = {
            'started_at': datetime.utcnow().isoformat(),
            'users_total': len(user_ids),
            'users_synced': 0,
            'users_failed': 0,
            'total_accounts_synced': 0,
            'total_accounts_failed': 0,
            'total_transactions_added': 0,
            'total_transactions_modified': 0,
            'total_transactions_removed': 0,
            'total_holdings_synced': 0,
            'user_errors': [],
        }
        
        for user_id in user_ids:
            try:
                user_result = self.sync_user(db, user_id)
                
                results['total_accounts_synced'] += user_result['accounts_synced']
                results['total_accounts_failed'] += user_result['accounts_failed']
                results['total_transactions_added'] += user_result['transactions_added']
                results['total_transactions_modified'] += user_result['transactions_modified']
                results['total_transactions_removed'] += user_result['transactions_removed']
                results['total_holdings_synced'] += user_result['holdings_synced']
                
                if user_result['errors']:
                    results['user_errors'].append({
                        'user_id': user_id,
                        'errors': user_result['errors'],
                    })
                    results['users_failed'] += 1
                else:
                    results['users_synced'] += 1
                    
            except Exception as e:
                results['users_failed'] += 1
                results['user_errors'].append({
                    'user_id': user_id,
                    'errors': [{'stage': 'user_sync', 'error': str(e)}],
                })
        
        results['completed_at'] = datetime.utcnow().isoformat()
        results['success'] = results['users_failed'] == 0
        
        return results


# Singleton instance
batch_sync_service = BatchSyncService()
