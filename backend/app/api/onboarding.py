"""
Onboarding API Routes

Onboarding flow state management.
"""

from typing import List, Union
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
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


@router.get("/", response_model=OnboardingStateResponse)
def get_or_create_onboarding(db: Session = Depends(get_db)):
    """
    Get current onboarding state or create new one.
    Use this to start or resume onboarding.
    """
    return onboarding_service.get_or_create_state(db)


@router.get("/status", response_model=StatusResponse)
def get_onboarding_status(db: Session = Depends(get_db)):
    """Check if onboarding is complete."""
    return StatusResponse(is_complete=onboarding_service.is_complete(db))


@router.get("/progress", response_model=OnboardingProgress)
def get_onboarding_progress(db: Session = Depends(get_db)):
    """Get onboarding progress."""
    return onboarding_service.get_progress(db)


@router.post("/answer", response_model=AnswerResponse)
def answer_question(request: OnboardingAnswerRequest, db: Session = Depends(get_db)):
    """
    Answer a question in the onboarding flow.
    Returns the next question ID and any tasks generated.
    """
    next_question_id, tasks = onboarding_service.answer_question(
        db, 
        request.question_id, 
        request.answer
    )
    return AnswerResponse(
        next_question_id=next_question_id,
        tasks_generated=tasks,
    )


@router.post("/household")
def set_household_type(request: OnboardingHouseholdRequest, db: Session = Depends(get_db)):
    """Set the household type."""
    onboarding_service.set_household_type(db, request.household_type.value)
    return {"status": "ok"}


@router.post("/task/complete")
def complete_task(request: TaskCompleteRequest, db: Session = Depends(get_db)):
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
        )
        return {"status": "ok", "entity_id": entity_id}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.post("/task/skip")
def skip_task(request: TaskSkipRequest, db: Session = Depends(get_db)):
    """Skip a task without creating an entity."""
    onboarding_service.skip_task(db, request.task_id)
    return {"status": "ok"}


@router.post("/complete")
def complete_onboarding(db: Session = Depends(get_db)):
    """Mark onboarding as complete."""
    onboarding_service.complete_onboarding(db)
    return {"status": "ok"}


@router.post("/go-to-step")
def go_to_step(step_id: str, db: Session = Depends(get_db)):
    """Navigate to a specific step."""
    onboarding_service.go_to_step(db, step_id)
    return {"status": "ok"}


@router.delete("/reset")
def reset_onboarding(db: Session = Depends(get_db)):
    """
    Reset onboarding and delete all data.
    WARNING: This deletes all assets and liabilities!
    """
    onboarding_service.reset(db)
    return {"status": "ok"}

