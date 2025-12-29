"""
Connected Account Model

Tracks Plaid account connections and metadata.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class ConnectedAccount(Base):
    """
    Connected account database model.
    
    Stores Plaid connection information and tracks sync status.
    """
    
    __tablename__ = "connected_accounts"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    
    # Plaid identifiers
    plaid_item_id: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    plaid_access_token: Mapped[str] = mapped_column(Text, nullable=False)  # Encrypted
    plaid_account_id: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    
    # Account metadata
    institution_name: Mapped[str] = mapped_column(String(255), nullable=False)
    account_name: Mapped[str] = mapped_column(String(255), nullable=False)
    account_type: Mapped[str] = mapped_column(String(50), nullable=False)  # 'depository', 'credit', 'loan', etc.
    account_subtype: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # 'checking', 'savings', 'credit card', etc.
    
    # Status tracking
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    last_synced_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_sync_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
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
        return f"<ConnectedAccount(id={self.id}, institution={self.institution_name}, account={self.account_name})>"

