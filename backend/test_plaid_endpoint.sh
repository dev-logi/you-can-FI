#!/bin/bash

# Test Plaid Endpoint on Railway
# This script tests if the Plaid router is loaded and accessible

RAILWAY_URL="https://you-can-fi-production.up.railway.app"
API_BASE="${RAILWAY_URL}/api/v1"

echo "=========================================="
echo "Testing Plaid Integration on Railway"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health check
echo "1. Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "${RAILWAY_URL}/health")
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | head -n -1)
HEALTH_CODE=$(echo "$HEALTH_RESPONSE" | tail -n 1)

if [ "$HEALTH_CODE" = "200" ]; then
    echo -e "${GREEN}   ✅ Health check passed (200)${NC}"
    echo "   Response: $HEALTH_BODY"
else
    echo -e "${RED}   ❌ Health check failed (${HEALTH_CODE})${NC}"
    echo "   Response: $HEALTH_BODY"
fi
echo ""

# Test 2: Check if Plaid endpoint exists (should return 401 without auth, not 404)
echo "2. Testing Plaid link-token endpoint (without auth - should return 401, not 404)..."
PLAID_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/plaid/link-token" \
    -H "Content-Type: application/json")
PLAID_BODY=$(echo "$PLAID_RESPONSE" | head -n -1)
PLAID_CODE=$(echo "$PLAID_RESPONSE" | tail -n 1)

if [ "$PLAID_CODE" = "404" ]; then
    echo -e "${RED}   ❌ Plaid endpoint NOT FOUND (404)${NC}"
    echo -e "${RED}      This means the Plaid router is NOT loaded!${NC}"
    echo "   Response: $PLAID_BODY"
elif [ "$PLAID_CODE" = "401" ] || [ "$PLAID_CODE" = "403" ]; then
    echo -e "${GREEN}   ✅ Plaid endpoint EXISTS (${PLAID_CODE} - authentication required)${NC}"
    echo -e "${GREEN}      This means the Plaid router IS loaded!${NC}"
    echo "   Response: $PLAID_BODY"
elif [ "$PLAID_CODE" = "500" ]; then
    echo -e "${YELLOW}   ⚠️  Plaid endpoint exists but returns 500 (server error)${NC}"
    echo -e "${YELLOW}      Router is loaded but Plaid service may not be configured${NC}"
    echo "   Response: $PLAID_BODY"
else
    echo -e "${YELLOW}   ⚠️  Unexpected status code: ${PLAID_CODE}${NC}"
    echo "   Response: $PLAID_BODY"
fi
echo ""

# Test 3: Check API docs for Plaid endpoints
echo "3. Checking API documentation for Plaid endpoints..."
DOCS_RESPONSE=$(curl -s "${RAILWAY_URL}/docs")
if echo "$DOCS_RESPONSE" | grep -q "plaid\|Plaid" || echo "$DOCS_RESPONSE" | grep -q "/plaid"; then
    echo -e "${GREEN}   ✅ Plaid endpoints found in API docs${NC}"
else
    echo -e "${YELLOW}   ⚠️  Plaid endpoints not found in API docs${NC}"
    echo "   (This might be normal if docs are cached)"
fi
echo ""

# Test 4: Check OpenAPI spec
echo "4. Checking OpenAPI spec for Plaid endpoints..."
OPENAPI_RESPONSE=$(curl -s "${RAILWAY_URL}/openapi.json")
if echo "$OPENAPI_RESPONSE" | grep -q "\"\/api\/v1\/plaid\"" || echo "$OPENAPI_RESPONSE" | grep -q "plaid"; then
    echo -e "${GREEN}   ✅ Plaid endpoints found in OpenAPI spec${NC}"
    # Extract Plaid paths
    echo "$OPENAPI_RESPONSE" | grep -o '"/api/v1/plaid[^"]*"' | head -5 | sed 's/^/      /'
else
    echo -e "${RED}   ❌ Plaid endpoints NOT found in OpenAPI spec${NC}"
    echo -e "${RED}      This confirms the Plaid router is NOT loaded${NC}"
fi
echo ""

# Summary
echo "=========================================="
echo "Summary"
echo "=========================================="

if [ "$PLAID_CODE" = "404" ]; then
    echo -e "${RED}❌ Plaid router is NOT loaded on Railway${NC}"
    echo ""
    echo "Possible causes:"
    echo "  1. Backend not deployed from feature/plaid-integration branch"
    echo "  2. Import error when loading Plaid router (check Railway logs)"
    echo "  3. Missing dependencies (plaid-python not installed)"
    echo ""
    echo "Next steps:"
    echo "  1. Check Railway logs for: '⚠️ WARNING: Plaid router not available'"
    echo "  2. Verify branch is set to: feature/plaid-integration"
    echo "  3. Check build logs for plaid-python installation"
elif [ "$PLAID_CODE" = "401" ] || [ "$PLAID_CODE" = "403" ]; then
    echo -e "${GREEN}✅ Plaid router IS loaded on Railway${NC}"
    echo ""
    echo "The endpoint exists and requires authentication."
    echo "To test with authentication, you need a valid JWT token."
elif [ "$PLAID_CODE" = "500" ]; then
    echo -e "${YELLOW}⚠️  Plaid router is loaded but service is not configured${NC}"
    echo ""
    echo "The endpoint exists but returns 500 error."
    echo "This usually means:"
    echo "  1. PLAID_CLIENT_ID not set"
    echo "  2. PLAID_SECRET not set"
    echo "  3. Plaid client initialization failed"
    echo ""
    echo "Check Railway environment variables!"
fi

echo ""
echo "=========================================="

