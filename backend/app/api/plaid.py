"""
Plaid API Routes

Handles Plaid integration endpoints.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.repositories.connected_account_repository import connected_account_repository
from app.repositories.asset_repository import asset_repository
from app.repositories.liability_repository import liability_repository
from app.services.plaid_service import plaid_service
from app.services.account_sync_service import account_sync_service
from app.utils.encryption import encryption_service
from app.schemas.plaid import (
    LinkTokenResponse,
    ExchangeTokenRequest,
    ExchangeTokenResponse,
    ConnectedAccountResponse,
    ConnectedAccountListResponse,
    SyncResponse,
    LinkAccountRequest,
    PlaidAccountInfo,
)

router = APIRouter()


@router.post("/link-token", response_model=LinkTokenResponse)
def create_link_token(
    user_id: str = Depends(get_current_user)
):
    """Generate a Plaid Link token for the user."""
    try:
        link_token = plaid_service.create_link_token(user_id)
        return LinkTokenResponse(link_token=link_token)
    except Exception as e:
        # Pass through the detailed error message from Plaid
        error_message = str(e)
        
        # Check if it's a Plaid-specific error
        if "INVALID_CONFIGURATION" in error_message or "link token can only be configured" in error_message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create link token: {error_message}"
            )


@router.post("/exchange-token", response_model=List[PlaidAccountInfo])
def exchange_public_token(
    request: ExchangeTokenRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """
    Exchange public token for access token and fetch accounts.
    Returns list of accounts that need to be linked.
    """
    try:
        # Exchange public token
        token_data = plaid_service.exchange_public_token(request.public_token)
        access_token = token_data['access_token']
        item_id = token_data['item_id']
        
        # Get accounts with balances from Plaid
        plaid_accounts = plaid_service.get_accounts_with_balances(access_token)
        
        # Get item/institution info (simplified - you may need to enhance this)
        # For Phase 1, we'll use a placeholder. In Phase 2, we can fetch actual institution name
        item_info = plaid_service.get_item(access_token)
        institution_id = item_info.get('institution_id', '') if item_info else ''
        # Get the actual institution name from Plaid
        institution_name = plaid_service.get_institution_name(institution_id)
        
        # Create connected accounts and return account info for linking
        account_infos = []
        for plaid_account in plaid_accounts:
            # Map to our category
            category, is_asset = account_sync_service.map_plaid_to_category(
                plaid_account['type'],
                plaid_account.get('subtype')
            )
            
            # Encrypt access token before storing
            encrypted_token = encryption_service.encrypt(access_token)
            
            # Create connected account record
            connected_account = connected_account_repository.create(db, {
                'plaid_item_id': item_id,
                'plaid_access_token': encrypted_token,
                'plaid_account_id': plaid_account['account_id'],
                'institution_name': institution_name,
                'account_name': plaid_account['name'],
                'account_type': plaid_account['type'],
                'account_subtype': plaid_account.get('subtype'),
                'is_active': True,
            }, user_id)
            
            account_infos.append(PlaidAccountInfo(
                account_id=connected_account.id,
                name=plaid_account['name'],
                type=plaid_account['type'],
                subtype=plaid_account.get('subtype'),
                mask=plaid_account.get('mask'),
                suggested_category=category,
                is_asset=is_asset,
                current_balance=plaid_account.get('current_balance'),
            ))
        
        return account_infos
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to exchange token: {str(e)}"
        )


@router.get("/accounts", response_model=ConnectedAccountListResponse)
def list_connected_accounts(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Get all connected accounts for the current user."""
    accounts = connected_account_repository.get_by_user(db, user_id)
    return ConnectedAccountListResponse(
        accounts=[ConnectedAccountResponse.model_validate(acc) for acc in accounts]
    )


@router.post("/sync", response_model=SyncResponse)
def sync_all_accounts(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Sync all connected accounts for the current user."""
    try:
        results = account_sync_service.sync_all_accounts(db, user_id)
        return SyncResponse(
            success=results['failed'] == 0,
            message=f"Synced {results['successful']}/{results['total']} accounts",
            total=results['total'],
            successful=results['successful'],
            failed=results['failed'],
            errors=results['errors'] if results['errors'] else None,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync accounts: {str(e)}"
        )


@router.post("/accounts/{account_id}/sync", response_model=SyncResponse)
def sync_account(
    account_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Sync a specific connected account."""
    try:
        success, error = account_sync_service.sync_account(db, account_id, user_id)
        if success:
            return SyncResponse(
                success=True,
                message="Account synced successfully"
            )
        else:
            return SyncResponse(
                success=False,
                message=error or "Failed to sync account"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync account: {str(e)}"
        )


@router.post("/accounts/{account_id}/link", status_code=status.HTTP_200_OK)
def link_account(
    account_id: str,
    request: LinkAccountRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Link a Plaid account to an existing asset or liability."""
    # Verify connected account belongs to user
    connected_account = connected_account_repository.get(db, account_id, user_id)
    if not connected_account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connected account not found"
        )
    
    # Link to asset or liability
    if request.entity_type == 'asset':
        entity = asset_repository.get(db, request.entity_id, user_id)
        if not entity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asset not found"
            )
        asset_repository.update(db, request.entity_id, {
            'connected_account_id': account_id,
            'is_connected': True,
        }, user_id)
    elif request.entity_type == 'liability':
        entity = liability_repository.get(db, request.entity_id, user_id)
        if not entity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Liability not found"
            )
        liability_repository.update(db, request.entity_id, {
            'connected_account_id': account_id,
            'is_connected': True,
        }, user_id)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid entity_type. Must be 'asset' or 'liability'"
        )
    
    # Sync the account immediately after linking
    sync_success, sync_error = account_sync_service.sync_account(db, account_id, user_id)
    
    if not sync_success:
        # Link succeeded but sync failed - log it but don't fail the request
        print(f"[link_account] Sync failed after linking: {sync_error}")
        return {
            "status": "partial", 
            "message": f"Account linked but sync failed: {sync_error}",
            "sync_error": sync_error
        }
    
    return {"status": "ok", "message": "Account linked and synced successfully"}


@router.delete("/accounts/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def disconnect_account(
    account_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Disconnect a Plaid account."""
    # Get connected account
    connected_account = connected_account_repository.get(db, account_id, user_id)
    if not connected_account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connected account not found"
        )
    
    # Remove from Plaid
    try:
        # Decrypt access token
        access_token = encryption_service.decrypt(connected_account.plaid_access_token)
        plaid_service.remove_item(access_token)
    except Exception as e:
        # Log error but continue with local cleanup
        print(f"Error removing item from Plaid: {e}")
    
    # Deactivate locally
    connected_account_repository.deactivate(db, account_id, user_id)
    
    # Unlink from assets/liabilities
    assets = asset_repository.get_all(db, user_id)
    for asset in assets:
        if asset.connected_account_id == account_id:
            asset_repository.update(db, asset.id, {
                'connected_account_id': None,
                'is_connected': False,
            }, user_id)
    
    liabilities = liability_repository.get_all(db, user_id)
    for liability in liabilities:
        if liability.connected_account_id == account_id:
            liability_repository.update(db, liability.id, {
                'connected_account_id': None,
                'is_connected': False,
            }, user_id)
    
    return None

