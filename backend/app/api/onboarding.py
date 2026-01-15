"""
Onboarding API Routes

Onboarding flow state management.
"""

from typing import List, Union
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.services.onboarding_service import onboarding_service
from app.schemas.onboarding import (
    OnboardingStateResponse,
    OnboardingAnswerRequest,
    OnboardingHouseholdRequest,
    TaskCompleteRequest,
    TaskSkipRequest,
    OnboardingProgress,
    DataEntryTask,
)

router = APIRouter()


class AnswerResponse(BaseModel):
    """Response after answering a question."""
    next_question_id: str | None
    tasks_generated: List[DataEntryTask]


class StatusResponse(BaseModel):
    """Simple status response."""
    is_complete: bool


@router.get("", response_model=OnboardingStateResponse)
@router.get("/", response_model=OnboardingStateResponse)
def get_or_create_onboarding(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """
    Get current onboarding state or create new one.
    Use this to start or resume onboarding.
    """
    import logging
    logger = logging.getLogger(__name__)
    try:
        logger.info(f"[Onboarding] get_or_create_onboarding for user {user_id}")
        result = onboarding_service.get_or_create_state(db, user_id)
        logger.info(f"[Onboarding] Successfully got state: {result.id}")
        return result
    except Exception as e:
        logger.error(f"[Onboarding] Error in get_or_create_onboarding: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get onboarding state: {str(e)}"
        )


@router.get("/status", response_model=StatusResponse)
def get_onboarding_status(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Check if onboarding is complete."""
    return StatusResponse(is_complete=onboarding_service.is_complete(db, user_id))


@router.get("/progress", response_model=OnboardingProgress)
def get_onboarding_progress(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Get onboarding progress."""
    return onboarding_service.get_progress(db, user_id)


@router.post("/answer", response_model=AnswerResponse)
def answer_question(
    request: OnboardingAnswerRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """
    Answer a question in the onboarding flow.
    Returns the next question ID and any tasks generated.
    
    For itemization:
    - Yes/No questions: Use 'count' field (e.g., count=3 creates 3 tasks)
    - Multi-select questions: Use 'counts' dict (e.g., {"401k": 2, "roth": 1})
    """
    # Validate count if provided
    if request.count is not None:
        if request.count < 1 or request.count > 50:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Count must be between 1 and 50"
            )
    
    # Validate counts dict if provided
    if request.counts:
        for option, count in request.counts.items():
            if count < 1 or count > 50:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Count for '{option}' must be between 1 and 50"
                )
    
    next_question_id, tasks = onboarding_service.answer_question(
        db, 
        request.question_id, 
        request.answer,
        user_id,
        count=request.count,
        counts=request.counts
    )
    return AnswerResponse(
        next_question_id=next_question_id,
        tasks_generated=tasks,
    )


@router.post("/household")
def set_household_type(
    request: OnboardingHouseholdRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Set the household type."""
    onboarding_service.set_household_type(db, request.household_type.value, user_id)
    return {"status": "ok"}


@router.post("/task/complete")
def complete_task(
    request: TaskCompleteRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """
    Complete a data entry task by creating the asset/liability.
    """
    try:
        entity_id = onboarding_service.complete_task(
            db,
            request.task_id,
            request.name,
            request.value,
            request.interest_rate,
            user_id
        )
        return {"status": "ok", "entity_id": entity_id}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.post("/task/skip")
def skip_task(
    request: TaskSkipRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Skip a task without creating an entity."""
    onboarding_service.skip_task(db, request.task_id, user_id)
    return {"status": "ok"}


@router.post("/complete")
def complete_onboarding(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Mark onboarding as complete."""
    onboarding_service.complete_onboarding(db, user_id)
    return {"status": "ok"}


@router.post("/go-to-step")
def go_to_step(
    step_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Navigate to a specific step."""
    onboarding_service.go_to_step(db, step_id, user_id)
    return {"status": "ok"}


@router.delete("/reset")
def reset_onboarding(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """
    Reset onboarding and delete all data.
    WARNING: This deletes all assets and liabilities for the current user!
    """
    onboarding_service.reset(db, user_id)
    return {"status": "ok"}

