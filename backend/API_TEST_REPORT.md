# Backend API Test Report

**Date**: $(date)  
**Backend URL**: https://you-can-fi-production.up.railway.app  
**Test Script**: `test_all_apis_curl.sh`

## ✅ Tests Passed (No Authentication Required)

### 1. Health Check Endpoint
- **Endpoint**: `GET /health`
- **Status**: ✅ **PASSED** (200)
- **Response**: `{"status":"healthy"}`
- **Notes**: Backend is running and healthy

### 2. Root Endpoint
- **Endpoint**: `GET /`
- **Status**: ✅ **PASSED** (200)
- **Response**: `{"name":"You Can FI","version":"1.0.0","status":"healthy","docs":"/docs"}`
- **Notes**: API information endpoint working

### 3. Unauthorized Access Protection
- **Endpoint**: `GET /api/v1/assets/` (without token)
- **Status**: ✅ **PASSED** (403 Forbidden)
- **Response**: `{"detail":"Invalid authentication credentials"}`
- **Notes**: Authentication is properly enforced

## ⚠️ Tests Requiring Authentication

The following endpoints require a valid JWT token to test:

### Assets API
- `GET /api/v1/assets/` - List all assets
- `POST /api/v1/assets/` - Create asset
- `GET /api/v1/assets/{id}` - Get asset by ID
- `PUT /api/v1/assets/{id}` - Update asset
- `DELETE /api/v1/assets/{id}` - Delete asset
- `GET /api/v1/assets/category/{category}` - Get assets by category

### Liabilities API
- `GET /api/v1/liabilities/` - List all liabilities
- `POST /api/v1/liabilities/` - Create liability
- `GET /api/v1/liabilities/{id}` - Get liability by ID
- `PUT /api/v1/liabilities/{id}` - Update liability
- `DELETE /api/v1/liabilities/{id}` - Delete liability
- `GET /api/v1/liabilities/category/{category}` - Get liabilities by category

### Net Worth API
- `GET /api/v1/net-worth/` - Get net worth summary

### Onboarding API
- `GET /api/v1/onboarding` - Get onboarding state
- `GET /api/v1/onboarding/status` - Check if onboarding is complete
- `GET /api/v1/onboarding/progress` - Get onboarding progress
- `POST /api/v1/onboarding/answer` - Answer a question
- `POST /api/v1/onboarding/household` - Set household type
- `POST /api/v1/onboarding/task/complete` - Complete a task
- `POST /api/v1/onboarding/task/skip` - Skip a task
- `POST /api/v1/onboarding/complete` - Mark onboarding as complete
- `POST /api/v1/onboarding/go-to-step` - Navigate to specific step
- `DELETE /api/v1/onboarding/reset` - Reset onboarding

### Plaid API
- `POST /api/v1/plaid/link-token` - Generate Plaid Link token
- `POST /api/v1/plaid/exchange-token` - Exchange public token
- `GET /api/v1/plaid/accounts` - List connected accounts
- `POST /api/v1/plaid/sync` - Sync all accounts
- `POST /api/v1/plaid/accounts/{id}/sync` - Sync specific account
- `POST /api/v1/plaid/accounts/{id}/link` - Link account to entity
- `DELETE /api/v1/plaid/accounts/{id}` - Disconnect account

## How to Test Authenticated Endpoints

### Option 1: Using the Test Script

```bash
# Get a JWT token from your app (see below)
# Then run:
./test_all_apis_curl.sh YOUR_JWT_TOKEN
```

### Option 2: Manual Testing with curl

```bash
# Set your token
TOKEN="your_jwt_token_here"

# Test listing assets
curl -H "Authorization: Bearer $TOKEN" \
  https://you-can-fi-production.up.railway.app/api/v1/assets/

# Test listing liabilities
curl -H "Authorization: Bearer $TOKEN" \
  https://you-can-fi-production.up.railway.app/api/v1/liabilities/

# Test net worth
curl -H "Authorization: Bearer $TOKEN" \
  https://you-can-fi-production.up.railway.app/api/v1/net-worth/

# Test onboarding state
curl -H "Authorization: Bearer $TOKEN" \
  https://you-can-fi-production.up.railway.app/api/v1/onboarding
```

## Getting a JWT Token

### From Browser (Web App)
1. Open browser DevTools (F12)
2. Go to Application → Local Storage
3. Find `supabase.auth.token` or similar key
4. Copy the `access_token` value from the JSON

### From Mobile App
1. Log in to the app
2. Check console logs for the token
3. Or use React Native Debugger to inspect auth store

### From Supabase Dashboard
1. Go to Supabase Dashboard → Authentication → Users
2. Find your user
3. Tokens are generated on login (not stored in dashboard)
4. You'll need to log in via the app to get a token

## Troubleshooting "UI Not Loading Values"

If the UI is not loading values for an existing user, check:

1. **Authentication Token**
   - Is the token valid and not expired?
   - Is it being sent in the `Authorization: Bearer` header?

2. **User ID Matching**
   - Does the token's `sub` claim match the `user_id` in the database?
   - Are assets/liabilities associated with the correct `user_id`?

3. **Database State**
   - Are there any records in the `assets` table for this user?
   - Are there any records in the `liabilities` table for this user?
   - Check: `SELECT * FROM assets WHERE user_id = 'user_id_here';`

4. **API Response**
   - What does the API actually return? (use curl with token)
   - Is it returning an empty array `[]` or an error?

5. **CORS Issues**
   - Check browser console for CORS errors
   - Verify backend CORS settings allow the frontend origin

6. **Network Issues**
   - Check browser Network tab for failed requests
   - Verify the API URL is correct in frontend config

## Next Steps

1. **Get a JWT token** from a logged-in user
2. **Test authenticated endpoints** using the script or curl
3. **Check database** to verify data exists for the user
4. **Check frontend logs** for API call errors
5. **Verify CORS** settings if requests are blocked

## Test Results Summary

- ✅ Health check: **PASSING**
- ✅ Root endpoint: **PASSING**
- ✅ Authentication: **ENFORCED**
- ⚠️ Authenticated endpoints: **REQUIRE TOKEN TO TEST**

