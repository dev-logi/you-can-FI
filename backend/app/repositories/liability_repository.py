"""
Liability Repository

Data access for liabilities.
"""

import uuid
from typing import List, Dict
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.liability import Liability
from app.repositories.base import BaseRepository


class LiabilityRepository(BaseRepository[Liability]):
    """Repository for liability operations."""
    
    def __init__(self):
        super().__init__(Liability)
    
    def create(self, db: Session, obj_in: dict) -> Liability:
        """Create a new liability with auto-generated ID."""
        obj_in["id"] = str(uuid.uuid4())
        return super().create(db, obj_in)
    
    def get_by_category(self, db: Session, category: str) -> List[Liability]:
        """Get all liabilities in a category."""
        return db.query(Liability).filter(Liability.category == category).all()
    
    def get_total_balance(self, db: Session) -> float:
        """Get total balance of all liabilities."""
        result = db.query(func.coalesce(func.sum(Liability.balance), 0)).scalar()
        return float(result)
    
    def get_balance_by_category(self, db: Session) -> Dict[str, float]:
        """Get total balance grouped by category."""
        results = (
            db.query(Liability.category, func.sum(Liability.balance))
            .group_by(Liability.category)
            .all()
        )
        return {category: float(value) for category, value in results}
    
    def get_weighted_interest_rate(self, db: Session) -> float:
        """Get weighted average interest rate."""
        result = db.query(
            func.sum(Liability.balance * func.coalesce(Liability.interest_rate, 0)),
            func.sum(Liability.balance)
        ).first()
        
        weighted_rate, total_balance = result
        if not total_balance or total_balance == 0:
            return 0.0
        
        return float(weighted_rate) / float(total_balance)
    
    def get_count(self, db: Session) -> int:
        """Get count of all liabilities."""
        return db.query(Liability).count()


# Singleton instance
liability_repository = LiabilityRepository()

