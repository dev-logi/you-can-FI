"""
Aggregator API Routes

Unified API for financial data aggregation across multiple providers
(Plaid, Finicity, Yodlee, MX, etc.).

This module provides provider-agnostic endpoints that automatically
route requests to the appropriate aggregator based on the institution
or explicit provider selection.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.database import get_db
from app.auth import get_current_user
from app.aggregators import AggregatorFactory, AggregatorType
from app.repositories.connected_account_repository import connected_account_repository
from app.utils.encryption import encryption_service

router = APIRouter()


# === Request/Response Models ===

class CreateLinkTokenRequest(BaseModel):
    """Request to create a link token for account connection."""
    institution_id: Optional[str] = None
    institution_name: Optional[str] = None
    provider: Optional[str] = None  # Explicit provider override


class CreateLinkTokenResponse(BaseModel):
    """Response for link token creation."""
    provider: str
    link_token: Optional[str] = None  # For Plaid
    connect_url: Optional[str] = None  # For Finicity
    expiration: Optional[str] = None


class AvailableProvidersResponse(BaseModel):
    """Response listing available providers."""
    providers: List[str]
    default: str


class ProviderInfoResponse(BaseModel):
    """Information about a specific provider."""
    provider: str
    is_available: bool
    supported_institutions: List[str] = Field(default_factory=list)


# === Endpoints ===

@router.get("/providers", response_model=AvailableProvidersResponse)
def list_providers():
    """
    List available aggregator providers.
    
    Returns:
        List of available provider names and the default provider.
    """
    available = AggregatorFactory.get_available_providers()
    return AvailableProvidersResponse(
        providers=[p.value for p in available],
        default="plaid"
    )


@router.get("/providers/{provider_name}", response_model=ProviderInfoResponse)
def get_provider_info(provider_name: str):
    """
    Get information about a specific provider.
    
    Args:
        provider_name: The provider to get info for (plaid, finicity, etc.)
        
    Returns:
        Provider information including availability.
    """
    try:
        provider_type = AggregatorType(provider_name.lower())
        try:
            AggregatorFactory.get_provider(provider_type)
            is_available = True
        except ValueError:
            is_available = False
        
        return ProviderInfoResponse(
            provider=provider_name,
            is_available=is_available,
            supported_institutions=[]  # TODO: Fetch from provider
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown provider: {provider_name}"
        )


@router.post("/link-token", response_model=CreateLinkTokenResponse)
def create_link_token(
    request: CreateLinkTokenRequest = None,
    user_id: str = Depends(get_current_user)
):
    """
    Create a link token for connecting a financial account.
    
    The endpoint automatically selects the best provider based on:
    1. Explicit provider override in request
    2. Institution name/ID (some institutions require specific providers)
    3. Default provider (Plaid)
    
    Args:
        request: Optional request with institution or provider hints
        user_id: Current user ID (from auth)
        
    Returns:
        Link token or connect URL depending on provider.
    """
    request = request or CreateLinkTokenRequest()
    
    try:
        # Determine provider
        if request.provider:
            try:
                provider_type = AggregatorType(request.provider.lower())
                provider = AggregatorFactory.get_provider(provider_type)
            except ValueError as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=str(e)
                )
        elif request.institution_name:
            provider = AggregatorFactory.get_provider_for_institution(
                request.institution_name,
                request.institution_id
            )
        else:
            provider = AggregatorFactory.get_default_provider()
        
        # Create link token
        result = provider.create_link_token(user_id)
        
        return CreateLinkTokenResponse(
            provider=result.provider.value,
            link_token=result.link_token,
            connect_url=result.connect_url,
            expiration=result.expiration.isoformat() if result.expiration else None
        )
        
    except Exception as e:
        error_message = str(e)
        
        if "INVALID_CONFIGURATION" in error_message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create link token: {error_message}"
            )


@router.get("/accounts/stats")
def get_account_stats(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """
    Get statistics about connected accounts.
    
    Returns:
        Summary of connected accounts by provider.
    """
    accounts = connected_account_repository.get_active_accounts(db, user_id)
    
    # Count by provider
    by_provider = {}
    for account in accounts:
        provider = getattr(account, 'provider', 'plaid')
        by_provider[provider] = by_provider.get(provider, 0) + 1
    
    return {
        "total": len(accounts),
        "by_provider": by_provider,
        "providers_used": list(by_provider.keys())
    }


@router.get("/institutions/recommend")
def recommend_provider_for_institution(
    institution_name: str = Query(..., description="Institution name to check")
):
    """
    Get the recommended provider for an institution.
    
    Some institutions work better with specific providers:
    - Fidelity → Finicity
    - USAA → MX
    - Most others → Plaid
    
    Args:
        institution_name: Name of the institution
        
    Returns:
        Recommended provider and whether it's available.
    """
    try:
        provider = AggregatorFactory.get_provider_for_institution(institution_name)
        return {
            "institution_name": institution_name,
            "recommended_provider": provider.provider_type.value,
            "is_available": True,
            "note": None
        }
    except ValueError as e:
        # Provider not yet implemented
        # Try to determine what it would be
        if institution_name in AggregatorFactory.FINICITY_INSTITUTIONS:
            return {
                "institution_name": institution_name,
                "recommended_provider": "finicity",
                "is_available": False,
                "note": "Finicity integration coming soon. Using Plaid as fallback."
            }
        elif institution_name in AggregatorFactory.MX_INSTITUTIONS:
            return {
                "institution_name": institution_name,
                "recommended_provider": "mx",
                "is_available": False,
                "note": "MX integration coming soon. Using Plaid as fallback."
            }
        else:
            return {
                "institution_name": institution_name,
                "recommended_provider": "plaid",
                "is_available": True,
                "note": None
            }
