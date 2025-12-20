"""
Asset Repository

Data access for assets.
"""

import uuid
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.asset import Asset
from app.repositories.base import BaseRepository


class AssetRepository(BaseRepository[Asset]):
    """Repository for asset operations."""
    
    def __init__(self):
        super().__init__(Asset)
    
    def create(self, db: Session, obj_in: dict, user_id: str) -> Asset:
        """Create a new asset with auto-generated ID."""
        obj_in["id"] = str(uuid.uuid4())
        obj_in["user_id"] = user_id
        return super().create(db, obj_in)
    
    def get_by_category(self, db: Session, category: str, user_id: str) -> List[Asset]:
        """Get all assets in a category for a user."""
        return db.query(Asset).filter(
            Asset.category == category,
            Asset.user_id == user_id
        ).all()
    
    def get_total_value(self, db: Session, user_id: str) -> float:
        """Get total value of all assets for a user."""
        result = db.query(func.coalesce(func.sum(Asset.value), 0)).filter(
            Asset.user_id == user_id
        ).scalar()
        return float(result)
    
    def get_value_by_category(self, db: Session, user_id: str) -> Dict[str, float]:
        """Get total value grouped by category for a user."""
        results = (
            db.query(Asset.category, func.sum(Asset.value))
            .filter(Asset.user_id == user_id)
            .group_by(Asset.category)
            .all()
        )
        return {category: float(value) for category, value in results}
    
    def get_count(self, db: Session, user_id: str) -> int:
        """Get count of all assets for a user."""
        return db.query(Asset).filter(Asset.user_id == user_id).count()
    
    def get_all(self, db: Session, user_id: str) -> List[Asset]:
        """Get all assets for a user."""
        return db.query(Asset).filter(Asset.user_id == user_id).all()
    
    def get(self, db: Session, id: str, user_id: str) -> Optional[Asset]:
        """Get an asset by ID for a user."""
        return db.query(Asset).filter(
            Asset.id == id,
            Asset.user_id == user_id
        ).first()
    
    def update(self, db: Session, id: str, obj_in: dict, user_id: str) -> Optional[Asset]:
        """Update an asset for a user."""
        asset = self.get(db, id, user_id)
        if not asset:
            return None
        
        # Update fields directly instead of calling super().update()
        for field, value in obj_in.items():
            if value is not None:
                setattr(asset, field, value)
        
        db.commit()
        db.refresh(asset)
        return asset
    
    def delete(self, db: Session, id: str, user_id: str) -> bool:
        """Delete an asset for a user."""
        asset = self.get(db, id, user_id)
        if not asset:
            return False
        
        db.delete(asset)
        db.commit()
        return True


# Singleton instance
asset_repository = AssetRepository()

