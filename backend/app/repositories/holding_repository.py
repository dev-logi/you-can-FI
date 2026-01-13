"""
Holding Repository

Data access for holdings.
"""

import uuid
from typing import List
from sqlalchemy.orm import Session

from app.models.holding import Holding
from app.repositories.base import BaseRepository


class HoldingRepository(BaseRepository[Holding]):
    """Repository for holding operations."""
    
    def __init__(self):
        super().__init__(Holding)
    
    def get_by_account(self, db: Session, connected_account_id: str, user_id: str) -> List[Holding]:
        """Get all holdings for a specific connected account."""
        return db.query(Holding).filter(
            Holding.connected_account_id == connected_account_id,
            Holding.user_id == user_id
        ).all()
    
    def get_by_user(self, db: Session, user_id: str) -> List[Holding]:
        """Get all holdings for a user across all accounts."""
        return db.query(Holding).filter(Holding.user_id == user_id).all()
    
    def delete_by_account(self, db: Session, connected_account_id: str, user_id: str) -> int:
        """Delete all holdings for an account (used before refresh)."""
        count = db.query(Holding).filter(
            Holding.connected_account_id == connected_account_id,
            Holding.user_id == user_id
        ).delete()
        db.commit()
        return count
    
    def create(self, db: Session, obj_in: dict, user_id: str) -> Holding:
        """Create a new holding."""
        obj_in['id'] = str(uuid.uuid4())
        obj_in['user_id'] = user_id
        return super().create(db, obj_in)


# Singleton instance
holding_repository = HoldingRepository()
