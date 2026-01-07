"""
Plaid Schemas

Pydantic models for Plaid API request/response validation.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class LinkTokenResponse(BaseModel):
    """Response for link token creation."""
    link_token: str


class ExchangeTokenRequest(BaseModel):
    """Request to exchange public token for access token."""
    public_token: str


class ExchangeTokenResponse(BaseModel):
    """Response after exchanging public token."""
    item_id: str
    access_token: str  # Note: This should be encrypted before storing


class ConnectedAccountResponse(BaseModel):
    """Response for connected account information."""
    id: str
    institution_name: str
    account_name: str
    account_type: str
    account_subtype: Optional[str]
    is_active: bool
    last_synced_at: Optional[datetime]
    last_sync_error: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class ConnectedAccountListResponse(BaseModel):
    """Response for list of connected accounts."""
    accounts: List[ConnectedAccountResponse]


class SyncResponse(BaseModel):
    """Response for sync operation."""
    success: bool
    message: str
    total: Optional[int] = None
    successful: Optional[int] = None
    failed: Optional[int] = None
    errors: Optional[List[dict]] = None


class LinkAccountRequest(BaseModel):
    """Request to link a Plaid account to an existing asset/liability."""
    # Note: connected_account_id is passed in URL path, not body
    entity_id: str  # Asset or Liability ID
    entity_type: str = Field(..., pattern="^(asset|liability)$")  # 'asset' or 'liability'


class PlaidAccountInfo(BaseModel):
    """Information about a Plaid account (before linking)."""
    account_id: str
    name: str
    type: str
    subtype: Optional[str]
    mask: Optional[str]  # Last 4 digits
    suggested_category: Optional[str]  # Our category suggestion
    is_asset: bool  # True if asset, False if liability

