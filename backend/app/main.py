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
    create_tables()
    print("✅ Database tables created/verified")
    
    yield
    
    # Shutdown
    print("👋 Shutting down You Can FI Backend...")


# Create FastAPI app
app = FastAPI(
    title=settings.project_name,
    description="Personal finance tracking API for the You Can FI mobile app",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
# Allow all origins in development, specific origins in production
cors_origins = settings.cors_origins
if cors_origins == ["*"]:
    # In development, allow all origins
    cors_origins = ["*"]
else:
    # In production, ensure HTTPS origins are included
    cors_origins = list(cors_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
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

