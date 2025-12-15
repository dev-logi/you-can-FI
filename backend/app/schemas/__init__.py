"""
Pydantic Schemas

Request/response validation schemas for API endpoints.
"""

from app.schemas.asset import (
    AssetCreate,
    AssetUpdate,
    AssetResponse,
    AssetCategory,
)
from app.schemas.liability import (
    LiabilityCreate,
    LiabilityUpdate,
    LiabilityResponse,
    LiabilityCategory,
)
from app.schemas.net_worth import (
    NetWorthSummary,
    CategoryBreakdown,
)
from app.schemas.onboarding import (
    OnboardingStateResponse,
    OnboardingAnswerRequest,
    DataEntryTask,
    TaskCompleteRequest,
)

__all__ = [
    "AssetCreate",
    "AssetUpdate", 
    "AssetResponse",
    "AssetCategory",
    "LiabilityCreate",
    "LiabilityUpdate",
    "LiabilityResponse",
    "LiabilityCategory",
    "NetWorthSummary",
    "CategoryBreakdown",
    "OnboardingStateResponse",
    "OnboardingAnswerRequest",
    "DataEntryTask",
    "TaskCompleteRequest",
]

