"""
Security Repository

Data access for securities.
"""

import uuid
from typing import Optional
from sqlalchemy.orm import Session

from app.models.security import Security
from app.repositories.base import BaseRepository


class SecurityRepository(BaseRepository[Security]):
    """Repository for security operations."""
    
    def __init__(self):
        super().__init__(Security)
    
    def get_by_plaid_id(self, db: Session, plaid_security_id: str) -> Optional[Security]:
        """Get a security by its Plaid ID."""
        return db.query(Security).filter(Security.plaid_security_id == plaid_security_id).first()
    
    def upsert_by_plaid_id(self, db: Session, obj_in: dict) -> Security:
        """Create or update a security by its Plaid ID."""
        plaid_id = obj_in.get('plaid_security_id')
        security = self.get_by_plaid_id(db, plaid_id)
        
        if security:
            # Update
            for field, value in obj_in.items():
                setattr(security, field, value)
            db.commit()
            db.refresh(security)
            return security
        else:
            # Create
            obj_in['id'] = str(uuid.uuid4())
            return super().create(db, obj_in)


# Singleton instance
security_repository = SecurityRepository()
