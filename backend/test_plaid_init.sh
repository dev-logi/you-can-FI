#!/bin/bash
# Test Plaid initialization with authentication

RAILWAY_URL="https://you-can-fi-production.up.railway.app"
API_BASE="${RAILWAY_URL}/api/v1"

echo "============================================================"
echo "Testing Plaid Initialization (with Auth)"
echo "============================================================"
echo ""

if [ -z "$1" ]; then
  echo "Usage: $0 <JWT_TOKEN>"
  echo ""
  echo "To get a JWT token:"
  echo "1. Sign in to your app"
  echo "2. Check browser console or React Native logs"
  echo "3. Look for 'token' or 'session' in localStorage/AsyncStorage"
  echo ""
  echo "Or test without auth to see the error:"
  echo "  curl -X POST ${API_BASE}/plaid/link-token \\"
  echo "    -H 'Content-Type: application/json' \\"
  echo "    -d '{}'"
  exit 1
fi

JWT_TOKEN="$1"

echo "🔍 Testing Plaid link-token endpoint with authentication..."
echo ""

response=$(curl -s -w "\n%{http_code}" -X POST \
  "${API_BASE}/plaid/link-token" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -d '{}' 2>&1)

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo "HTTP Status: $http_code"
echo ""
echo "Response:"
echo "$body" | jq . 2>/dev/null || echo "$body"
echo ""

if [ "$http_code" = "200" ]; then
  echo "✅ SUCCESS! Plaid is initialized correctly"
  echo "   Link token was created successfully"
elif [ "$http_code" = "500" ]; then
  echo "❌ ERROR: Plaid client not initialized"
  echo ""
  if echo "$body" | grep -q "not initialized\|PLAID_CLIENT_ID\|PLAID_SECRET"; then
    echo "This means environment variables are missing or incorrect in Railway."
    echo ""
    echo "Check Railway Variables:"
    echo "1. Go to Railway Dashboard → Backend Service → Variables"
    echo "2. Verify these are set:"
    echo "   - PLAID_CLIENT_ID"
    echo "   - PLAID_SECRET"
    echo "   - PLAID_ENVIRONMENT=sandbox"
    echo "   - PLAID_ENCRYPTION_KEY"
    echo ""
    echo "3. Make sure variable names are exact (case-sensitive)"
    echo "4. Wait for Railway to redeploy after adding variables"
  fi
elif [ "$http_code" = "401" ] || [ "$http_code" = "403" ]; then
  echo "⚠️  Authentication failed"
  echo "   Make sure your JWT token is valid"
elif [ "$http_code" = "404" ]; then
  echo "❌ Endpoint not found"
  echo "   Plaid router is not loaded"
else
  echo "⚠️  Unexpected status: $http_code"
fi



