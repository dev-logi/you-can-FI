"""
Transaction Schemas

Pydantic models for transaction request/response validation.
"""

from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel


class TransactionResponse(BaseModel):
    """Schema for transaction response."""
    id: str
    connected_account_id: str
    plaid_transaction_id: str
    
    # Transaction details
    amount: float
    iso_currency_code: Optional[str] = "USD"
    date: date
    authorized_date: Optional[date] = None
    
    # Merchant info
    name: str
    merchant_name: Optional[str] = None
    
    # Categories
    category_primary: Optional[str] = None
    category_detailed: Optional[str] = None
    
    # Payment info
    payment_channel: Optional[str] = None
    pending: bool = False
    
    # Location
    location_city: Optional[str] = None
    location_region: Optional[str] = None
    location_country: Optional[str] = None
    
    # User customization
    user_category: Optional[str] = None
    user_notes: Optional[str] = None
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class TransactionListResponse(BaseModel):
    """Response for list of transactions."""
    transactions: List[TransactionResponse]
    total: int
    limit: int
    offset: int


class TransactionSyncResponse(BaseModel):
    """Response for transaction sync operation."""
    success: bool
    message: str
    added: int = 0
    modified: int = 0
    removed: int = 0


class TransactionSyncAllResponse(BaseModel):
    """Response for syncing all accounts."""
    success: bool
    message: str
    total_accounts: int
    successful: int
    failed: int
    total_added: int
    total_modified: int
    total_removed: int
    errors: Optional[List[dict]] = None


class TransactionUpdateRequest(BaseModel):
    """Request to update user-customizable transaction fields."""
    user_category: Optional[str] = None
    user_notes: Optional[str] = None
    is_hidden: Optional[bool] = None


class MerchantSummary(BaseModel):
    """Summary of spending by merchant."""
    merchant_name: str
    total_amount: float
    transaction_count: int
    last_transaction_date: date
    category: Optional[str] = None


class MerchantListResponse(BaseModel):
    """Response for merchant list."""
    merchants: List[MerchantSummary]
    total: int
