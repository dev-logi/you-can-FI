#!/bin/bash
# Test Backend API Calls with Authentication using curl

set -e

BASE_URL="https://you-can-fi-production.up.railway.app/api/v1"
HEALTH_URL="https://you-can-fi-production.up.railway.app/health"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================================${NC}"
echo -e "${BLUE}Backend API Authentication Test Suite${NC}"
echo -e "${BLUE}============================================================${NC}\n"

# Test 1: Health Check (no auth required)
echo -e "${BLUE}━━━ Testing: Health Check ━━━${NC}"
if curl -s -f "${HEALTH_URL}" > /dev/null; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${RED}✗ Health check failed${NC}"
    exit 1
fi

# Test 2: Test unauthorized access (should fail)
echo -e "\n${BLUE}━━━ Testing: Unauthorized Access (should fail) ━━━${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/assets/")
if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
    echo -e "${GREEN}✓ Correctly rejected unauthorized request (${HTTP_CODE})${NC}"
else
    echo -e "${RED}✗ Should have returned 401/403, got ${HTTP_CODE}${NC}"
fi

# Note: To test authenticated endpoints, you need a valid JWT token
echo -e "\n${YELLOW}━━━ Note: Authenticated Endpoint Tests ━━━${NC}"
echo -e "${YELLOW}To test authenticated endpoints, you need:${NC}"
echo -e "${YELLOW}  1. A valid JWT token from Supabase${NC}"
echo -e "${YELLOW}  2. Pass it as: curl -H \"Authorization: Bearer <token>\" ...${NC}"
echo -e "\n${YELLOW}Example authenticated test:${NC}"
echo -e "${YELLOW}  curl -H \"Authorization: Bearer YOUR_TOKEN\" ${BASE_URL}/assets/${NC}"

echo -e "\n${BLUE}============================================================${NC}"
echo -e "${BLUE}Basic tests completed${NC}"
echo -e "${BLUE}============================================================${NC}\n"

