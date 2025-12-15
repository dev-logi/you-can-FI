"""
Asset Repository

Data access for assets.
"""

import uuid
from typing import List, Dict
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.asset import Asset
from app.repositories.base import BaseRepository


class AssetRepository(BaseRepository[Asset]):
    """Repository for asset operations."""
    
    def __init__(self):
        super().__init__(Asset)
    
    def create(self, db: Session, obj_in: dict) -> Asset:
        """Create a new asset with auto-generated ID."""
        obj_in["id"] = str(uuid.uuid4())
        return super().create(db, obj_in)
    
    def get_by_category(self, db: Session, category: str) -> List[Asset]:
        """Get all assets in a category."""
        return db.query(Asset).filter(Asset.category == category).all()
    
    def get_total_value(self, db: Session) -> float:
        """Get total value of all assets."""
        result = db.query(func.coalesce(func.sum(Asset.value), 0)).scalar()
        return float(result)
    
    def get_value_by_category(self, db: Session) -> Dict[str, float]:
        """Get total value grouped by category."""
        results = (
            db.query(Asset.category, func.sum(Asset.value))
            .group_by(Asset.category)
            .all()
        )
        return {category: float(value) for category, value in results}
    
    def get_count(self, db: Session) -> int:
        """Get count of all assets."""
        return db.query(Asset).count()


# Singleton instance
asset_repository = AssetRepository()

