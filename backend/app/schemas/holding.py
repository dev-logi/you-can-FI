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


# ========== Global Holdings (Grouped) Schemas ==========

class AccountInfo(BaseModel):
    """Brief info about an account holding a security."""
    account_id: str
    account_name: str
    institution_name: str
    quantity: float
    value: float


class AggregatedHolding(BaseModel):
    """A security aggregated across multiple accounts."""
    security_id: str
    security_name: str
    ticker_symbol: Optional[str] = None
    security_type: Optional[str] = None
    is_cash_equivalent: bool = False
    
    total_quantity: float
    total_value: float
    total_cost_basis: Optional[float] = None
    average_price: float
    
    accounts_count: int
    accounts: List[AccountInfo]


class HoldingGroup(BaseModel):
    """A group of holdings by security type."""
    type: str  # e.g., 'equity', 'etf', 'cryptocurrency'
    display_name: str  # e.g., 'Stocks', 'ETFs & Mutual Funds'
    total_value: float
    holdings_count: int
    holdings: List[AggregatedHolding]


class GlobalHoldingsResponse(BaseModel):
    """Response for all holdings grouped by type."""
    total_value: float
    total_holdings: int
    groups: List[HoldingGroup]
