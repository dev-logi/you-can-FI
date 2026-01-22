"""
Transaction Repository

Data access for Plaid transactions.
"""

import uuid
from datetime import date
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, func

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
        category: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[Transaction]:
        """Get all transactions for a user with optional filtering."""
        query = db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.is_hidden == False
        )
        
        if start_date:
            query = query.filter(Transaction.date >= start_date)
        if end_date:
            query = query.filter(Transaction.date <= end_date)
        if category:
            query = query.filter(
                or_(
                    Transaction.category_primary == category,
                    Transaction.user_category == category
                )
            )
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Transaction.name.ilike(search_pattern),
                    Transaction.merchant_name.ilike(search_pattern)
                )
            )
        
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
        category: Optional[str] = None,
        search: Optional[str] = None,
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
        if category:
            query = query.filter(
                or_(
                    Transaction.category_primary == category,
                    Transaction.user_category == category
                )
            )
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Transaction.name.ilike(search_pattern),
                    Transaction.merchant_name.ilike(search_pattern)
                )
            )
        
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
    
    def count_by_user(
        self, 
        db: Session, 
        user_id: str,
        category: Optional[str] = None,
        search: Optional[str] = None,
    ) -> int:
        """Count total transactions for a user with optional filters."""
        query = db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.is_hidden == False
        )
        
        if category:
            query = query.filter(
                or_(
                    Transaction.category_primary == category,
                    Transaction.user_category == category
                )
            )
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Transaction.name.ilike(search_pattern),
                    Transaction.merchant_name.ilike(search_pattern)
                )
            )
        
        return query.count()
    
    def count_by_connected_account(
        self, 
        db: Session, 
        connected_account_id: str, 
        user_id: str,
        category: Optional[str] = None,
        search: Optional[str] = None,
    ) -> int:
        """Count transactions for a connected account with optional filters."""
        query = db.query(Transaction).filter(
            Transaction.connected_account_id == connected_account_id,
            Transaction.user_id == user_id,
            Transaction.is_hidden == False
        )
        
        if category:
            query = query.filter(
                or_(
                    Transaction.category_primary == category,
                    Transaction.user_category == category
                )
            )
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Transaction.name.ilike(search_pattern),
                    Transaction.merchant_name.ilike(search_pattern)
                )
            )
        
        return query.count()
    
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
    
    def get_merchant_summary(
        self,
        db: Session,
        user_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        account_id: Optional[str] = None,
        limit: int = 50,
    ) -> List[dict]:
        """Get spending summary grouped by merchant."""
        query = db.query(
            func.coalesce(Transaction.merchant_name, Transaction.name).label('merchant_name'),
            func.sum(Transaction.amount).label('total_amount'),
            func.count(Transaction.id).label('transaction_count'),
            func.max(Transaction.date).label('last_transaction_date'),
            func.max(Transaction.category_primary).label('category'),
        ).filter(
            Transaction.user_id == user_id,
            Transaction.is_hidden == False,
            Transaction.amount > 0,  # Only expenses (positive amounts from Plaid)
        )
        
        if account_id:
            query = query.filter(Transaction.connected_account_id == account_id)
        if start_date:
            query = query.filter(Transaction.date >= start_date)
        if end_date:
            query = query.filter(Transaction.date <= end_date)
        
        results = query.group_by(
            func.coalesce(Transaction.merchant_name, Transaction.name)
        ).order_by(
            desc(func.sum(Transaction.amount))
        ).limit(limit).all()
        
        return [
            {
                'merchant_name': r.merchant_name or 'Unknown',
                'total_amount': float(r.total_amount),
                'transaction_count': r.transaction_count,
                'last_transaction_date': r.last_transaction_date,
                'category': r.category,
            }
            for r in results
        ]


# Singleton instance
transaction_repository = TransactionRepository()
