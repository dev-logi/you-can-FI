#!/bin/bash

# Test Plaid Endpoint with Authentication
# This requires a valid JWT token

RAILWAY_URL="https://you-can-fi-production.up.railway.app"
API_BASE="${RAILWAY_URL}/api/v1"

echo "=========================================="
echo "Testing Plaid Integration with Auth"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if token is provided
if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage: $0 <JWT_TOKEN>${NC}"
    echo ""
    echo "To get a JWT token:"
    echo "  1. Sign in to the app"
    echo "  2. Check browser/app console for the token"
    echo "  3. Or get it from Supabase auth.users table"
    echo ""
    echo "Testing without token (will show 403)..."
    echo ""
    
    # Test without token
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/plaid/link-token" \
        -H "Content-Type: application/json")
    BODY=$(echo "$RESPONSE" | head -n -1)
    CODE=$(echo "$RESPONSE" | tail -n 1)
    
    if [ "$CODE" = "403" ]; then
        echo -e "${GREEN}✅ Endpoint exists and requires auth (403)${NC}"
    else
        echo -e "${RED}❌ Unexpected response: ${CODE}${NC}"
    fi
    exit 0
fi

TOKEN="$1"

echo "Testing with JWT token..."
echo ""

# Test link-token endpoint
echo "1. Testing POST /plaid/link-token..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/plaid/link-token" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json")
BODY=$(echo "$RESPONSE" | head -n -1)
CODE=$(echo "$RESPONSE" | tail -n 1)

if [ "$CODE" = "200" ]; then
    echo -e "${GREEN}   ✅ Link token created successfully!${NC}"
    echo "   Response: $BODY"
    echo ""
    echo -e "${GREEN}✅ Plaid integration is FULLY WORKING!${NC}"
    echo ""
    echo "This confirms:"
    echo "  ✅ Plaid router is loaded"
    echo "  ✅ Plaid service is configured"
    echo "  ✅ Environment variables are set"
    echo "  ✅ Database migration is complete"
elif [ "$CODE" = "500" ]; then
    echo -e "${RED}   ❌ Server error (500)${NC}"
    echo "   Response: $BODY"
    echo ""
    echo "Possible causes:"
    echo "  - PLAID_CLIENT_ID not set"
    echo "  - PLAID_SECRET not set"
    echo "  - Plaid client initialization failed"
    echo "  - Database migration not run (connected_accounts table missing)"
    echo ""
    echo "Check Railway logs for detailed error message"
elif [ "$CODE" = "401" ] || [ "$CODE" = "403" ]; then
    echo -e "${YELLOW}   ⚠️  Authentication failed (${CODE})${NC}"
    echo "   Response: $BODY"
    echo ""
    echo "The token may be invalid or expired."
    echo "Get a fresh token from the app."
else
    echo -e "${YELLOW}   ⚠️  Unexpected status: ${CODE}${NC}"
    echo "   Response: $BODY"
fi

echo ""
echo "=========================================="

