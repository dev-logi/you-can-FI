"""
Transaction Model

Represents financial transactions synced from Plaid.
"""

from datetime import datetime, date
from typing import Optional
from sqlalchemy import String, Float, DateTime, Date, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Transaction(Base):
    """
    Transaction database model.
    
    Stores transaction data synced from Plaid.
    
    Amount conventions:
    - Positive amounts: money leaving the account (expenses, purchases)
    - Negative amounts: money entering the account (income, refunds)
    (This matches Plaid's convention)
    """
    
    __tablename__ = "transactions"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    connected_account_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    
    # Plaid identifiers
    plaid_transaction_id: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    plaid_account_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    
    # Transaction details
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    iso_currency_code: Mapped[Optional[str]] = mapped_column(String(3), nullable=True, default="USD")
    
    # Date fields
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    authorized_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    
    # Merchant/Name info
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    merchant_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Categories (Plaid provides these)
    category_primary: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    category_detailed: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Payment metadata
    payment_channel: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # 'online', 'in store', 'other'
    
    # Status
    pending: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    
    # Location info (optional)
    location_city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    location_region: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    location_country: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # User customization (for future use)
    user_category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # User can override category
    user_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_hidden: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)  # User can hide transactions
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, 
        nullable=False, 
        default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, 
        nullable=False, 
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    
    def __repr__(self) -> str:
        return f"<Transaction(id={self.id}, name={self.name}, amount={self.amount}, date={self.date})>"
