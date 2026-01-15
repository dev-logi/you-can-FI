"""
Transaction API Routes

Handles transaction endpoints.
"""

from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.repositories.transaction_repository import transaction_repository
from app.repositories.connected_account_repository import connected_account_repository
from app.services.transaction_sync_service import transaction_sync_service
from app.schemas.transaction import (
    TransactionResponse,
    TransactionListResponse,
    TransactionSyncResponse,
    TransactionSyncAllResponse,
    TransactionUpdateRequest,
)

router = APIRouter()


@router.get("/", response_model=TransactionListResponse)
def list_transactions(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    start_date: Optional[date] = Query(None, description="Filter transactions from this date"),
    end_date: Optional[date] = Query(None, description="Filter transactions until this date"),
    account_id: Optional[str] = Query(None, description="Filter by connected account ID"),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """
    Get transactions for the current user.
    
    Supports filtering by date range and account.
    Returns transactions sorted by date (newest first).
    """
    if account_id:
        # Verify account belongs to user
        account = connected_account_repository.get(db, account_id, user_id)
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Connected account not found"
            )
        
        transactions = transaction_repository.get_by_connected_account(
            db, account_id, user_id, 
            limit=limit, offset=offset,
            start_date=start_date, end_date=end_date
        )
        total = transaction_repository.count_by_connected_account(db, account_id, user_id)
    else:
        transactions = transaction_repository.get_by_user(
            db, user_id,
            limit=limit, offset=offset,
            start_date=start_date, end_date=end_date
        )
        total = transaction_repository.count_by_user(db, user_id)
    
    return TransactionListResponse(
        transactions=[TransactionResponse.model_validate(t) for t in transactions],
        total=total,
        limit=limit,
        offset=offset
    )


@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(
    transaction_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Get a specific transaction by ID."""
    transaction = transaction_repository.get(db, transaction_id, user_id)
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    return TransactionResponse.model_validate(transaction)


@router.put("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    transaction_id: str,
    request: TransactionUpdateRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """
    Update user-customizable fields on a transaction.
    
    Users can set custom categories, add notes, or hide transactions.
    """
    # Filter out None values
    update_data = {k: v for k, v in request.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid update data provided"
        )
    
    updated = transaction_repository.update(db, transaction_id, update_data, user_id)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    return TransactionResponse.model_validate(updated)


@router.post("/sync", response_model=TransactionSyncAllResponse)
def sync_all_transactions(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """
    Sync transactions for all connected accounts.
    
    Uses Plaid's transactions/sync endpoint for incremental updates.
    Only fetches new/modified transactions since last sync.
    """
    results = transaction_sync_service.sync_transactions_for_user(db, user_id)
    
    return TransactionSyncAllResponse(
        success=results['failed'] == 0,
        message=f"Synced {results['successful']}/{results['total_accounts']} accounts",
        total_accounts=results['total_accounts'],
        successful=results['successful'],
        failed=results['failed'],
        total_added=results['total_added'],
        total_modified=results['total_modified'],
        total_removed=results['total_removed'],
        errors=results['errors'] if results['errors'] else None,
    )


@router.post("/sync/{account_id}", response_model=TransactionSyncResponse)
def sync_account_transactions(
    account_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """
    Sync transactions for a specific connected account.
    
    Uses Plaid's transactions/sync endpoint for incremental updates.
    """
    # Verify account belongs to user
    account = connected_account_repository.get(db, account_id, user_id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connected account not found"
        )
    
    success, result = transaction_sync_service.sync_transactions_for_account(
        db, account_id, user_id
    )
    
    if success:
        return TransactionSyncResponse(
            success=True,
            message="Transactions synced successfully",
            added=result.get('added', 0),
            modified=result.get('modified', 0),
            removed=result.get('removed', 0),
        )
    else:
        return TransactionSyncResponse(
            success=False,
            message=result.get('error', 'Sync failed'),
        )


@router.get("/account/{account_id}", response_model=TransactionListResponse)
def get_account_transactions(
    account_id: str,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Get all transactions for a specific connected account."""
    # Verify account belongs to user
    account = connected_account_repository.get(db, account_id, user_id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connected account not found"
        )
    
    transactions = transaction_repository.get_by_connected_account(
        db, account_id, user_id,
        limit=limit, offset=offset,
        start_date=start_date, end_date=end_date
    )
    total = transaction_repository.count_by_connected_account(db, account_id, user_id)
    
    return TransactionListResponse(
        transactions=[TransactionResponse.model_validate(t) for t in transactions],
        total=total,
        limit=limit,
        offset=offset
    )
