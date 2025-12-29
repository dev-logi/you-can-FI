"""
API Routes

FastAPI route handlers organized by feature.
"""

from fastapi import APIRouter
from app.api import assets, liabilities, onboarding, net_worth, plaid

# Main API router
api_router = APIRouter()

# Include all sub-routers
api_router.include_router(assets.router, prefix="/assets", tags=["Assets"])
api_router.include_router(liabilities.router, prefix="/liabilities", tags=["Liabilities"])
api_router.include_router(onboarding.router, prefix="/onboarding", tags=["Onboarding"])
api_router.include_router(net_worth.router, prefix="/net-worth", tags=["Net Worth"])
api_router.include_router(plaid.router, prefix="/plaid", tags=["Plaid"])

