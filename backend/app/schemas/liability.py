"""
Liability Schemas

Pydantic models for liability request/response validation.
"""

from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class LiabilityCategory(str, Enum):
    """Valid liability categories."""
    MORTGAGE = "mortgage"
    CREDIT_CARD = "credit_card"
    AUTO_LOAN = "auto_loan"
    STUDENT_LOAN = "student_loan"
    PERSONAL_LOAN = "personal_loan"
    OTHER = "other"


class LiabilityBase(BaseModel):
    """Base liability schema with common fields."""
    category: LiabilityCategory
    name: str = Field(..., min_length=1, max_length=255)
    balance: float = Field(..., ge=0)
    interest_rate: Optional[float] = Field(None, ge=0, le=100)


class LiabilityCreate(LiabilityBase):
    """Schema for creating a new liability."""
    pass


class LiabilityUpdate(BaseModel):
    """Schema for updating a liability. All fields optional."""
    category: Optional[LiabilityCategory] = None
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    balance: Optional[float] = Field(None, ge=0)
    interest_rate: Optional[float] = Field(None, ge=0, le=100)


class LiabilityResponse(LiabilityBase):
    """Schema for liability response."""
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Category display information
LIABILITY_CATEGORY_INFO = {
    LiabilityCategory.MORTGAGE: {"label": "Mortgage", "color": "#c75c5c"},
    LiabilityCategory.CREDIT_CARD: {"label": "Credit Cards", "color": "#d77070"},
    LiabilityCategory.AUTO_LOAN: {"label": "Auto Loan", "color": "#e78484"},
    LiabilityCategory.STUDENT_LOAN: {"label": "Student Loans", "color": "#f79898"},
    LiabilityCategory.PERSONAL_LOAN: {"label": "Personal Loan", "color": "#e7a8a8"},
    LiabilityCategory.OTHER: {"label": "Other Debt", "color": "#c7b8b8"},
}

