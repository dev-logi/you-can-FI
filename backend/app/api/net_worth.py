"""
Net Worth API Routes

Net worth calculation and breakdown endpoints.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.services.net_worth_service import net_worth_service
from app.schemas.net_worth import NetWorthSummary

router = APIRouter()


@router.get("/", response_model=NetWorthSummary)
def get_net_worth(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """
    Get complete net worth summary.
    
    Returns:
    - Total assets
    - Total liabilities  
    - Net worth
    - Breakdown by category
    """
    return net_worth_service.calculate(db, user_id)

