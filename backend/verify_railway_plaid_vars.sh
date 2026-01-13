#!/bin/bash
# Verify Plaid Environment Variables in Railway Deployment

RAILWAY_URL="https://you-can-fi-production.up.railway.app"
API_BASE="${RAILWAY_URL}/api/v1"

echo "============================================================"
echo "Verifying Plaid Configuration on Railway"
echo "============================================================"
echo ""

echo "🔍 Testing Plaid link-token endpoint..."
echo ""

# Test without auth (should fail with 403 or 500)
echo "1. Testing endpoint availability (no auth)..."
response=$(curl -s -w "\n%{http_code}" -X POST \
  "${API_BASE}/plaid/link-token" \
  -H "Content-Type: application/json" \
  -d '{}' 2>&1)

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo "   HTTP Status: $http_code"

if [ "$http_code" = "404" ]; then
  echo "   ❌ Endpoint NOT FOUND - Plaid router not loaded"
  exit 1
elif [ "$http_code" = "403" ] || [ "$http_code" = "401" ]; then
  echo "   ✅ Endpoint EXISTS - Router is loaded (auth required)"
elif [ "$http_code" = "500" ]; then
  echo "   ⚠️  Endpoint exists but returns 500"
  echo "   Response: $body"
  
  # Check if it's the "not initialized" error
  if echo "$body" | grep -q "not initialized\|PLAID_CLIENT_ID\|PLAID_SECRET"; then
    echo ""
    echo "   ❌ Plaid client is NOT initialized"
    echo "   This means environment variables are missing or incorrect"
    echo ""
    echo "   Please check Railway Variables tab for:"
    echo "   - PLAID_CLIENT_ID"
    echo "   - PLAID_SECRET"
    echo "   - PLAID_ENVIRONMENT"
    echo "   - PLAID_ENCRYPTION_KEY"
    exit 1
  else
    echo "   ⚠️  Different error - check Railway logs"
  fi
else
  echo "   ⚠️  Unexpected status: $http_code"
  echo "   Response: $body"
fi

echo ""
echo "============================================================"
echo "Next Steps"
echo "============================================================"
echo ""
echo "If you see 'not initialized' error:"
echo "1. Go to Railway Dashboard → Backend Service → Variables"
echo "2. Verify these 4 variables are set:"
echo "   - PLAID_CLIENT_ID"
echo "   - PLAID_SECRET"
echo "   - PLAID_ENVIRONMENT (should be 'sandbox')"
echo "   - PLAID_ENCRYPTION_KEY"
echo ""
echo "3. Check variable names (case-sensitive, no typos)"
echo "4. Wait for Railway to redeploy after adding variables"
echo "5. Check Railway logs for any errors"
echo ""



