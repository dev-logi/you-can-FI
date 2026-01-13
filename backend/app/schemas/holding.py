"""
Holding Schemas

Pydantic models for holding and security request/response validation.
"""

from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel


class SecurityResponse(BaseModel):
    """Schema for security response."""
    id: str
    plaid_security_id: str
    name: str
    ticker_symbol: Optional[str] = None
    is_cash_equivalent: bool = False
    type: Optional[str] = None
    close_price: Optional[float] = None
    close_price_as_of: Optional[date] = None
    iso_currency_code: Optional[str] = "USD"
    
    class Config:
        from_attributes = True


class HoldingResponse(BaseModel):
    """Schema for holding response."""
    id: str
    connected_account_id: str
    security_id: str
    security: Optional[SecurityResponse] = None
    
    institution_price: float
    institution_price_as_of: Optional[date] = None
    institution_value: float
    cost_basis: Optional[float] = None
    quantity: float
    iso_currency_code: Optional[str] = "USD"
    
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class HoldingListResponse(BaseModel):
    """Response for list of holdings."""
    holdings: List[HoldingResponse]
    total: int


class HoldingSyncResponse(BaseModel):
    """Response for holding sync operation."""
    success: bool
    message: str
    added: int = 0
    securities: int = 0
