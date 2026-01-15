"""
Batch Sync API Routes

Provides endpoints for batch syncing Plaid data.
Protected by API key authentication for use by scheduled jobs.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.config import settings
from app.services.batch_sync_service import batch_sync_service


router = APIRouter()


# --- Schemas ---

class UserSyncResult(BaseModel):
    """Result of syncing a single user."""
    user_id: str
    accounts_synced: int
    accounts_failed: int
    transactions_added: int
    transactions_modified: int
    transactions_removed: int
    holdings_synced: int
    errors: list


class BatchSyncAllResult(BaseModel):
    """Result of syncing all users."""
    success: bool
    started_at: str
    completed_at: str
    users_total: int
    users_synced: int
    users_failed: int
    total_accounts_synced: int
    total_accounts_failed: int
    total_transactions_added: int
    total_transactions_modified: int
    total_transactions_removed: int
    total_holdings_synced: int
    user_errors: Optional[list] = None


# --- API Key Authentication ---

def verify_api_key(x_api_key: str = Header(..., alias="X-API-Key")):
    """Verify the batch sync API key."""
    if not settings.batch_sync_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Batch sync API key not configured"
        )
    
    if x_api_key != settings.batch_sync_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    
    return True


# --- Endpoints ---

@router.post("/sync", response_model=BatchSyncAllResult)
def sync_all_users(
    db: Session = Depends(get_db),
    _: bool = Depends(verify_api_key)
):
    """
    Sync all users' Plaid data.
    
    This endpoint is designed to be called by a scheduled job (e.g., daily cron).
    It syncs:
    - Account balances (updates asset/liability values)
    - Transactions (for non-investment accounts)
    - Holdings (for investment accounts)
    
    Requires X-API-Key header with valid batch sync API key.
    """
    try:
        result = batch_sync_service.sync_all_users(db)
        return BatchSyncAllResult(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch sync failed: {str(e)}"
        )


@router.post("/sync/{user_id}", response_model=UserSyncResult)
def sync_specific_user(
    user_id: str,
    db: Session = Depends(get_db),
    _: bool = Depends(verify_api_key)
):
    """
    Sync a specific user's Plaid data.
    
    Requires X-API-Key header with valid batch sync API key.
    """
    try:
        result = batch_sync_service.sync_user(db, user_id)
        return UserSyncResult(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"User sync failed: {str(e)}"
        )


@router.get("/status")
def batch_status(
    db: Session = Depends(get_db),
    _: bool = Depends(verify_api_key)
):
    """
    Get batch sync status information.
    
    Returns the number of users with connected accounts and account counts.
    Useful for monitoring and debugging.
    """
    try:
        user_ids = batch_sync_service.get_all_user_ids(db)
        
        from app.models.connected_account import ConnectedAccount
        
        total_accounts = db.query(ConnectedAccount).filter(
            ConnectedAccount.is_active == True
        ).count()
        
        return {
            "users_with_accounts": len(user_ids),
            "total_active_accounts": total_accounts,
            "batch_sync_configured": bool(settings.batch_sync_api_key),
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get status: {str(e)}"
        )
