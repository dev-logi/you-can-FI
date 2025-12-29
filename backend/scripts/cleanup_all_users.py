"""
Script to delete ALL users and all associated data from the database.

⚠️  WARNING: This is a destructive operation that will delete:
- All users from auth.users
- All assets
- All liabilities
- All onboarding states

Usage:
    python scripts/cleanup_all_users.py [--confirm]

Example:
    python scripts/cleanup_all_users.py --confirm
"""

import sys
import os
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.database import engine, SessionLocal
from app.config import settings


def get_counts(db) -> dict:
    """Get counts of all data before deletion."""
    counts = {}
    
    # Count users
    query = text("SELECT COUNT(*) FROM auth.users")
    counts["users"] = db.execute(query).scalar()
    
    # Count assets
    query = text("SELECT COUNT(*) FROM assets")
    counts["assets"] = db.execute(query).scalar()
    
    # Count liabilities
    query = text("SELECT COUNT(*) FROM liabilities")
    counts["liabilities"] = db.execute(query).scalar()
    
    # Count onboarding states
    query = text("SELECT COUNT(*) FROM onboarding_state")
    counts["onboarding_states"] = db.execute(query).scalar()
    
    return counts


def delete_all_data(db) -> dict:
    """Delete all data from all tables."""
    deleted = {}
    
    # Delete all assets
    print("🗑️  Deleting all assets...")
    query = text("DELETE FROM assets")
    result = db.execute(query)
    deleted["assets"] = result.rowcount
    print(f"   ✅ Deleted {deleted['assets']} assets")
    
    # Delete all liabilities
    print("🗑️  Deleting all liabilities...")
    query = text("DELETE FROM liabilities")
    result = db.execute(query)
    deleted["liabilities"] = result.rowcount
    print(f"   ✅ Deleted {deleted['liabilities']} liabilities")
    
    # Delete all onboarding states
    print("🗑️  Deleting all onboarding states...")
    query = text("DELETE FROM onboarding_state")
    result = db.execute(query)
    deleted["onboarding_states"] = result.rowcount
    print(f"   ✅ Deleted {deleted['onboarding_states']} onboarding states")
    
    # Delete all users from auth.users (this should be last)
    print("🗑️  Deleting all users from auth.users...")
    query = text("DELETE FROM auth.users")
    result = db.execute(query)
    deleted["users"] = result.rowcount
    print(f"   ✅ Deleted {deleted['users']} users")
    
    return deleted


def main():
    # Check for --confirm flag
    confirm = "--confirm" in sys.argv or "-y" in sys.argv or "--yes" in sys.argv
    
    if not confirm:
        print("⚠️  WARNING: This will delete ALL users and ALL data from the database!")
        print("\nThis includes:")
        print("  - All users from auth.users")
        print("  - All assets")
        print("  - All liabilities")
        print("  - All onboarding states")
        print("\nTo proceed, run with --confirm flag:")
        print("  python scripts/cleanup_all_users.py --confirm")
        sys.exit(1)
    
    print("🧹 Starting database cleanup...")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        # Get counts before deletion
        print("\n📊 Current data counts:")
        counts = get_counts(db)
        print(f"   - Users: {counts['users']}")
        print(f"   - Assets: {counts['assets']}")
        print(f"   - Liabilities: {counts['liabilities']}")
        print(f"   - Onboarding states: {counts['onboarding_states']}")
        
        if counts["users"] == 0 and counts["assets"] == 0 and counts["liabilities"] == 0 and counts["onboarding_states"] == 0:
            print("\n✅ Database is already empty. Nothing to delete.")
            return
        
        print("\n" + "=" * 60)
        print("🗑️  Deleting all data...")
        print("=" * 60)
        
        # Delete all data
        deleted = delete_all_data(db)
        
        # Commit all changes
        db.commit()
        
        print("\n" + "=" * 60)
        print("✅ Cleanup completed successfully!")
        print("=" * 60)
        print("\n📊 Summary:")
        print(f"   - Users deleted: {deleted['users']}")
        print(f"   - Assets deleted: {deleted['assets']}")
        print(f"   - Liabilities deleted: {deleted['liabilities']}")
        print(f"   - Onboarding states deleted: {deleted['onboarding_states']}")
        print("\n🎉 Database is now clean and ready for fresh testing!")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error during cleanup: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()

