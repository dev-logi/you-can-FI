"""
Connected Account Repository

Data access for connected accounts from any aggregator provider.
"""

import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.connected_account import ConnectedAccount
from app.repositories.base import BaseRepository


class ConnectedAccountRepository(BaseRepository[ConnectedAccount]):
    """Repository for connected account operations."""
    
    def __init__(self):
        super().__init__(ConnectedAccount)
    
    def create(self, db: Session, obj_in: dict, user_id: str) -> ConnectedAccount:
        """Create a new connected account with auto-generated ID."""
        obj_in["id"] = str(uuid.uuid4())
        obj_in["user_id"] = user_id
        
        # Ensure provider-agnostic fields are set from legacy fields if not provided
        if 'provider' not in obj_in:
            obj_in['provider'] = 'plaid'
        
        # Map legacy fields to provider-agnostic fields
        if 'plaid_item_id' in obj_in and 'provider_item_id' not in obj_in:
            obj_in['provider_item_id'] = obj_in['plaid_item_id']
        if 'plaid_access_token' in obj_in and 'provider_access_token' not in obj_in:
            obj_in['provider_access_token'] = obj_in['plaid_access_token']
        if 'plaid_account_id' in obj_in and 'provider_account_id' not in obj_in:
            obj_in['provider_account_id'] = obj_in['plaid_account_id']
        
        return super().create(db, obj_in)
    
    def get_by_user(self, db: Session, user_id: str) -> List[ConnectedAccount]:
        """Get all connected accounts for a user."""
        return db.query(ConnectedAccount).filter(
            ConnectedAccount.user_id == user_id
        ).all()
    
    def get_active_accounts(self, db: Session, user_id: str) -> List[ConnectedAccount]:
        """Get all active connected accounts for a user."""
        return db.query(ConnectedAccount).filter(
            ConnectedAccount.user_id == user_id,
            ConnectedAccount.is_active == True
        ).all()
    
    def get_by_provider(self, db: Session, user_id: str, provider: str) -> List[ConnectedAccount]:
        """Get all connected accounts for a user from a specific provider."""
        return db.query(ConnectedAccount).filter(
            ConnectedAccount.user_id == user_id,
            ConnectedAccount.provider == provider
        ).all()
    
    def get_by_provider_account_id(self, db: Session, provider_account_id: str) -> Optional[ConnectedAccount]:
        """Get connected account by provider account ID (checks both new and legacy fields)."""
        return db.query(ConnectedAccount).filter(
            or_(
                ConnectedAccount.provider_account_id == provider_account_id,
                ConnectedAccount.plaid_account_id == provider_account_id  # Legacy fallback
            )
        ).first()
    
    def get_by_provider_item_id(self, db: Session, provider_item_id: str) -> List[ConnectedAccount]:
        """Get all connected accounts for an item/connection (checks both new and legacy fields)."""
        return db.query(ConnectedAccount).filter(
            or_(
                ConnectedAccount.provider_item_id == provider_item_id,
                ConnectedAccount.plaid_item_id == provider_item_id  # Legacy fallback
            )
        ).all()
    
    def get_by_provider_item_id_and_user(self, db: Session, provider_item_id: str, user_id: str) -> List[ConnectedAccount]:
        """Get all connected accounts for an item belonging to a specific user."""
        return db.query(ConnectedAccount).filter(
            or_(
                ConnectedAccount.provider_item_id == provider_item_id,
                ConnectedAccount.plaid_item_id == provider_item_id  # Legacy fallback
            ),
            ConnectedAccount.user_id == user_id
        ).all()
    
    # Legacy method aliases for backward compatibility
    def get_by_plaid_account_id(self, db: Session, plaid_account_id: str) -> Optional[ConnectedAccount]:
        """Get connected account by Plaid account ID (legacy, use get_by_provider_account_id)."""
        return self.get_by_provider_account_id(db, plaid_account_id)
    
    def get_by_plaid_item_id(self, db: Session, plaid_item_id: str) -> List[ConnectedAccount]:
        """Get all connected accounts for a Plaid item (legacy, use get_by_provider_item_id)."""
        return self.get_by_provider_item_id(db, plaid_item_id)
    
    def get_by_plaid_item_id_and_user(self, db: Session, plaid_item_id: str, user_id: str) -> List[ConnectedAccount]:
        """Get all connected accounts for a Plaid item belonging to a specific user (legacy)."""
        return self.get_by_provider_item_id_and_user(db, plaid_item_id, user_id)
    
    def upsert_by_provider_account_id(self, db: Session, obj_in: dict, user_id: str) -> ConnectedAccount:
        """
        Create or update a connected account based on provider_account_id.
        If account exists, update it. If not, create it.
        """
        provider_account_id = obj_in.get('provider_account_id') or obj_in.get('plaid_account_id')
        existing = self.get_by_provider_account_id(db, provider_account_id)
        
        if existing and existing.user_id == user_id:
            # Update existing account
            for field, value in obj_in.items():
                if value is not None and field != 'id':
                    setattr(existing, field, value)
            # Reactivate if it was deactivated
            existing.is_active = True
            db.commit()
            db.refresh(existing)
            return existing
        else:
            # Create new account
            return self.create(db, obj_in, user_id)
    
    def upsert_by_plaid_account_id(self, db: Session, obj_in: dict, user_id: str) -> ConnectedAccount:
        """
        Create or update a connected account based on plaid_account_id (legacy).
        Use upsert_by_provider_account_id for new code.
        """
        # Map legacy fields to provider-agnostic fields
        if 'plaid_account_id' in obj_in:
            obj_in['provider_account_id'] = obj_in['plaid_account_id']
        if 'plaid_item_id' in obj_in:
            obj_in['provider_item_id'] = obj_in['plaid_item_id']
        if 'plaid_access_token' in obj_in:
            obj_in['provider_access_token'] = obj_in['plaid_access_token']
        if 'provider' not in obj_in:
            obj_in['provider'] = 'plaid'
        
        return self.upsert_by_provider_account_id(db, obj_in, user_id)
    
    def get(self, db: Session, id: str, user_id: str) -> Optional[ConnectedAccount]:
        """Get a connected account by ID, ensuring it belongs to the user."""
        return db.query(ConnectedAccount).filter(
            ConnectedAccount.id == id,
            ConnectedAccount.user_id == user_id
        ).first()
    
    def deactivate(self, db: Session, id: str, user_id: str) -> Optional[ConnectedAccount]:
        """Deactivate a connected account (soft delete)."""
        return self.update(db, id, {"is_active": False}, user_id)
    
    def update(self, db: Session, id: str, obj_in: dict, user_id: str) -> Optional[ConnectedAccount]:
        """Update a connected account, ensuring it belongs to the user."""
        account = self.get(db, id, user_id)
        if not account:
            return None
        
        for field, value in obj_in.items():
            if value is not None:
                setattr(account, field, value)
        
        db.commit()
        db.refresh(account)
        return account
    
    def delete(self, db: Session, id: str, user_id: str) -> bool:
        """Delete a connected account for a user."""
        account = self.get(db, id, user_id)
        if not account:
            return False
        
        db.delete(account)
        db.commit()
        return True


# Singleton instance
connected_account_repository = ConnectedAccountRepository()

