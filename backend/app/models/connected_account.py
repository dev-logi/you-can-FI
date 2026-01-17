"""
Connected Account Model

Tracks account connections from any aggregator provider (Plaid, Finicity, etc.)
and their metadata.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class ConnectedAccount(Base):
    """
    Connected account database model.
    
    Stores aggregator connection information and tracks sync status.
    Supports multiple providers (Plaid, Finicity, Yodlee, MX, etc.)
    through provider-agnostic field names.
    """
    
    __tablename__ = "connected_accounts"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    
    # Provider info (provider-agnostic)
    provider: Mapped[str] = mapped_column(String(50), nullable=False, default='plaid')  # 'plaid', 'finicity', etc.
    provider_item_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)  # Provider's connection/item ID
    provider_access_token: Mapped[str] = mapped_column(Text, nullable=False)  # Encrypted access token
    provider_account_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)  # Provider's account ID
    
    # Legacy Plaid fields (kept for backward compatibility during migration)
    # These will be deprecated after migration is complete
    plaid_item_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    plaid_access_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    plaid_account_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    
    # Institution metadata
    institution_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # Provider's institution ID
    institution_name: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Account metadata
    account_name: Mapped[str] = mapped_column(String(255), nullable=False)
    account_type: Mapped[str] = mapped_column(String(50), nullable=False)  # 'depository', 'credit', 'loan', 'investment', etc.
    account_subtype: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # 'checking', 'savings', 'credit_card', etc.
    account_mask: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)  # Last 4 digits
    
    # Status tracking
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    last_synced_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_sync_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Sync cursor (provider-agnostic, for incremental sync)
    sync_cursor: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Legacy transaction cursor (kept for backward compatibility)
    transactions_cursor: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
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
        return f"<ConnectedAccount(id={self.id}, provider={self.provider}, institution={self.institution_name}, account={self.account_name})>"
    
    @property
    def is_plaid(self) -> bool:
        """Check if this account is connected via Plaid."""
        return self.provider == 'plaid'
    
    @property
    def is_finicity(self) -> bool:
        """Check if this account is connected via Finicity."""
        return self.provider == 'finicity'
    
    def get_access_token(self) -> str:
        """Get the access token (uses provider-agnostic field, falls back to legacy)."""
        return self.provider_access_token or self.plaid_access_token or ''
    
    def get_item_id(self) -> str:
        """Get the item/connection ID (uses provider-agnostic field, falls back to legacy)."""
        return self.provider_item_id or self.plaid_item_id or ''
    
    def get_account_id(self) -> str:
        """Get the account ID (uses provider-agnostic field, falls back to legacy)."""
        return self.provider_account_id or self.plaid_account_id or ''
    
    def get_sync_cursor(self) -> Optional[str]:
        """Get the sync cursor (uses provider-agnostic field, falls back to legacy)."""
        return self.sync_cursor or self.transactions_cursor

