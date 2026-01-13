# Debugging Steps for Plaid Integration Error

## What I've Done

I've added comprehensive logging throughout the Plaid integration flow to help identify where the error is occurring. The logs will now show:

### 1. Frontend Logging Added

**PlaidLinkButton:**
- Logs when handleError is called
- Logs full error object, type, keys, and stringified version

**PlaidLinkModal:**
- Logs all messages received from WebView
- Logs message parsing and type
- Logs PLAID_SUCCESS, PLAID_EXIT, PLAID_ERROR, and PLAID_EVENT
- Logs WebView errors (onError, onHttpError)
- Logs WebView load events

**PlaidStore:**
- Logs when exchangePublicToken is called
- Logs API service calls
- Logs successful responses
- Logs detailed error information

**PlaidApiService:**
- Logs API requests
- Logs responses
- Logs detailed error information

## Next Steps to Debug

### Step 1: Check Console Logs
1. Open your app's developer console (React Native debugger or browser console)
2. Click "Connect Bank Account" button
3. Look for logs starting with:
   - `[PlaidLinkButton]`
   - `[PlaidLinkModal]`
   - `[PlaidStore]`
   - `[PlaidApiService]`

### Step 2: Identify Error Location
The logs will tell you where the error occurs:
- **If error is in PlaidLinkButton.handlePress**: Link token creation failed
- **If error is in PlaidLinkModal.handleMessage**: WebView/JavaScript error
- **If error is in PlaidStore.exchangePublicToken**: Token exchange failed
- **If error is in PlaidApiService.exchangePublicToken**: Backend API error

### Step 3: Check Backend Logs
1. Go to Railway Dashboard
2. Navigate to your backend service
3. Go to Deployments → Latest → View Logs
4. Look for errors when you click the button

### Step 4: Test Backend Endpoint Directly
Run this script to test if the backend is working:

```bash
# Get your JWT token from the app (check console or Supabase)
./backend/test_plaid_with_auth.sh YOUR_JWT_TOKEN
```

### Step 5: Check Network Requests
1. Open browser DevTools (if testing on web)
2. Go to Network tab
3. Click "Connect Bank Account"
4. Look for:
   - `/api/v1/plaid/link-token` request
   - `/api/v1/plaid/exchange-token` request (if it gets that far)
5. Check request/response details

## Common Error Scenarios

### Scenario 1: Link Token Creation Fails
**Look for:** `[PlaidLinkButton] handlePress` error
**Check:**
- Railway environment variables are set correctly
- Backend logs show Plaid API errors
- Network request to `/api/v1/plaid/link-token` fails

### Scenario 2: WebView/JavaScript Error
**Look for:** `[PlaidLinkModal] PLAID_ERROR` or WebView errors
**Check:**
- WebView can load HTML
- Plaid Link script loads from CDN
- JavaScript errors in WebView console

### Scenario 3: Token Exchange Fails
**Look for:** `[PlaidStore] Exchange token error` or `[PlaidApiService] Exchange token error`
**Check:**
- Backend logs for exchange-token endpoint errors
- Database connection issues
- Plaid API errors during exchange
- Network request to `/api/v1/plaid/exchange-token` fails

### Scenario 4: Account Creation Fails
**Look for:** Errors after exchange but before showing AccountLinkingModal
**Check:**
- Database migration completed
- `connected_accounts` table exists
- Database permissions

## What to Share

When you see the error, please share:
1. **Console logs** - All logs starting with `[Plaid*]`
2. **Backend logs** - Railway deployment logs
3. **Network requests** - If available, the failed request/response
4. **Error message** - The exact error text shown to user

This will help identify the exact failure point and fix it.
