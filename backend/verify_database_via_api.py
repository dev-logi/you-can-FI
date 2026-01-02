#!/usr/bin/env python3
"""
Verify Database Migration via Backend API

This script attempts to use the Plaid API to verify the database migration.
If the database migration is complete, the API should work (assuming env vars are set).
"""

import sys
import os
import requests
import json

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

RAILWAY_URL = "https://you-can-fi-production.up.railway.app"
API_BASE = f"{RAILWAY_URL}/api/v1"

def test_plaid_endpoint_without_auth():
    """Test if Plaid endpoint exists (should return 403, not 404)."""
    print("🔍 Testing Plaid endpoint (without auth)...")
    try:
        response = requests.post(
            f"{API_BASE}/plaid/link-token",
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 404:
            print("   ❌ Endpoint NOT FOUND (404) - Plaid router not loaded")
            return False
        elif response.status_code in [401, 403]:
            print(f"   ✅ Endpoint EXISTS ({response.status_code}) - Plaid router is loaded")
            return True
        elif response.status_code == 500:
            print("   ⚠️  Endpoint exists but returns 500 - Check env vars or database")
            print(f"   Error: {response.text[:200]}")
            return True  # Router is loaded, but service/config issue
        else:
            print(f"   ⚠️  Unexpected status: {response.status_code}")
            return None
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def check_openapi_spec():
    """Check OpenAPI spec for Plaid endpoints."""
    print("\n🔍 Checking OpenAPI spec for Plaid endpoints...")
    try:
        response = requests.get(f"{RAILWAY_URL}/openapi.json", timeout=10)
        if response.status_code == 200:
            spec = response.json()
            paths = spec.get('paths', {})
            plaid_paths = [path for path in paths.keys() if '/plaid' in path]
            
            if plaid_paths:
                print(f"   ✅ Found {len(plaid_paths)} Plaid endpoints in OpenAPI spec:")
                for path in plaid_paths[:5]:
                    print(f"      - {path}")
                return True
            else:
                print("   ❌ No Plaid endpoints found in OpenAPI spec")
                return False
        else:
            print(f"   ⚠️  Could not fetch OpenAPI spec ({response.status_code})")
            return None
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return None

def main():
    print("=" * 60)
    print("Database Migration Verification via API")
    print("=" * 60)
    print("")
    print("Note: This verifies the Plaid router is loaded.")
    print("To fully verify database migration, run SQL in Supabase.")
    print("")
    
    # Test 1: Check if endpoint exists
    endpoint_exists = test_plaid_endpoint_without_auth()
    
    # Test 2: Check OpenAPI spec
    spec_has_plaid = check_openapi_spec()
    
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    
    if endpoint_exists and spec_has_plaid:
        print("✅ Plaid router is loaded on Railway")
        print("")
        print("To verify database migration:")
        print("  1. Run SQL queries in Supabase SQL Editor")
        print("  2. Or test with a valid JWT token:")
        print("     ./backend/test_plaid_with_auth.sh YOUR_JWT_TOKEN")
    elif endpoint_exists:
        print("✅ Plaid router is loaded (endpoint exists)")
        print("⚠️  Could not verify OpenAPI spec")
    else:
        print("❌ Plaid router is NOT loaded")
        print("   Check Railway logs for import errors")

if __name__ == '__main__':
    main()

