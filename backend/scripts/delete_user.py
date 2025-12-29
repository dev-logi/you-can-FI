"""
Script to delete a user and all associated data from the database.

Usage:
    python scripts/delete_user.py <email>

Example:
    python scripts/delete_user.py jeyashreeib@gmail.com
"""

import sys
import os
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.database import engine, SessionLocal
from app.config import settings


def find_user_id_by_email(db, email: str) -> str | None:
    """Find user_id (UUID) from Supabase auth.users table by email (case-insensitive)."""
    # Try exact match first
    query = text("SELECT id, email FROM auth.users WHERE LOWER(email) = LOWER(:email)")
    result = db.execute(query, {"email": email}).fetchone()
    if result:
        print(f"   Found email in database: {result[1]}")
        return result[0]
    return None


def list_all_users(db):
    """List all users in the database for debugging."""
    query = text("SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 20")
    results = db.execute(query).fetchall()
    if results:
        print("\n📋 Recent users in database:")
        for row in results:
            print(f"   - {row[1]} (ID: {row[0]}, Created: {row[2]})")
    else:
        print("\n📋 No users found in auth.users table")


def delete_user_data(db, user_id: str) -> dict:
    """Delete all user data from assets, liabilities, and onboarding_state tables."""
    deleted = {
        "assets": 0,
        "liabilities": 0,
        "onboarding_state": 0,
    }
    
    # Delete assets
    assets_query = text("DELETE FROM assets WHERE user_id = :user_id")
    result = db.execute(assets_query, {"user_id": user_id})
    deleted["assets"] = result.rowcount
    
    # Delete liabilities
    liabilities_query = text("DELETE FROM liabilities WHERE user_id = :user_id")
    result = db.execute(liabilities_query, {"user_id": user_id})
    deleted["liabilities"] = result.rowcount
    
    # Delete onboarding state
    onboarding_query = text("DELETE FROM onboarding_state WHERE user_id = :user_id")
    result = db.execute(onboarding_query, {"user_id": user_id})
    deleted["onboarding_state"] = result.rowcount
    
    return deleted


def delete_auth_user(db, user_id: str) -> bool:
    """Delete user from Supabase auth.users table."""
    query = text("DELETE FROM auth.users WHERE id = :user_id")
    result = db.execute(query, {"user_id": user_id})
    return result.rowcount > 0


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/delete_user.py <email>")
        sys.exit(1)
    
    email = sys.argv[1]
    print(f"🔍 Looking for user with email: {email}")
    
    db = SessionLocal()
    try:
        # Find user_id from email
        user_id = find_user_id_by_email(db, email)
        
        if not user_id:
            print(f"❌ User with email '{email}' not found in auth.users table.")
            list_all_users(db)
            sys.exit(1)
        
        print(f"✅ Found user_id: {user_id}")
        
        # Delete user data from application tables
        print("\n🗑️  Deleting user data from application tables...")
        deleted = delete_user_data(db, user_id)
        print(f"   - Assets deleted: {deleted['assets']}")
        print(f"   - Liabilities deleted: {deleted['liabilities']}")
        print(f"   - Onboarding states deleted: {deleted['onboarding_state']}")
        
        # Delete user from auth.users
        print("\n🗑️  Deleting user from auth.users...")
        auth_deleted = delete_auth_user(db, user_id)
        
        if auth_deleted:
            print("✅ User deleted from auth.users")
        else:
            print("⚠️  User not found in auth.users (may have been already deleted)")
        
        # Commit all changes
        db.commit()
        print("\n✅ All deletions committed successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()

