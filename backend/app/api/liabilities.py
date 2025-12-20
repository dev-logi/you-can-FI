"""
Liability API Routes

CRUD operations for liabilities.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.repositories.liability_repository import liability_repository
from app.schemas.liability import LiabilityCreate, LiabilityUpdate, LiabilityResponse

router = APIRouter()


@router.post("/", response_model=LiabilityResponse, status_code=status.HTTP_201_CREATED)
def create_liability(
    liability: LiabilityCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Create a new liability."""
    return liability_repository.create(db, liability.model_dump(), user_id)


@router.get("/", response_model=List[LiabilityResponse])
def list_liabilities(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Get all liabilities for the current user."""
    liabilities = liability_repository.get_all(db, user_id)
    return liabilities[skip:skip + limit]


@router.get("/{liability_id}", response_model=LiabilityResponse)
def get_liability(
    liability_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Get a liability by ID."""
    liability = liability_repository.get(db, liability_id, user_id)
    if not liability:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Liability {liability_id} not found"
        )
    return liability


@router.put("/{liability_id}", response_model=LiabilityResponse)
def update_liability(
    liability_id: str,
    liability: LiabilityUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Update a liability."""
    # Filter out None values
    update_data = {k: v for k, v in liability.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid update data provided"
        )
    
    updated = liability_repository.update(db, liability_id, update_data, user_id)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Liability {liability_id} not found"
        )
    return updated


@router.delete("/{liability_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_liability(
    liability_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Delete a liability."""
    deleted = liability_repository.delete(db, liability_id, user_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Liability {liability_id} not found"
        )
    return None


@router.get("/category/{category}", response_model=List[LiabilityResponse])
def get_liabilities_by_category(
    category: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Get all liabilities in a category for the current user."""
    return liability_repository.get_by_category(db, category, user_id)

