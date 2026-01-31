# Backend API Testing Guide

## Issues Found and Fixed

### 1. Repository Update/Delete Methods ✅ FIXED
**Problem**: The `update` and `delete` methods in asset and liability repositories were calling `super().update()` and `super().delete()`, which use the base repository's `get()` method that doesn't filter by `user_id`.

**Fix Applied**:
- Updated `asset_repository.py` to implement `update` and `delete` directly without calling super()
- Updated `liability_repository.py` to implement `update` and `delete` directly without calling super()
- Both now properly filter by `user_id` before updating/deleting

### 2. HTTPBearer Security ✅ FIXED
**Problem**: `HTTPBearer()` was not explicitly configured with `auto_error=True`, which could cause inconsistent behavior.

**Fix Applied**:
- Updated to `HTTPBearer(auto_error=True)` to ensure 403 is returned when token is missing

## Testing the Backend

### Prerequisites
1. You need a valid JWT token from Supabase
2. The backend must be running (Railway production or local)

### Getting a Test Token

**Option 1: From the Mobile App**
1. Log in to the app
2. Check the console logs for the JWT token
3. Or use React Native Debugger to inspect the auth store

**Option 2: From Supabase Dashboard**
1. Go to Supabase Dashboard → Authentication → Users
2. Create a test user or use an existing one
3. The token is generated when the user logs in

**Option 3: Using Supabase API**
```bash
curl -X POST 'https://cwsoawrcxogoxrgmtowx.supabase.co/auth/v1/token?grant_type=password' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }'
```

### Test Commands

#### 1. Health Check (No Auth Required)
```bash
curl https://you-can-fi-production.up.railway.app/health
```

#### 2. Test Unauthorized Access (Should Fail)
```bash
# Should return 403 Forbidden
curl -v https://you-can-fi-production.up.railway.app/api/v1/assets/
```

#### 3. Test Authenticated Endpoints

Replace `YOUR_JWT_TOKEN` with an actual token:

```bash
# List assets
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://you-can-fi-production.up.railway.app/api/v1/assets/

# Create asset
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"category":"cash","name":"Test Account","value":5000}' \
  https://you-can-fi-production.up.railway.app/api/v1/assets/

# List liabilities
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://you-can-fi-production.up.railway.app/api/v1/liabilities/

# Create liability
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"category":"credit_card","name":"Test Card","balance":2000,"interest_rate":18.99}' \
  https://you-can-fi-production.up.railway.app/api/v1/liabilities/

# Get net worth
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://you-can-fi-production.up.railway.app/api/v1/net-worth/

# Get onboarding state
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://you-can-fi-production.up.railway.app/api/v1/onboarding/
```

## Database Migration Check

The models have `user_id` columns, but you need to ensure the database tables have these columns. Check:

1. **If using Alembic migrations**: Run `alembic upgrade head`
2. **If using `create_tables()`**: The tables should be created automatically with `user_id` columns
3. **For existing data**: You may need to add `user_id` to existing records or clear the data

## Common Issues

### Issue: "Internal Server Error" when creating assets/liabilities
**Cause**: Database table doesn't have `user_id` column
**Fix**: Run database migration or recreate tables

### Issue: "Invalid authentication credentials"
**Cause**: JWT token is invalid or expired
**Fix**: Get a fresh token by logging in again

### Issue: Empty results even after creating assets
**Cause**: 
1. `user_id` not being set correctly
2. Query filtering by wrong `user_id`
**Fix**: Check that the token's `sub` claim matches the `user_id` in the database

### Issue: Can access endpoints without token
**Cause**: HTTPBearer not configured correctly
**Fix**: Ensure `HTTPBearer(auto_error=True)` is set

## Next Steps

1. **Test with real token**: Get a JWT token from your app login
2. **Verify database**: Ensure `user_id` columns exist in all tables
3. **Test CRUD operations**: Create, read, update, delete assets/liabilities
4. **Test user isolation**: Create assets for different users and verify they can't see each other's data

