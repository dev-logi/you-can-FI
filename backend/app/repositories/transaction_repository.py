"""
Transaction Repository

Data access for Plaid transactions.
"""

import uuid
from datetime import date
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.transaction import Transaction
from app.repositories.base import BaseRepository


class TransactionRepository(BaseRepository[Transaction]):
    """Repository for transaction operations."""
    
    def __init__(self):
        super().__init__(Transaction)
    
    def create(self, db: Session, obj_in: dict, user_id: str) -> Transaction:
        """Create a new transaction with auto-generated ID."""
        obj_in["id"] = str(uuid.uuid4())
        obj_in["user_id"] = user_id
        return super().create(db, obj_in)
    
    def get(self, db: Session, id: str, user_id: str) -> Optional[Transaction]:
        """Get a transaction by ID, ensuring it belongs to the user."""
        return db.query(Transaction).filter(
            Transaction.id == id,
            Transaction.user_id == user_id
        ).first()
    
    def get_by_plaid_transaction_id(self, db: Session, plaid_transaction_id: str) -> Optional[Transaction]:
        """Get a transaction by Plaid transaction ID."""
        return db.query(Transaction).filter(
            Transaction.plaid_transaction_id == plaid_transaction_id
        ).first()
    
    def get_by_user(
        self, 
        db: Session, 
        user_id: str, 
        limit: int = 100,
        offset: int = 0,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> List[Transaction]:
        """Get all transactions for a user with optional date filtering."""
        query = db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.is_hidden == False
        )
        
        if start_date:
            query = query.filter(Transaction.date >= start_date)
        if end_date:
            query = query.filter(Transaction.date <= end_date)
        
        return query.order_by(desc(Transaction.date)).offset(offset).limit(limit).all()
    
    def get_by_connected_account(
        self, 
        db: Session, 
        connected_account_id: str, 
        user_id: str,
        limit: int = 100,
        offset: int = 0,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> List[Transaction]:
        """Get all transactions for a specific connected account."""
        query = db.query(Transaction).filter(
            Transaction.connected_account_id == connected_account_id,
            Transaction.user_id == user_id,
            Transaction.is_hidden == False
        )
        
        if start_date:
            query = query.filter(Transaction.date >= start_date)
        if end_date:
            query = query.filter(Transaction.date <= end_date)
        
        return query.order_by(desc(Transaction.date)).offset(offset).limit(limit).all()
    
    def get_by_category(
        self, 
        db: Session, 
        user_id: str, 
        category: str,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Transaction]:
        """Get transactions by category."""
        return db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.category_primary == category,
            Transaction.is_hidden == False
        ).order_by(desc(Transaction.date)).offset(offset).limit(limit).all()
    
    def upsert_by_plaid_transaction_id(self, db: Session, obj_in: dict, user_id: str) -> Transaction:
        """
        Create or update a transaction based on plaid_transaction_id.
        Used during sync to handle both new and modified transactions.
        """
        plaid_transaction_id = obj_in.get('plaid_transaction_id')
        existing = self.get_by_plaid_transaction_id(db, plaid_transaction_id)
        
        if existing and existing.user_id == user_id:
            # Update existing transaction
            for field, value in obj_in.items():
                if value is not None and field not in ['id', 'user_id', 'created_at']:
                    setattr(existing, field, value)
            db.commit()
            db.refresh(existing)
            return existing
        else:
            # Create new transaction
            return self.create(db, obj_in, user_id)
    
    def delete_by_plaid_transaction_id(self, db: Session, plaid_transaction_id: str, user_id: str) -> bool:
        """Delete a transaction by Plaid transaction ID (used when Plaid removes transactions)."""
        transaction = db.query(Transaction).filter(
            Transaction.plaid_transaction_id == plaid_transaction_id,
            Transaction.user_id == user_id
        ).first()
        
        if transaction:
            db.delete(transaction)
            db.commit()
            return True
        return False
    
    def delete_by_connected_account(self, db: Session, connected_account_id: str, user_id: str) -> int:
        """Delete all transactions for a connected account (used when disconnecting)."""
        result = db.query(Transaction).filter(
            Transaction.connected_account_id == connected_account_id,
            Transaction.user_id == user_id
        ).delete()
        db.commit()
        return result
    
    def count_by_user(self, db: Session, user_id: str) -> int:
        """Count total transactions for a user."""
        return db.query(Transaction).filter(
            Transaction.user_id == user_id
        ).count()
    
    def count_by_connected_account(self, db: Session, connected_account_id: str, user_id: str) -> int:
        """Count transactions for a connected account."""
        return db.query(Transaction).filter(
            Transaction.connected_account_id == connected_account_id,
            Transaction.user_id == user_id
        ).count()
    
    def update(self, db: Session, id: str, obj_in: dict, user_id: str) -> Optional[Transaction]:
        """Update a transaction, ensuring it belongs to the user."""
        transaction = self.get(db, id, user_id)
        if not transaction:
            return None
        
        for field, value in obj_in.items():
            if value is not None:
                setattr(transaction, field, value)
        
        db.commit()
        db.refresh(transaction)
        return transaction


# Singleton instance
transaction_repository = TransactionRepository()
