#!/usr/bin/env python3
"""
Test Backend API Calls with Authentication

This script tests all backend API endpoints after the user_id changes.
It simulates authenticated requests using a test JWT token.
"""

import requests
import json
import sys
from typing import Optional

# Configuration
BASE_URL = "https://you-can-fi-production.up.railway.app/api/v1"
# For local testing, use: BASE_URL = "http://localhost:8000/api/v1"

# Test user credentials (you'll need to create this user in Supabase)
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "testpass123"

# Colors for output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"


def print_test(name: str):
    """Print test header."""
    print(f"\n{BLUE}━━━ Testing: {name} ━━━{RESET}")


def print_success(message: str):
    """Print success message."""
    print(f"{GREEN}✓ {message}{RESET}")


def print_error(message: str):
    """Print error message."""
    print(f"{RED}✗ {message}{RESET}")


def print_warning(message: str):
    """Print warning message."""
    print(f"{YELLOW}⚠ {message}{RESET}")


def get_auth_token() -> Optional[str]:
    """Get authentication token from Supabase."""
    print_test("Authentication")
    
    # Supabase auth endpoint
    supabase_url = "https://cwsoawrcxogoxrgmtowx.supabase.co/auth/v1/token?grant_type=password"
    
    try:
        response = requests.post(
            supabase_url,
            json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
            },
            headers={
                "Content-Type": "application/json",
                "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3c29hd3JjeG9nb3hyZ210b3d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MzcxMDMsImV4cCI6MjA4MTQxMzEwM30.Ei4_D44jywFpkneIKRHkSFMGL8MVodBYEof82xlZ-iU",
            },
            timeout=10,
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            if token:
                print_success(f"Got auth token (length: {len(token)})")
                return token
            else:
                print_error("No access_token in response")
                print(f"Response: {json.dumps(data, indent=2)}")
                return None
        else:
            print_error(f"Auth failed: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print_error(f"Auth request failed: {str(e)}")
        return None


def test_health_check():
    """Test health check endpoint (no auth required)."""
    print_test("Health Check")
    
    try:
        response = requests.get(f"{BASE_URL.replace('/api/v1', '')}/health", timeout=10)
        if response.status_code == 200:
            print_success("Health check passed")
            return True
        else:
            print_error(f"Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Health check failed: {str(e)}")
        return False


def test_assets_api(token: str):
    """Test all asset API endpoints."""
    print_test("Assets API")
    
    headers = {"Authorization": f"Bearer {token}"}
    asset_id = None
    
    # 1. Create asset
    print("  Creating asset...")
    create_data = {
        "category": "cash",
        "name": "Test Checking Account",
        "value": 5000.0,
    }
    try:
        response = requests.post(
            f"{BASE_URL}/assets/",
            json=create_data,
            headers=headers,
            timeout=30,
        )
        if response.status_code == 201:
            asset = response.json()
            asset_id = asset.get("id")
            print_success(f"Created asset: {asset.get('name')} (ID: {asset_id})")
        else:
            print_error(f"Create asset failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print_error(f"Create asset request failed: {str(e)}")
        return False
    
    # 2. List assets
    print("  Listing assets...")
    try:
        response = requests.get(f"{BASE_URL}/assets/", headers=headers, timeout=30)
        if response.status_code == 200:
            assets = response.json()
            print_success(f"Listed {len(assets)} assets")
        else:
            print_error(f"List assets failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print_error(f"List assets request failed: {str(e)}")
        return False
    
    # 3. Get asset by ID
    if asset_id:
        print(f"  Getting asset {asset_id}...")
        try:
            response = requests.get(
                f"{BASE_URL}/assets/{asset_id}",
                headers=headers,
                timeout=30,
            )
            if response.status_code == 200:
                asset = response.json()
                print_success(f"Retrieved asset: {asset.get('name')}")
            else:
                print_error(f"Get asset failed: {response.status_code}")
                print(f"Response: {response.text}")
                return False
        except Exception as e:
            print_error(f"Get asset request failed: {str(e)}")
            return False
        
        # 4. Update asset
        print(f"  Updating asset {asset_id}...")
        update_data = {"value": 6000.0}
        try:
            response = requests.put(
                f"{BASE_URL}/assets/{asset_id}",
                json=update_data,
                headers=headers,
                timeout=30,
            )
            if response.status_code == 200:
                asset = response.json()
                print_success(f"Updated asset value to: ${asset.get('value')}")
            else:
                print_error(f"Update asset failed: {response.status_code}")
                print(f"Response: {response.text}")
                return False
        except Exception as e:
            print_error(f"Update asset request failed: {str(e)}")
            return False
        
        # 5. Delete asset
        print(f"  Deleting asset {asset_id}...")
        try:
            response = requests.delete(
                f"{BASE_URL}/assets/{asset_id}",
                headers=headers,
                timeout=30,
            )
            if response.status_code == 204:
                print_success("Deleted asset")
            else:
                print_error(f"Delete asset failed: {response.status_code}")
                print(f"Response: {response.text}")
                return False
        except Exception as e:
            print_error(f"Delete asset request failed: {str(e)}")
            return False
    
    return True


def test_liabilities_api(token: str):
    """Test all liability API endpoints."""
    print_test("Liabilities API")
    
    headers = {"Authorization": f"Bearer {token}"}
    liability_id = None
    
    # 1. Create liability
    print("  Creating liability...")
    create_data = {
        "category": "credit_card",
        "name": "Test Credit Card",
        "balance": 2000.0,
        "interest_rate": 18.99,
    }
    try:
        response = requests.post(
            f"{BASE_URL}/liabilities/",
            json=create_data,
            headers=headers,
            timeout=30,
        )
        if response.status_code == 201:
            liability = response.json()
            liability_id = liability.get("id")
            print_success(f"Created liability: {liability.get('name')} (ID: {liability_id})")
        else:
            print_error(f"Create liability failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print_error(f"Create liability request failed: {str(e)}")
        return False
    
    # 2. List liabilities
    print("  Listing liabilities...")
    try:
        response = requests.get(f"{BASE_URL}/liabilities/", headers=headers, timeout=30)
        if response.status_code == 200:
            liabilities = response.json()
            print_success(f"Listed {len(liabilities)} liabilities")
        else:
            print_error(f"List liabilities failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print_error(f"List liabilities request failed: {str(e)}")
        return False
    
    # 3. Get liability by ID
    if liability_id:
        print(f"  Getting liability {liability_id}...")
        try:
            response = requests.get(
                f"{BASE_URL}/liabilities/{liability_id}",
                headers=headers,
                timeout=30,
            )
            if response.status_code == 200:
                liability = response.json()
                print_success(f"Retrieved liability: {liability.get('name')}")
            else:
                print_error(f"Get liability failed: {response.status_code}")
                print(f"Response: {response.text}")
                return False
        except Exception as e:
            print_error(f"Get liability request failed: {str(e)}")
            return False
        
        # 4. Update liability
        print(f"  Updating liability {liability_id}...")
        update_data = {"balance": 1500.0}
        try:
            response = requests.put(
                f"{BASE_URL}/liabilities/{liability_id}",
                json=update_data,
                headers=headers,
                timeout=30,
            )
            if response.status_code == 200:
                liability = response.json()
                print_success(f"Updated liability balance to: ${liability.get('balance')}")
            else:
                print_error(f"Update liability failed: {response.status_code}")
                print(f"Response: {response.text}")
                return False
        except Exception as e:
            print_error(f"Update liability request failed: {str(e)}")
            return False
        
        # 5. Delete liability
        print(f"  Deleting liability {liability_id}...")
        try:
            response = requests.delete(
                f"{BASE_URL}/liabilities/{liability_id}",
                headers=headers,
                timeout=30,
            )
            if response.status_code == 204:
                print_success("Deleted liability")
            else:
                print_error(f"Delete liability failed: {response.status_code}")
                print(f"Response: {response.text}")
                return False
        except Exception as e:
            print_error(f"Delete liability request failed: {str(e)}")
            return False
    
    return True


def test_net_worth_api(token: str):
    """Test net worth API endpoints."""
    print_test("Net Worth API")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get net worth summary
    print("  Getting net worth summary...")
    try:
        response = requests.get(f"{BASE_URL}/net-worth/", headers=headers, timeout=30)
        if response.status_code == 200:
            summary = response.json()
            print_success(f"Net worth: ${summary.get('net_worth', 0):,.2f}")
            print(f"    Assets: ${summary.get('total_assets', 0):,.2f}")
            print(f"    Liabilities: ${summary.get('total_liabilities', 0):,.2f}")
            return True
        else:
            print_error(f"Get net worth failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print_error(f"Get net worth request failed: {str(e)}")
        return False


def test_onboarding_api(token: str):
    """Test onboarding API endpoints."""
    print_test("Onboarding API")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Get onboarding state
    print("  Getting onboarding state...")
    try:
        response = requests.get(f"{BASE_URL}/onboarding/", headers=headers, timeout=30)
        if response.status_code == 200:
            state = response.json()
            print_success(f"Onboarding state retrieved (step: {state.get('current_step_id')})")
        else:
            print_error(f"Get onboarding state failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print_error(f"Get onboarding state request failed: {str(e)}")
        return False
    
    # 2. Check onboarding status
    print("  Checking onboarding status...")
    try:
        response = requests.get(f"{BASE_URL}/onboarding/status", headers=headers, timeout=30)
        if response.status_code == 200:
            status = response.json()
            is_complete = status.get("is_complete", False)
            print_success(f"Onboarding complete: {is_complete}")
        else:
            print_error(f"Get onboarding status failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print_error(f"Get onboarding status request failed: {str(e)}")
        return False
    
    return True


def test_unauthorized_access():
    """Test that endpoints reject requests without auth token."""
    print_test("Unauthorized Access (should fail)")
    
    # Try to access assets without token
    print("  Attempting to access assets without token...")
    try:
        response = requests.get(f"{BASE_URL}/assets/", timeout=30)
        if response.status_code == 401 or response.status_code == 403:
            print_success("Correctly rejected unauthorized request")
            return True
        else:
            print_error(f"Should have returned 401/403, got {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Unauthorized test failed: {str(e)}")
        return False


def main():
    """Run all tests."""
    print(f"\n{BLUE}{'='*60}")
    print("Backend API Authentication Test Suite")
    print(f"{'='*60}{RESET}\n")
    
    results = []
    
    # Test health check (no auth)
    results.append(("Health Check", test_health_check()))
    
    # Get auth token
    token = get_auth_token()
    if not token:
        print_error("\nCannot proceed without authentication token!")
        print_warning("Please ensure:")
        print_warning("  1. Test user exists in Supabase")
        print_warning("  2. Supabase URL and API key are correct")
        sys.exit(1)
    
    # Test unauthorized access
    results.append(("Unauthorized Access", test_unauthorized_access()))
    
    # Test all authenticated endpoints
    results.append(("Assets API", test_assets_api(token)))
    results.append(("Liabilities API", test_liabilities_api(token)))
    results.append(("Net Worth API", test_net_worth_api(token)))
    results.append(("Onboarding API", test_onboarding_api(token)))
    
    # Print summary
    print(f"\n{BLUE}{'='*60}")
    print("Test Summary")
    print(f"{'='*60}{RESET}\n")
    
    passed = 0
    failed = 0
    
    for name, result in results:
        if result:
            print_success(f"{name}: PASSED")
            passed += 1
        else:
            print_error(f"{name}: FAILED")
            failed += 1
    
    print(f"\n{BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ after: {passed}/{len(results)} tests passed")
    
    if failed > 0:
        print_error(f"\n{failed} test(s) failed. Please review the errors above.")
        sys.exit(1)
    else:
        print_success(f"\nAll {passed} tests passed! ✓")
        sys.exit(0)


if __name__ == "__main__":
    main()

