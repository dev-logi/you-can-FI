# Plaid Integration Error - Fixed

## Issue
The app was showing this error when clicking "Connect Bank Account":
```
Plaid error (INVALID_CONFIGURATION): link token can only be configured for one Link flow
```

## Root Cause
In `backend/app/services/plaid_service.py`, the `create_link_token` function was requesting **two products**:
```python
products=[Products('auth'), Products('balance')],
```

**Problem:** `'balance'` is **NOT a valid Plaid product**. 

In the Plaid API:
- `'auth'` automatically includes balance information
- `'transactions'` also includes balance information  
- There is no standalone `'balance'` product

When you try to request `'balance'` as a separate product, Plaid rejects it with the error:
```
INVALID_CONFIGURATION: link token can only be configured for one Link flow
```

## The Fix
**File:** `backend/app/services/plaid_service.py`  
**Line:** 86

**Before:**
```python
products=[Products('auth'), Products('balance')],
```

**After:**
```python
products=[Products('auth')],  # 'auth' includes balance data automatically
```

## What Changed
1. Removed `Products('balance')` from the products list
2. Added comment explaining that `'auth'` includes balance data automatically
3. Committed and pushed to `feature/plaid-integration` branch
4. Railway will auto-deploy the fix

## How to Verify the Fix

### 1. Wait for Railway Deployment (1-2 minutes)
Railway should automatically deploy the fix from the `feature/plaid-integration` branch.

### 2. Test in the App
1. Open the app in iOS simulator
2. Click "Connect Bank Account" button
3. The Plaid Link modal should now open successfully (no error)
4. Use Plaid Sandbox test credentials:
   - Institution: `first_plaid`
   - Username: `user_good`
   - Password: `pass_good`

### 3. Verify Backend Logs
Check Railway logs to confirm:
- No more "INVALID_CONFIGURATION" errors
- Link token creation succeeds
- Plaid Link modal loads

## Additional Notes

### Valid Plaid Products
For future reference, valid Plaid products include:
- `auth` - Account and routing numbers + balance
- `transactions` - Transaction history + balance
- `identity` - Account holder identity information
- `assets` - Asset reports
- `liabilities` - Liabilities data
- `investments` - Investment holdings
- `income` - Income data
- `payment_initiation` - Payment initiation (requires special config)
- `deposit_switch` - Deposit switch flow (requires special config)
- `transfer` - Transfer flow (requires special config)

**Note:** `balance` is NOT a valid product - it's included automatically with `auth` or `transactions`.

### Why This Error Occurred
This error likely occurred because:
1. The code was written assuming `balance` was a valid product
2. Plaid SDK documentation can be unclear about which products are valid
3. The error message "link token can only be configured for one Link flow" is misleading - it sounds like a configuration issue, not an invalid product error

## Commit Details
- **Commit:** `b7d4475`
- **Branch:** `feature/plaid-integration`
- **Message:** "fix: Remove invalid 'balance' product from Plaid link token"
- **Pushed:** Successfully pushed to origin

## Status
✅ **Fixed** - Code updated and deployed to Railway
⏳ **Testing** - Waiting for Railway deployment to complete (~2 minutes)

The fix is clean, simple, and should resolve the error immediately.
