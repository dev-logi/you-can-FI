"""
Holding API Routes

Handles investment holdings and securities endpoints.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.repositories.holding_repository import holding_repository
from app.repositories.connected_account_repository import connected_account_repository
from app.services.holding_sync_service import holding_sync_service
from app.schemas.holding import (
    HoldingResponse,
    HoldingListResponse,
    HoldingSyncResponse,
)

router = APIRouter()


@router.get("/account/{account_id}", response_model=HoldingListResponse)
def get_account_holdings(
    account_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Get all holdings for a specific connected account."""
    # Verify account belongs to user
    account = connected_account_repository.get(db, account_id, user_id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connected account not found"
        )
    
    holdings = holding_repository.get_by_account(db, account_id, user_id)
    
    # Load security info for each holding
    # (SQLAlchemy does this automatically if relationships are defined, 
    # but we can manually validate or join if needed)
    
    return HoldingListResponse(
        holdings=[HoldingResponse.model_validate(h) for h in holdings],
        total=len(holdings)
    )


@router.post("/sync/{account_id}", response_model=HoldingSyncResponse)
def sync_account_holdings(
    account_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """
    Sync holdings for a specific investment account.
    """
    success, result = holding_sync_service.sync_holdings_for_account(
        db, account_id, user_id
    )
    
    if success:
        return HoldingSyncResponse(
            success=True,
            message="Holdings synced successfully",
            added=result.get('added', 0),
            securities=result.get('securities', 0),
        )
    else:
        return HoldingSyncResponse(
            success=False,
            message=result.get('error', 'Sync failed'),
        )
