# Plaid Integration Debugging - Summary

## What I've Done

I've added **comprehensive logging** throughout the entire Plaid integration flow to help identify exactly where the error is occurring. Here's what was added:

### 1. Enhanced Error Logging

**PlaidLinkButton.tsx:**
- ✅ Logs full error object when `handleError` is called
- ✅ Logs error type, keys, and stringified version
- ✅ Helps identify if error is from link token creation or modal

**PlaidLinkModal.tsx:**
- ✅ Logs all messages received from WebView
- ✅ Logs message parsing and type (PLAID_SUCCESS, PLAID_EXIT, PLAID_ERROR, PLAID_EVENT)
- ✅ Logs WebView errors (onError, onHttpError)
- ✅ Logs WebView load events
- ✅ Enhanced PLAID_EXIT to check for errors

**PlaidStore (store.ts):**
- ✅ Logs when `exchangePublicToken` is called
- ✅ Logs API service calls
- ✅ Logs successful responses
- ✅ Logs detailed error information (type, keys, detail, message, stringified)

**PlaidApiService (plaidService.ts):**
- ✅ Logs API requests to backend
- ✅ Logs responses
- ✅ Logs detailed error information (type, keys, detail, message, status)

### 2. Created Test Scripts

- ✅ `backend/test_exchange_token.sh` - Test the exchange-token endpoint directly

### 3. Created Documentation

- ✅ `DEBUG_STEPS.md` - Step-by-step debugging guide
- ✅ `PLAID_DEBUG_PLAN.md` - Debugging plan overview

## Next Steps - What You Need to Do

### Step 1: Reproduce the Error with Logging

1. **Open your app's developer console:**
   - If using React Native: Use React Native Debugger or Metro bundler console
   - If using web: Use browser DevTools console

2. **Click "Connect Bank Account" button**

3. **Watch the console logs** - You should see logs like:
   ```
   [PlaidLinkButton] handlePress called
   [PlaidStore] createLinkToken called
   [PlaidApiService] Making POST request to /plaid/link-token
   [PlaidLinkModal] WebView load started
   [PlaidLinkModal] Received message: ...
   ```

4. **When the error occurs**, look for:
   - The last successful log message
   - The first error log message
   - The error details (message, detail, stack, etc.)

### Step 2: Identify Error Location

The logs will tell you exactly where it fails:

| Log Prefix | Error Location |
|-----------|----------------|
| `[PlaidLinkButton] handlePress` error | Link token creation failed |
| `[PlaidLinkModal] PLAID_ERROR` | WebView/JavaScript error |
| `[PlaidLinkModal] WebView error` | WebView failed to load |
| `[PlaidStore] Exchange token error` | Token exchange failed |
| `[PlaidApiService] Exchange token error` | Backend API error |

### Step 3: Check Backend Logs

1. Go to **Railway Dashboard**
2. Navigate to your **backend service**
3. Go to **Deployments → Latest → View Logs**
4. Look for errors when you click the button
5. Check for:
   - Plaid API errors
   - Database errors
   - Authentication errors
   - Any Python exceptions

### Step 4: Test Backend Endpoint

Test if the backend is working:

```bash
# Get your JWT token from the app (check console or Supabase)
cd backend
./test_plaid_with_auth.sh YOUR_JWT_TOKEN
```

This will tell you if:
- ✅ Link token creation works
- ❌ Backend has errors
- ❌ Environment variables are wrong

### Step 5: Share the Information

When you see the error, please share:

1. **Console logs** - All logs starting with `[Plaid*]` from the console
2. **Backend logs** - Railway deployment logs (last 50-100 lines)
3. **Error message** - The exact error text shown to user
4. **Network requests** - If available, the failed request/response from DevTools Network tab

## Common Error Scenarios

### Scenario 1: Link Token Creation Fails
**Symptoms:**
- Error appears immediately after clicking button
- Logs show: `[PlaidLinkButton] handlePress` error
- Backend logs show Plaid API error

**Possible Causes:**
- Environment variables not set correctly
- Plaid credentials invalid
- Plaid API rate limit
- Network connectivity issue

### Scenario 2: WebView/JavaScript Error
**Symptoms:**
- Modal opens but shows error
- Logs show: `[PlaidLinkModal] PLAID_ERROR` or WebView errors

**Possible Causes:**
- Plaid Link script failed to load
- Invalid link token
- JavaScript error in WebView
- CORS issue

### Scenario 3: Token Exchange Fails
**Symptoms:**
- Plaid Link completes successfully
- Error appears after selecting accounts
- Logs show: `[PlaidStore] Exchange token error`

**Possible Causes:**
- Backend exchange-token endpoint error
- Database connection issue
- Plaid API error during exchange
- Missing database migration

### Scenario 4: Account Creation Fails
**Symptoms:**
- Token exchange succeeds
- Error appears when creating connected account
- Backend logs show database error

**Possible Causes:**
- Database migration not run
- `connected_accounts` table missing
- Database permissions issue

## What the Logs Will Show

The enhanced logging will show you:

1. **Where the error occurs** - Exact component/function
2. **What the error is** - Full error object, message, detail
3. **When it occurs** - Sequence of events leading to error
4. **Error context** - Request/response data, token info, etc.

## Files Modified

- ✅ `src/features/plaid/components/PlaidLinkButton.tsx` - Enhanced error logging
- ✅ `src/features/plaid/components/PlaidLinkModal.tsx` - Enhanced message handling and WebView error logging
- ✅ `src/features/plaid/store.ts` - Enhanced exchange token logging
- ✅ `src/api/services/plaidService.ts` - Enhanced API error logging

## Files Created

- ✅ `DEBUG_STEPS.md` - Detailed debugging steps
- ✅ `PLAID_DEBUG_PLAN.md` - Debugging plan
- ✅ `backend/test_exchange_token.sh` - Test script for exchange endpoint
- ✅ `PLAID_DEBUG_SUMMARY.md` - This file

---

**Next Action:** Reproduce the error and check the console logs. The logs will tell us exactly where and why it's failing!
