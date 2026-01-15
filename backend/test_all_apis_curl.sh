#!/bin/bash
# Comprehensive Backend API Test Suite using curl

set +e  # Don't exit on errors, we'll handle them

BASE_URL="https://you-can-fi-production.up.railway.app"
API_BASE="${BASE_URL}/api/v1"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test results
PASSED=0
FAILED=0

print_test() {
    echo -e "\n${BLUE}━━━ Testing: $1 ━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
    ((PASSED++))
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
    ((FAILED++))
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

test_health_check() {
    print_test "Health Check (No Auth)"
    
    HTTP_CODE=$(curl -s -o /tmp/health_response.json -w "%{http_code}" "${BASE_URL}/health")
    if [ "$HTTP_CODE" = "200" ]; then
        RESPONSE=$(cat /tmp/health_response.json)
        print_success "Health check passed (${HTTP_CODE})"
        print_info "Response: ${RESPONSE}"
        return 0
    else
        print_error "Health check failed (${HTTP_CODE})"
        cat /tmp/health_response.json
        return 1
    fi
}

test_root() {
    print_test "Root Endpoint (No Auth)"
    
    HTTP_CODE=$(curl -s -o /tmp/root_response.json -w "%{http_code}" "${BASE_URL}/")
    if [ "$HTTP_CODE" = "200" ]; then
        RESPONSE=$(cat /tmp/root_response.json)
        print_success "Root endpoint passed (${HTTP_CODE})"
        print_info "Response: ${RESPONSE}"
        return 0
    else
        print_error "Root endpoint failed (${HTTP_CODE})"
        cat /tmp/root_response.json
        return 1
    fi
}

test_unauthorized() {
    print_test "Unauthorized Access (Should Fail)"
    
    HTTP_CODE=$(curl -s -o /tmp/unauth_response.json -w "%{http_code}" "${API_BASE}/assets/")
    if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
        print_success "Correctly rejected unauthorized request (${HTTP_CODE})"
        return 0
    else
        print_error "Should have returned 401/403, got ${HTTP_CODE}"
        cat /tmp/unauth_response.json
        return 1
    fi
}

test_authenticated_endpoint() {
    local ENDPOINT=$1
    local METHOD=${2:-GET}
    local TOKEN=$3
    local DATA=$4
    
    if [ -z "$TOKEN" ]; then
        print_warning "Skipping ${ENDPOINT} (no token provided)"
        return 2
    fi
    
    HEADERS=(-H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json")
    
    if [ "$METHOD" = "GET" ]; then
        HTTP_CODE=$(curl -s -o /tmp/response.json -w "%{http_code}" "${HEADERS[@]}" "${API_BASE}${ENDPOINT}")
    elif [ "$METHOD" = "POST" ]; then
        HTTP_CODE=$(curl -s -o /tmp/response.json -w "%{http_code}" "${HEADERS[@]}" -X POST -d "${DATA}" "${API_BASE}${ENDPOINT}")
    elif [ "$METHOD" = "PUT" ]; then
        HTTP_CODE=$(curl -s -o /tmp/response.json -w "%{http_code}" "${HEADERS[@]}" -X PUT -d "${DATA}" "${API_BASE}${ENDPOINT}")
    elif [ "$METHOD" = "DELETE" ]; then
        HTTP_CODE=$(curl -s -o /tmp/response.json -w "%{http_code}" "${HEADERS[@]}" -X DELETE "${API_BASE}${ENDPOINT}")
    fi
    
    if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
        RESPONSE=$(cat /tmp/response.json | head -c 500)
        print_success "${METHOD} ${ENDPOINT} (${HTTP_CODE})"
        if [ -n "$RESPONSE" ]; then
            print_info "Response: ${RESPONSE}"
        fi
        return 0
    else
        ERROR=$(cat /tmp/response.json | head -c 200)
        print_error "${METHOD} ${ENDPOINT} failed (${HTTP_CODE})"
        print_info "Error: ${ERROR}"
        return 1
    fi
}

main() {
    echo -e "${BLUE}============================================================${NC}"
    echo -e "${BLUE}Backend API Comprehensive Test Suite${NC}"
    echo -e "${BLUE}============================================================${NC}\n"
    
    # Test basic endpoints (no auth)
    test_health_check
    test_root
    test_unauthorized
    
    # Get token from argument or environment
    TOKEN=${1:-${JWT_TOKEN}}
    
    if [ -z "$TOKEN" ]; then
        echo -e "\n${YELLOW}━━━ Authenticated Endpoint Tests ━━━${NC}"
        print_warning "No JWT token provided. Skipping authenticated endpoint tests."
        print_info "To test authenticated endpoints, provide a token:"
        print_info "  $0 YOUR_JWT_TOKEN"
        print_info "  or"
        print_info "  export JWT_TOKEN=your_token_here"
        print_info "  $0"
        echo ""
        print_info "You can get a token from:"
        print_info "  1. Browser DevTools → Application → Local Storage → supabase.auth.token"
        print_info "  2. Mobile app console logs after login"
        print_info "  3. Supabase Dashboard → Authentication → Users"
    else
        echo -e "\n${BLUE}━━━ Authenticated Endpoint Tests ━━━${NC}"
        print_info "Using provided JWT token (length: ${#TOKEN})"
        
        # Test Assets endpoints
        test_authenticated_endpoint "/assets/" "GET" "$TOKEN"
        
        # Test Liabilities endpoints
        test_authenticated_endpoint "/liabilities/" "GET" "$TOKEN"
        
        # Test Net Worth endpoint
        test_authenticated_endpoint "/net-worth/" "GET" "$TOKEN"
        
        # Test Onboarding endpoints
        test_authenticated_endpoint "/onboarding" "GET" "$TOKEN"
        test_authenticated_endpoint "/onboarding/status" "GET" "$TOKEN"
        test_authenticated_endpoint "/onboarding/progress" "GET" "$TOKEN"
        
        # Test Plaid endpoints (may fail if not configured)
        test_authenticated_endpoint "/plaid/link-token" "POST" "$TOKEN" "{}"
        test_authenticated_endpoint "/plaid/accounts" "GET" "$TOKEN"
    fi
    
    # Summary
    echo -e "\n${BLUE}============================================================${NC}"
    echo -e "${BLUE}Test Summary${NC}"
    echo -e "${BLUE}============================================================${NC}\n"
    echo -e "${GREEN}Passed: ${PASSED}${NC}"
    echo -e "${RED}Failed: ${FAILED}${NC}"
    
    if [ $FAILED -gt 0 ]; then
        echo -e "\n${RED}Some tests failed. Please review the errors above.${NC}"
        exit 1
    else
        echo -e "\n${GREEN}All tests passed! ✓${NC}"
        exit 0
    fi
}

main "$@"

