"""
Application Configuration

Loads settings from environment variables.
Supports both Supabase and Railway PostgreSQL via DATABASE_URL.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database - works with both Supabase and Railway PostgreSQL
    # Using postgresql+psycopg for psycopg3 driver
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/youcanfi"
    
    # API Settings
    api_v1_prefix: str = "/api/v1"
    project_name: str = "You Can FI"
    debug: bool = False
    
    # CORS - add your mobile app's origin in production
    cors_origins: list[str] = ["*"]
    
    # Supabase JWT Secret for token verification
    supabase_jwt_secret: str = "PLBuWudal9yVmZP22EjfW1RP39IVv0/Jyji682nTGDzbwFyUAY0Gf1XVbdefVrUoYE7D0UX5/eoqJtBbbFNhwg=="
    
    # Plaid Configuration
    plaid_client_id: str = ""
    plaid_secret: str = ""
    plaid_environment: str = "sandbox"  # 'sandbox', 'development', 'production'
    plaid_encryption_key: str = ""  # For encrypting access tokens
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()

