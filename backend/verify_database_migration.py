#!/usr/bin/env python3
"""
Verify Database Migration

This script connects directly to Supabase to verify the Plaid migration.
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def check_database():
    """Check database migration status."""
    print("=" * 60)
    print("Database Migration Verification")
    print("=" * 60)
    print("")
    
    try:
        from sqlalchemy import create_engine, inspect, text
        from app.config import get_settings
        import os
        
        settings = get_settings()
        
        # Try to get DATABASE_URL from environment or use settings
        db_url = os.getenv('DATABASE_URL') or settings.database_url
        
        if not db_url or db_url == "postgresql+psycopg://postgres:postgres@localhost:5432/youcanfi":
            print("⚠️  DATABASE_URL not set or using default localhost")
            print("   Using Supabase connection from DEPLOYMENT_SUCCESS.md...")
            # Use connection string from deployment docs
            db_url = "postgresql+psycopg://postgres.cwsoawrcxogoxrgmtowx:SuperSecure2024FI!Pass#DB@aws-0-us-west-2.pooler.supabase.com:5432/postgres"
            print("   (Using connection string from documentation)")
        
        # Create engine - keep psycopg in URL for psycopg3
        # SQLAlchemy will handle the +psycopg:// prefix
        if '+psycopg' not in db_url and 'postgresql://' in db_url:
            db_url = db_url.replace('postgresql://', 'postgresql+psycopg://')
        engine = create_engine(db_url)
        
        print("🔍 Connecting to database...")
        with engine.connect() as conn:
            inspector = inspect(engine)
            
            # Check 1: connected_accounts table
            print("\n1. Checking connected_accounts table...")
            tables = inspector.get_table_names()
            if 'connected_accounts' in tables:
                print("   ✅ connected_accounts table EXISTS")
                
                # Check columns
                columns = [col['name'] for col in inspector.get_columns('connected_accounts')]
                required_columns = [
                    'id', 'user_id', 'plaid_item_id', 'plaid_access_token',
                    'plaid_account_id', 'institution_name', 'account_name',
                    'account_type', 'account_subtype', 'is_active',
                    'last_synced_at', 'last_sync_error', 'created_at', 'updated_at'
                ]
                missing = [col for col in required_columns if col not in columns]
                if missing:
                    print(f"   ❌ Missing columns: {missing}")
                else:
                    print("   ✅ All required columns present")
                    
                # Check indexes
                indexes = inspector.get_indexes('connected_accounts')
                index_names = [idx['name'] for idx in indexes]
                if any('plaid' in name.lower() for name in index_names):
                    print("   ✅ Indexes present")
            else:
                print("   ❌ connected_accounts table DOES NOT EXIST")
                print("      Run: alembic upgrade head")
            
            # Check 2: assets table Plaid fields
            print("\n2. Checking assets table for Plaid fields...")
            if 'assets' in tables:
                columns = [col['name'] for col in inspector.get_columns('assets')]
                plaid_fields = ['connected_account_id', 'is_connected', 'last_synced_at']
                missing = [field for field in plaid_fields if field not in columns]
                if missing:
                    print(f"   ❌ Missing Plaid fields: {missing}")
                else:
                    print("   ✅ All Plaid fields present")
                    # Check defaults
                    for col in inspector.get_columns('assets'):
                        if col['name'] == 'is_connected':
                            col_type = col.get('type', 'unknown')
                            col_default = col.get('default', 'None')
                            print(f"      - is_connected: type={col_type}, default={col_default}")
            else:
                print("   ⚠️  assets table not found")
            
            # Check 3: liabilities table Plaid fields
            print("\n3. Checking liabilities table for Plaid fields...")
            if 'liabilities' in tables:
                columns = [col['name'] for col in inspector.get_columns('liabilities')]
                plaid_fields = ['connected_account_id', 'is_connected', 'last_synced_at']
                missing = [field for field in plaid_fields if field not in columns]
                if missing:
                    print(f"   ❌ Missing Plaid fields: {missing}")
                else:
                    print("   ✅ All Plaid fields present")
                    # Check defaults
                    for col in inspector.get_columns('liabilities'):
                        if col['name'] == 'is_connected':
                            col_type = col.get('type', 'unknown')
                            col_default = col.get('default', 'None')
                            print(f"      - is_connected: type={col_type}, default={col_default}")
            else:
                print("   ⚠️  liabilities table not found")
            
            # Summary
            print("\n" + "=" * 60)
            print("Summary")
            print("=" * 60)
            
            has_table = 'connected_accounts' in tables
            assets_ok = 'assets' in tables and all(
                col['name'] in [c['name'] for c in inspector.get_columns('assets')]
                for col in [{'name': 'connected_account_id'}, {'name': 'is_connected'}, {'name': 'last_synced_at'}]
            ) if 'assets' in tables else False
            liabilities_ok = 'liabilities' in tables and all(
                col['name'] in [c['name'] for c in inspector.get_columns('liabilities')]
                for col in [{'name': 'connected_account_id'}, {'name': 'is_connected'}, {'name': 'last_synced_at'}]
            ) if 'liabilities' in tables else False
            
            if has_table and assets_ok and liabilities_ok:
                print("✅ Database migration is COMPLETE")
            else:
                print("❌ Database migration is INCOMPLETE")
                print("\nNext steps:")
                if not has_table:
                    print("  - Run: alembic upgrade head")
                if not assets_ok or not liabilities_ok:
                    print("  - Run: alembic upgrade head")
            
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("   Make sure you're in the backend directory with venv activated")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    check_database()

