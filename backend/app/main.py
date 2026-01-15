"""
FastAPI Application Entry Point

You Can FI - Personal Finance Backend
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse

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


# Apple App Site Association for Universal Links (iOS OAuth support)
@app.get("/.well-known/apple-app-site-association")
def apple_app_site_association():
    """
    Serve apple-app-site-association for iOS Universal Links.
    Required for Plaid OAuth to redirect back to the app.
    """
    return JSONResponse(
        content={
            "applinks": {
                "apps": [],
                "details": [
                    {
                        "appID": "27LQF7AJRB.com.youcanfi.app",  # Replace XXXXXXXXXX with your Apple Team ID
                        "paths": ["/oauth/*", "/plaid-oauth/*"]
                    }
                ]
            },
            "webcredentials": {
                "apps": ["27LQF7AJRB.com.youcanfi.app"]  # Replace XXXXXXXXXX with your Apple Team ID
            }
        },
        media_type="application/json"
    )


@app.get("/oauth/callback")
def oauth_callback(
    oauth_state_id: str = Query(None),
    error: str = Query(None)
):
    """
    OAuth callback endpoint for Plaid.
    
    After OAuth authentication, Plaid redirects here.
    This page then redirects the user back to the app using Universal Links.
    """
    # Build the app deep link
    app_url = f"youcanfi://plaid-oauth"
    
    if oauth_state_id:
        app_url += f"?oauth_state_id={oauth_state_id}"
    if error:
        app_url += f"{'&' if oauth_state_id else '?'}error={error}"
    
    # Return an HTML page that redirects to the app
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Redirecting to MyFinPal...</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: #faf8f5;
                color: #333;
            }}
            .container {{
                text-align: center;
                padding: 20px;
            }}
            h1 {{ font-size: 24px; margin-bottom: 16px; }}
            p {{ color: #666; margin-bottom: 24px; }}
            a {{
                display: inline-block;
                background: #1e3a5f;
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                text-decoration: none;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Redirecting to MyFinPal...</h1>
            <p>If you're not redirected automatically, tap the button below.</p>
            <a href="{app_url}">Open MyFinPal</a>
        </div>
        <script>
            // Try to redirect immediately
            window.location.href = "{app_url}";
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
    )

