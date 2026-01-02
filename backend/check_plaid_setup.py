#!/usr/bin/env python3
"""
Check Plaid Integration Setup

This script verifies that:
1. Plaid router can be imported
2. Plaid service can be initialized
3. Environment variables are set (without exposing values)
4. Database migration has been run
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def check_plaid_router():
    """Check if Plaid router can be imported."""
    print("🔍 Checking Plaid router import...")
    try:
        from app.api import plaid
        print("   ✅ Plaid router module imported successfully")
        if hasattr(plaid, 'router'):
            print("   ✅ Plaid router object exists")
            return True
        else:
            print("   ❌ Plaid router object not found")
            return False
    except ImportError as e:
        print(f"   ❌ Failed to import Plaid router: {e}")
        return False
    except Exception as e:
        print(f"   ❌ Error importing Plaid router: {e}")
        return False

def check_plaid_service():
    """Check if Plaid service can be initialized."""
    print("\n🔍 Checking Plaid service...")
    try:
        from app.services.plaid_service import plaid_service
        print("   ✅ Plaid service imported successfully")
        
        # Check if client can be accessed (will fail if env vars not set)
        try:
            client = plaid_service.client
            print("   ✅ Plaid client initialized successfully")
            return True
        except RuntimeError as e:
            print(f"   ⚠️  Plaid client not initialized: {e}")
            print("      This is expected if PLAID_CLIENT_ID and PLAID_SECRET are not set")
            return False
    except ImportError as e:
        print(f"   ❌ Failed to import Plaid service: {e}")
        return False
    except Exception as e:
        print(f"   ❌ Error with Plaid service: {e}")
        return False

def check_environment_variables():
    """Check if Plaid environment variables are set (without exposing values)."""
    print("\n🔍 Checking environment variables...")
    from app.config import get_settings
    
    settings = get_settings()
    
    checks = {
        'PLAID_CLIENT_ID': bool(settings.plaid_client_id),
        'PLAID_SECRET': bool(settings.plaid_secret),
        'PLAID_ENVIRONMENT': bool(settings.plaid_environment),
        'PLAID_ENCRYPTION_KEY': bool(settings.plaid_encryption_key),
    }
    
    all_set = True
    for var, is_set in checks.items():
        if is_set:
            print(f"   ✅ {var} is set")
        else:
            print(f"   ❌ {var} is NOT set")
            all_set = False
    
    if settings.plaid_environment:
        print(f"   ℹ️  Plaid environment: {settings.plaid_environment}")
    
    return all_set

def check_database_migration():
    """Check if database migration has been run."""
    print("\n🔍 Checking database migration...")
    try:
        from sqlalchemy import create_engine, inspect
        from app.config import get_settings
        
        settings = get_settings()
        
        if not settings.database_url:
            print("   ⚠️  DATABASE_URL not set, skipping database check")
            return None
        
        # Create engine
        engine = create_engine(settings.database_url.replace('+psycopg', ''))
        
        with engine.connect() as conn:
            inspector = inspect(engine)
            tables = inspector.get_table_names()
            
            # Check for connected_accounts table
            if 'connected_accounts' in tables:
                print("   ✅ connected_accounts table exists")
                
                # Check columns
                columns = [col['name'] for col in inspector.get_columns('connected_accounts')]
                required_columns = ['id', 'user_id', 'plaid_item_id', 'plaid_access_token', 'plaid_account_id']
                missing = [col for col in required_columns if col not in columns]
                if missing:
                    print(f"   ❌ Missing columns: {missing}")
                    return False
                else:
                    print("   ✅ All required columns present")
            else:
                print("   ❌ connected_accounts table does NOT exist")
                print("      Run: alembic upgrade head")
                return False
            
            # Check assets table for Plaid fields
            if 'assets' in tables:
                columns = [col['name'] for col in inspector.get_columns('assets')]
                plaid_fields = ['connected_account_id', 'is_connected', 'last_synced_at']
                missing = [field for field in plaid_fields if field not in columns]
                if missing:
                    print(f"   ⚠️  Assets table missing Plaid fields: {missing}")
                else:
                    print("   ✅ Assets table has Plaid fields")
            
            # Check liabilities table for Plaid fields
            if 'liabilities' in tables:
                columns = [col['name'] for col in inspector.get_columns('liabilities')]
                plaid_fields = ['connected_account_id', 'is_connected', 'last_synced_at']
                missing = [field for field in plaid_fields if field not in columns]
                if missing:
                    print(f"   ⚠️  Liabilities table missing Plaid fields: {missing}")
                else:
                    print("   ✅ Liabilities table has Plaid fields")
            
            return True
    except Exception as e:
        print(f"   ⚠️  Could not check database: {e}")
        print("      Make sure DATABASE_URL is set correctly")
        return None

def main():
    print("=" * 60)
    print("Plaid Integration Setup Check")
    print("=" * 60)
    
    results = {
        'router': check_plaid_router(),
        'service': check_plaid_service(),
        'env_vars': check_environment_variables(),
        'database': check_database_migration(),
    }
    
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    
    for check, result in results.items():
        if result is True:
            status = "✅ PASS"
        elif result is False:
            status = "❌ FAIL"
        else:
            status = "⚠️  SKIP"
        print(f"{check:15} {status}")
    
    print("\n" + "=" * 60)
    
    # Overall status
    critical_checks = ['router', 'env_vars']
    all_critical_pass = all(results.get(check) for check in critical_checks if results.get(check) is not None)
    
    if all_critical_pass:
        print("✅ Plaid integration is properly configured!")
    else:
        print("❌ Plaid integration needs configuration.")
        print("\nNext steps:")
        if not results.get('router'):
            print("  - Check that plaid-python is installed: pip install plaid-python")
        if not results.get('env_vars'):
            print("  - Set PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENVIRONMENT, and PLAID_ENCRYPTION_KEY")
        if results.get('database') is False:
            print("  - Run database migration: alembic upgrade head")

if __name__ == '__main__':
    main()

