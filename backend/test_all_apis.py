#!/usr/bin/env python3
"""
Test All Backend APIs

Tests all backend API endpoints to verify they're working correctly.
Requires a valid JWT token from Supabase.
"""

import requests
import json
import sys
from typing import Optional

# Backend API URL
BASE_URL = "https://you-can-fi-production.up.railway.app"
API_BASE = f"{BASE_URL}/api/v1"

def test_health_check():
    """Test health check endpoint (no auth required)."""
    print("\n" + "="*60)
    print("Testing Health Check Endpoint")
    print("="*60)
    
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_root():
    """Test root endpoint (no auth required)."""
    print("\n" + "="*60)
    print("Testing Root Endpoint")
    print("="*60)
    
    try:
        response = requests.get(f"{BASE_URL}/", timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_assets(token: str):
    """Test assets endpoints."""
    print("\n" + "="*60)
    print("Testing Assets Endpoints")
    print("="*60)
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # List assets
    print("\n1. GET /api/v1/assets/")
    try:
        response = requests.get(f"{API_BASE}/assets/", headers=headers, timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            assets = response.json()
            print(f"   ✅ Success: Found {len(assets)} assets")
            if assets:
                print(f"   First asset: {json.dumps(assets[0], indent=6)}")
        else:
            print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Exception: {e}")

def test_liabilities(token: str):
    """Test liabilities endpoints."""
    print("\n" + "="*60)
    print("Testing Liabilities Endpoints")
    print("="*60)
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # List liabilities
    print("\n1. GET /api/v1/liabilities/")
    try:
        response = requests.get(f"{API_BASE}/liabilities/", headers=headers, timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            liabilities = response.json()
            print(f"   ✅ Success: Found {len(liabilities)} liabilities")
            if liabilities:
                print(f"   First liability: {json.dumps(liabilities[0], indent=6)}")
        else:
            print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Exception: {e}")

def test_net_worth(token: str):
    """Test net worth endpoint."""
    print("\n" + "="*60)
    print("Testing Net Worth Endpoint")
    print("="*60)
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n1. GET /api/v1/net-worth/")
    try:
        response = requests.get(f"{API_BASE}/net-worth/", headers=headers, timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            summary = response.json()
            print(f"   ✅ Success")
            print(f"   Total Assets: ${summary.get('total_assets', 0):,.2f}")
            print(f"   Total Liabilities: ${summary.get('total_liabilities', 0):,.2f}")
            print(f"   Net Worth: ${summary.get('net_worth', 0):,.2f}")
        else:
            print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Exception: {e}")

def test_onboarding(token: str):
    """Test onboarding endpoints."""
    print("\n" + "="*60)
    print("Testing Onboarding Endpoints")
    print("="*60)
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n1. GET /api/v1/onboarding")
    try:
        response = requests.get(f"{API_BASE}/onboarding", headers=headers, timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            state = response.json()
            print(f"   ✅ Success")
            print(f"   Current Step: {state.get('current_step_id', 'N/A')}")
            print(f"   Is Complete: {state.get('is_complete', False)}")
            print(f"   Tasks: {len(state.get('tasks', []))}")
        else:
            print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Exception: {e}")

def test_plaid(token: str):
    """Test Plaid endpoints."""
    print("\n" + "="*60)
    print("Testing Plaid Endpoints")
    print("="*60)
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n1. POST /api/v1/plaid/link-token")
    try:
        response = requests.post(f"{API_BASE}/plaid/link-token", headers=headers, timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Success: Link token generated")
            print(f"   Token (first 20 chars): {data.get('link_token', '')[:20]}...")
        else:
            print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Exception: {e}")
    
    print("\n2. GET /api/v1/plaid/accounts")
    try:
        response = requests.get(f"{API_BASE}/plaid/accounts", headers=headers, timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            accounts = data.get('accounts', [])
            print(f"   ✅ Success: Found {len(accounts)} connected accounts")
        else:
            print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Exception: {e}")

def main():
    """Run all API tests."""
    print("\n" + "="*60)
    print("Backend API Test Suite")
    print("="*60)
    
    # Test endpoints that don't require auth
    health_ok = test_health_check()
    root_ok = test_root()
    
    if not health_ok or not root_ok:
        print("\n❌ Basic endpoints failed. Check backend deployment.")
        return
    
    # Get token from user or environment
    token = sys.argv[1] if len(sys.argv) > 1 else None
    
    if not token:
        print("\n" + "="*60)
        print("⚠️  No JWT token provided")
        print("="*60)
        print("\nTo test authenticated endpoints, provide a JWT token:")
        print("  python3 test_all_apis.py YOUR_JWT_TOKEN")
        print("\nOr set it as environment variable:")
        print("  export JWT_TOKEN=your_token_here")
        print("  python3 test_all_apis.py")
        print("\nYou can get a token from:")
        print("  1. Supabase Dashboard → Authentication → Users")
        print("  2. Your app's auth store after logging in")
        print("  3. Browser DevTools → Application → Local Storage")
        return
    
    # Test authenticated endpoints
    test_assets(token)
    test_liabilities(token)
    test_net_worth(token)
    test_onboarding(token)
    test_plaid(token)
    
    print("\n" + "="*60)
    print("✅ API Testing Complete")
    print("="*60)

if __name__ == "__main__":
    main()

