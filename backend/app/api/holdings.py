"""
Holding API Routes

Handles investment holdings and securities endpoints.
"""

from typing import List, Optional, Dict
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.auth import get_current_user
from app.models.holding import Holding
from app.models.connected_account import ConnectedAccount
from app.repositories.holding_repository import holding_repository
from app.repositories.connected_account_repository import connected_account_repository
from app.services.holding_sync_service import holding_sync_service
from app.schemas.holding import (
    HoldingResponse,
    HoldingListResponse,
    HoldingSyncResponse,
    GlobalHoldingsResponse,
    HoldingGroup,
    AggregatedHolding,
    AccountInfo,
)

# Mapping from Plaid security types to display names
SECURITY_TYPE_DISPLAY = {
    'equity': 'Stocks',
    'etf': 'ETFs',
    'mutual fund': 'Mutual Funds',
    'cryptocurrency': 'Crypto',
    'fixed income': 'Bonds & Fixed Income',
    'derivative': 'Options & Derivatives',
    'cash': 'Cash & Equivalents',
    'loan': 'Loans',
    'other': 'Other',
    None: 'Other',
}

router = APIRouter()


@router.get("/all", response_model=GlobalHoldingsResponse)
def get_all_holdings(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """
    Get all holdings for the user, grouped by security type.
    Securities held across multiple accounts are aggregated.
    """
    # Get all holdings with security and account info
    holdings = db.query(Holding).options(
        joinedload(Holding.security)
    ).filter(
        Holding.user_id == user_id
    ).all()
    
    if not holdings:
        return GlobalHoldingsResponse(
            total_value=0,
            total_holdings=0,
            groups=[]
        )
    
    # Get connected accounts for this user (for account names)
    accounts_map: Dict[str, ConnectedAccount] = {}
    account_ids = set(h.connected_account_id for h in holdings)
    accounts = db.query(ConnectedAccount).filter(
        ConnectedAccount.id.in_(account_ids),
        ConnectedAccount.user_id == user_id
    ).all()
    for acc in accounts:
        accounts_map[acc.id] = acc
    
    # Aggregate holdings by security_id
    security_aggregates: Dict[str, Dict] = {}
    
    for h in holdings:
        sec_id = h.security_id
        security = h.security
        
        if sec_id not in security_aggregates:
            security_aggregates[sec_id] = {
                'security_id': sec_id,
                'security_name': security.name if security else 'Unknown',
                'ticker_symbol': security.ticker_symbol if security else None,
                'security_type': security.type if security else 'other',
                'is_cash_equivalent': security.is_cash_equivalent if security else False,
                'total_quantity': 0,
                'total_value': 0,
                'total_cost_basis': 0,
                'has_cost_basis': False,
                'accounts': []
            }
        
        agg = security_aggregates[sec_id]
        agg['total_quantity'] += h.quantity
        agg['total_value'] += h.institution_value
        if h.cost_basis:
            agg['total_cost_basis'] += h.cost_basis
            agg['has_cost_basis'] = True
        
        # Add account info
        acc = accounts_map.get(h.connected_account_id)
        agg['accounts'].append(AccountInfo(
            account_id=h.connected_account_id,
            account_name=acc.account_name if acc else 'Unknown Account',
            institution_name=acc.institution_name if acc else '',
            quantity=h.quantity,
            value=h.institution_value
        ))
    
    # Group by security type
    type_groups: Dict[str, List[Dict]] = defaultdict(list)
    
    for sec_id, agg in security_aggregates.items():
        sec_type = agg['security_type'] or 'other'
        # Normalize type
        sec_type = sec_type.lower() if sec_type else 'other'
        type_groups[sec_type].append(agg)
    
    # Build response groups
    groups = []
    for sec_type, agg_list in type_groups.items():
        # Sort holdings by value (highest first)
        agg_list.sort(key=lambda x: x['total_value'], reverse=True)
        
        group_total = sum(a['total_value'] for a in agg_list)
        
        holdings_list = []
        for a in agg_list:
            avg_price = a['total_value'] / a['total_quantity'] if a['total_quantity'] > 0 else 0
            holdings_list.append(AggregatedHolding(
                security_id=a['security_id'],
                security_name=a['security_name'],
                ticker_symbol=a['ticker_symbol'],
                security_type=a['security_type'],
                is_cash_equivalent=a['is_cash_equivalent'],
                total_quantity=a['total_quantity'],
                total_value=a['total_value'],
                total_cost_basis=a['total_cost_basis'] if a['has_cost_basis'] else None,
                average_price=avg_price,
                accounts_count=len(a['accounts']),
                accounts=a['accounts']
            ))
        
        groups.append(HoldingGroup(
            type=sec_type,
            display_name=SECURITY_TYPE_DISPLAY.get(sec_type, 'Other'),
            total_value=group_total,
            holdings_count=len(holdings_list),
            holdings=holdings_list
        ))
    
    # Sort groups by value (highest first)
    groups.sort(key=lambda g: g.total_value, reverse=True)
    
    total_value = sum(g.total_value for g in groups)
    total_holdings = sum(g.holdings_count for g in groups)
    
    return GlobalHoldingsResponse(
        total_value=total_value,
        total_holdings=total_holdings,
        groups=groups
    )


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
