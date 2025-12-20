"""
Liability Repository

Data access for liabilities.
"""

import uuid
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.liability import Liability
from app.repositories.base import BaseRepository


class LiabilityRepository(BaseRepository[Liability]):
    """Repository for liability operations."""
    
    def __init__(self):
        super().__init__(Liability)
    
    def create(self, db: Session, obj_in: dict, user_id: str) -> Liability:
        """Create a new liability with auto-generated ID."""
        obj_in["id"] = str(uuid.uuid4())
        obj_in["user_id"] = user_id
        return super().create(db, obj_in)
    
    def get_by_category(self, db: Session, category: str, user_id: str) -> List[Liability]:
        """Get all liabilities in a category for a user."""
        return db.query(Liability).filter(
            Liability.category == category,
            Liability.user_id == user_id
        ).all()
    
    def get_total_balance(self, db: Session, user_id: str) -> float:
        """Get total balance of all liabilities for a user."""
        result = db.query(func.coalesce(func.sum(Liability.balance), 0)).filter(
            Liability.user_id == user_id
        ).scalar()
        return float(result)
    
    def get_balance_by_category(self, db: Session, user_id: str) -> Dict[str, float]:
        """Get total balance grouped by category for a user."""
        results = (
            db.query(Liability.category, func.sum(Liability.balance))
            .filter(Liability.user_id == user_id)
            .group_by(Liability.category)
            .all()
        )
        return {category: float(value) for category, value in results}
    
    def get_weighted_interest_rate(self, db: Session, user_id: str) -> float:
        """Get weighted average interest rate for a user."""
        result = db.query(
            func.sum(Liability.balance * func.coalesce(Liability.interest_rate, 0)),
            func.sum(Liability.balance)
        ).filter(Liability.user_id == user_id).first()
        
        weighted_rate, total_balance = result
        if not total_balance or total_balance == 0:
            return 0.0
        
        return float(weighted_rate) / float(total_balance)
    
    def get_count(self, db: Session, user_id: str) -> int:
        """Get count of all liabilities for a user."""
        return db.query(Liability).filter(Liability.user_id == user_id).count()
    
    def get_all(self, db: Session, user_id: str) -> List[Liability]:
        """Get all liabilities for a user."""
        return db.query(Liability).filter(Liability.user_id == user_id).all()
    
    def get(self, db: Session, id: str, user_id: str) -> Optional[Liability]:
        """Get a liability by ID for a user."""
        return db.query(Liability).filter(
            Liability.id == id,
            Liability.user_id == user_id
        ).first()
    
    def update(self, db: Session, id: str, obj_in: dict, user_id: str) -> Optional[Liability]:
        """Update a liability for a user."""
        liability = self.get(db, id, user_id)
        if not liability:
            return None
        
        # Update fields directly instead of calling super().update()
        for field, value in obj_in.items():
            if value is not None:
                setattr(liability, field, value)
        
        db.commit()
        db.refresh(liability)
        return liability
    
    def delete(self, db: Session, id: str, user_id: str) -> bool:
        """Delete a liability for a user."""
        liability = self.get(db, id, user_id)
        if not liability:
            return False
        
        db.delete(liability)
        db.commit()
        return True


# Singleton instance
liability_repository = LiabilityRepository()

