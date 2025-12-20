"""
Authentication and Authorization

Handles Supabase JWT token verification and user identification.
"""

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
import os
import base64
import json

# Security scheme for Bearer token
# auto_error=True ensures 403 is returned if token is missing
security = HTTPBearer(auto_error=True)


def get_supabase_jwt_secret() -> str:
    """Get Supabase JWT secret from environment or config."""
    from app.config import get_settings
    # Try environment variable first, then fall back to config
    return os.getenv("SUPABASE_JWT_SECRET", "") or get_settings().supabase_jwt_secret


def extract_user_id_from_token(token: str) -> Optional[str]:
    """
    Extract user ID from JWT token without verification (for development).
    In production, use verify_token() instead.
    
    Args:
        token: JWT token from Authorization header
        
    Returns:
        User ID (UUID string) if token is valid, None otherwise
    """
    try:
        # Decode the JWT token without verification (just to extract user_id)
        # Split the token into parts
        parts = token.split('.')
        if len(parts) != 3:
            return None
        
        # Decode the payload (second part)
        payload_b64 = parts[1]
        # Add padding if needed
        padding = len(payload_b64) % 4
        if padding:
            payload_b64 += '=' * (4 - padding)
        
        payload_bytes = base64.urlsafe_b64decode(payload_b64)
        payload = json.loads(payload_bytes)
        
        # Extract user ID from the token
        # Supabase stores user ID in the 'sub' claim
        user_id = payload.get("sub")
        
        return user_id
        
    except Exception:
        return None


def verify_token(token: str) -> Optional[str]:
    """
    Verify Supabase JWT token and extract user ID.
    
    Args:
        token: JWT token from Authorization header
        
    Returns:
        User ID (UUID string) if token is valid, None otherwise
    """
    jwt_secret = get_supabase_jwt_secret()
    
    # If JWT secret is not set, extract user_id without verification (dev mode)
    if not jwt_secret:
        return extract_user_id_from_token(token)
    
    try:
        # Decode the JWT token with verification
        # Supabase uses HS256 algorithm
        payload = jwt.decode(
            token,
            jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False}  # Supabase tokens don't have aud claim
        )
        
        # Extract user ID from the token
        # Supabase stores user ID in the 'sub' claim
        user_id = payload.get("sub")
        
        if not user_id:
            return None
            
        return user_id
        
    except JWTError:
        return None


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """
    FastAPI dependency to get the current authenticated user.
    
    Extracts and verifies the JWT token from the Authorization header.
    
    Returns:
        User ID (UUID string)
        
    Raises:
        HTTPException: If token is missing or invalid
    """
    token = credentials.credentials
    
    user_id = verify_token(token)
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user_id

