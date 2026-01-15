#!/bin/bash

# Test Plaid exchange-token endpoint
# Usage: ./test_exchange_token.sh <JWT_TOKEN> <PUBLIC_TOKEN>

if [ -z "$1" ]; then
  echo "Usage: $0 <JWT_TOKEN> [PUBLIC_TOKEN]"
  echo ""
  echo "To get JWT_TOKEN:"
  echo "  1. Sign in to your app"
  echo "  2. Check browser console or React Native logs"
  echo "  3. Look for auth token or get from Supabase"
  echo ""
  echo "PUBLIC_TOKEN is optional - if not provided, will test with a dummy token"
  exit 1
fi

JWT_TOKEN=$1
PUBLIC_TOKEN=${2:-"public-sandbox-test-token"}

# Get backend URL from environment or use default
BACKEND_URL=${BACKEND_URL:-"https://you-can-fi-production.up.railway.app"}

echo "Testing Plaid exchange-token endpoint..."
echo "Backend URL: $BACKEND_URL"
echo "Public Token: $PUBLIC_TOKEN"
echo ""

curl -X POST "${BACKEND_URL}/api/v1/plaid/exchange-token" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"public_token\": \"${PUBLIC_TOKEN}\"}" \
  -v

echo ""
echo ""
echo "Note: This will likely fail with a real Plaid error since we're using a dummy token."
echo "The important thing is to see if the endpoint is reachable and what error it returns."
