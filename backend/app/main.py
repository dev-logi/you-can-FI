"""
FastAPI Application Entry Point

You Can FI - Personal Finance Backend
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import create_tables
from app.api import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle handler."""
    # Startup: Create database tables
    print("🚀 Starting You Can FI Backend...")
    try:
        create_tables()
        print("✅ Database tables created/verified")
    except Exception as e:
        print(f"⚠️  WARNING: Failed to create database tables: {e}")
        print("App will continue, but database operations may fail.")
    
    yield
    
    # Shutdown
    print("👋 Shutting down You Can FI Backend...")


# Create FastAPI app
# Disable automatic redirect for trailing slashes to prevent HTTP redirects
app = FastAPI(
    title=settings.project_name,
    description="Personal finance tracking API for the You Can FI mobile app",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    redirect_slashes=False,  # Prevent automatic redirects that might use HTTP
)

# Configure CORS
# Note: When allow_origins=["*"], cannot use allow_credentials=True (browser security restriction)
# Since we use JWT tokens in headers (not cookies), we don't need credentials
cors_origins = settings.cors_origins
if cors_origins == ["*"]:
    # Allow all origins without credentials (JWT tokens work fine without credentials)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,  # Must be False when using "*"
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["*"],
        max_age=3600,
    )
else:
    # Specific origins - can use credentials if needed
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(cors_origins),
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["*"],
        max_age=3600,
    )

# Include API routes
app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/")
def root():
    """Root endpoint - health check."""
    return {
        "name": settings.project_name,
        "version": "1.0.0",
        "status": "healthy",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    """Health check endpoint for Railway."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
    )

