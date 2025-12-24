"""
Onboarding Schemas

Pydantic models for onboarding flow state and requests.
"""

from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Union
from pydantic import BaseModel, Field


class HouseholdType(str, Enum):
    """Household type options."""
    INDIVIDUAL = "individual"
    COUPLE = "couple"
    FAMILY = "family"


class DataEntryTask(BaseModel):
    """A task for the user to enter data."""
    id: str
    type: str  # "asset" or "liability"
    category: str
    default_name: str
    is_completed: bool = False
    entity_id: Optional[str] = None


class OnboardingStateResponse(BaseModel):
    """Onboarding state response."""
    id: str
    current_step_id: str
    household_type: Optional[str]
    answers: Dict[str, Union[str, List[str]]]
    tasks: List[DataEntryTask]
    completed_task_ids: List[str]
    is_complete: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class OnboardingStartRequest(BaseModel):
    """Request to start or resume onboarding."""
    pass  # No fields needed - will create default or return existing


class OnboardingAnswerRequest(BaseModel):
    """Request to save an answer."""
    question_id: str
    answer: Union[str, List[str]]
    # Optional count for itemization (yes/no questions)
    count: Optional[int] = Field(None, ge=1, le=50)
    # Optional counts dict for itemization (multi-select questions)
    # e.g., {"401k": 2, "roth": 1}
    counts: Optional[Dict[str, int]] = Field(None)


class OnboardingHouseholdRequest(BaseModel):
    """Request to set household type."""
    household_type: HouseholdType


class TaskCompleteRequest(BaseModel):
    """Request to complete a data entry task."""
    task_id: str
    name: str = Field(..., min_length=1, max_length=255)
    value: float = Field(..., ge=0)
    interest_rate: Optional[float] = Field(None, ge=0, le=100)


class TaskSkipRequest(BaseModel):
    """Request to skip a task."""
    task_id: str


class OnboardingProgress(BaseModel):
    """Onboarding progress info."""
    current_step: int
    total_steps: int
    percentage: float

