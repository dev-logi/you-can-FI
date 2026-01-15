"""
Connected Account Repository

Data access for connected Plaid accounts.
"""

import uuid
from typing import List, Optional
from sqlalchemy.orm import Session

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
    
    def get_by_plaid_account_id(self, db: Session, plaid_account_id: str) -> Optional[ConnectedAccount]:
        """Get connected account by Plaid account ID."""
        return db.query(ConnectedAccount).filter(
            ConnectedAccount.plaid_account_id == plaid_account_id
        ).first()
    
    def get_by_plaid_item_id(self, db: Session, plaid_item_id: str) -> List[ConnectedAccount]:
        """Get all connected accounts for a Plaid item (institution)."""
        return db.query(ConnectedAccount).filter(
            ConnectedAccount.plaid_item_id == plaid_item_id
        ).all()
    
    def get_by_plaid_item_id_and_user(self, db: Session, plaid_item_id: str, user_id: str) -> List[ConnectedAccount]:
        """Get all connected accounts for a Plaid item belonging to a specific user."""
        return db.query(ConnectedAccount).filter(
            ConnectedAccount.plaid_item_id == plaid_item_id,
            ConnectedAccount.user_id == user_id
        ).all()
    
    def upsert_by_plaid_account_id(self, db: Session, obj_in: dict, user_id: str) -> ConnectedAccount:
        """
        Create or update a connected account based on plaid_account_id.
        If account exists, update it. If not, create it.
        """
        plaid_account_id = obj_in.get('plaid_account_id')
        existing = self.get_by_plaid_account_id(db, plaid_account_id)
        
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

