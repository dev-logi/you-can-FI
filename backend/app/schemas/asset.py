"""
Asset Schemas

Pydantic models for asset request/response validation.
"""

from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class AssetCategory(str, Enum):
    """Valid asset categories."""
    CASH = "cash"
    SAVINGS = "savings"
    RETIREMENT_401K = "retirement_401k"
    RETIREMENT_IRA = "retirement_ira"
    RETIREMENT_ROTH = "retirement_roth"
    RETIREMENT_HSA = "retirement_hsa"
    RETIREMENT_PENSION = "retirement_pension"
    RETIREMENT_OTHER = "retirement_other"
    BROKERAGE = "brokerage"
    REAL_ESTATE_PRIMARY = "real_estate_primary"
    REAL_ESTATE_RENTAL = "real_estate_rental"
    REAL_ESTATE_LAND = "real_estate_land"
    VEHICLE = "vehicle"
    BUSINESS = "business"
    VALUABLES = "valuables"
    OTHER = "other"


class AssetBase(BaseModel):
    """Base asset schema with common fields."""
    category: AssetCategory
    name: str = Field(..., min_length=1, max_length=255)
    value: float = Field(..., ge=0)


class AssetCreate(AssetBase):
    """Schema for creating a new asset."""
    pass


class AssetUpdate(BaseModel):
    """Schema for updating an asset. All fields optional."""
    category: Optional[AssetCategory] = None
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    value: Optional[float] = Field(None, ge=0)


class AssetResponse(AssetBase):
    """Schema for asset response."""
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Category display information
ASSET_CATEGORY_INFO = {
    AssetCategory.CASH: {"label": "Cash & Checking", "color": "#4a7c59"},
    AssetCategory.SAVINGS: {"label": "Savings", "color": "#5a9b6a"},
    AssetCategory.RETIREMENT_401K: {"label": "401(k)", "color": "#1e3a5f"},
    AssetCategory.RETIREMENT_IRA: {"label": "Traditional IRA", "color": "#2d5a8a"},
    AssetCategory.RETIREMENT_ROTH: {"label": "Roth IRA", "color": "#3d6a9a"},
    AssetCategory.RETIREMENT_HSA: {"label": "HSA", "color": "#4d7aaa"},
    AssetCategory.RETIREMENT_PENSION: {"label": "Pension", "color": "#5d8aba"},
    AssetCategory.RETIREMENT_OTHER: {"label": "Other Retirement", "color": "#6d9aca"},
    AssetCategory.BROKERAGE: {"label": "Brokerage", "color": "#d4a84b"},
    AssetCategory.REAL_ESTATE_PRIMARY: {"label": "Primary Residence", "color": "#8b7355"},
    AssetCategory.REAL_ESTATE_RENTAL: {"label": "Rental Property", "color": "#9b8365"},
    AssetCategory.REAL_ESTATE_LAND: {"label": "Land", "color": "#ab9375"},
    AssetCategory.VEHICLE: {"label": "Vehicles", "color": "#636e72"},
    AssetCategory.BUSINESS: {"label": "Business", "color": "#2d3436"},
    AssetCategory.VALUABLES: {"label": "Valuables", "color": "#b8922f"},
    AssetCategory.OTHER: {"label": "Other Assets", "color": "#a0a0a0"},
}

