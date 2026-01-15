"""
API Routes

FastAPI route handlers organized by feature.
"""

from fastapi import APIRouter
from app.api import assets, liabilities, onboarding, net_worth, transactions

# Main API router
api_router = APIRouter()

# Include all sub-routers
api_router.include_router(assets.router, prefix="/assets", tags=["Assets"])
api_router.include_router(liabilities.router, prefix="/liabilities", tags=["Liabilities"])
api_router.include_router(onboarding.router, prefix="/onboarding", tags=["Onboarding"])
api_router.include_router(net_worth.router, prefix="/net-worth", tags=["Net Worth"])
api_router.include_router(transactions.router, prefix="/transactions", tags=["Transactions"])

# Include Holdings router
try:
    from app.api import holdings
    api_router.include_router(holdings.router, prefix="/holdings", tags=["Holdings"])
    print("✅ Holdings router loaded successfully")
except ImportError as e:
    print(f"⚠️  WARNING: Holdings router not available (ImportError: {e})")
except Exception as e:
    print(f"⚠️  WARNING: Failed to load Holdings router: {e}")

# Include Spending router
try:
    from app.api import spending
    api_router.include_router(spending.router, prefix="/spending", tags=["Spending"])
    print("✅ Spending router loaded successfully")
except ImportError as e:
    print(f"⚠️  WARNING: Spending router not available (ImportError: {e})")
except Exception as e:
    print(f"⚠️  WARNING: Failed to load Spending router: {e}")

# Include Plaid router only if it can be imported (graceful degradation)
try:
    from app.api import plaid
    api_router.include_router(plaid.router, prefix="/plaid", tags=["Plaid"])
    print("✅ Plaid router loaded successfully")
except ImportError as e:
    print(f"⚠️  WARNING: Plaid router not available (ImportError: {e})")
    print("   Plaid endpoints will not be available. This is OK if Plaid is not configured.")
except Exception as e:
    print(f"⚠️  WARNING: Failed to load Plaid router: {e}")
    print("   Plaid endpoints will not be available. Check Plaid configuration.")

# Include Batch Sync router (for scheduled jobs)
try:
    from app.api import batch
    api_router.include_router(batch.router, prefix="/batch", tags=["Batch Sync"])
    print("✅ Batch Sync router loaded successfully")
except ImportError as e:
    print(f"⚠️  WARNING: Batch Sync router not available (ImportError: {e})")
except Exception as e:
    print(f"⚠️  WARNING: Failed to load Batch Sync router: {e}")


