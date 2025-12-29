"""
API Routes

FastAPI route handlers organized by feature.
"""

from fastapi import APIRouter
from app.api import assets, liabilities, onboarding, net_worth

# Main API router
api_router = APIRouter()

# Include all sub-routers
api_router.include_router(assets.router, prefix="/assets", tags=["Assets"])
api_router.include_router(liabilities.router, prefix="/liabilities", tags=["Liabilities"])
api_router.include_router(onboarding.router, prefix="/onboarding", tags=["Onboarding"])
api_router.include_router(net_worth.router, prefix="/net-worth", tags=["Net Worth"])

# Include Plaid router only if it can be imported (graceful degradation)
try:
    from app.api import plaid
    api_router.include_router(plaid.router, prefix="/plaid", tags=["Plaid"])
except Exception as e:
    print(f"WARNING: Failed to load Plaid router: {e}")
    print("Plaid endpoints will not be available. Check Plaid configuration.")

