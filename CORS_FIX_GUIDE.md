# CORS Fix Guide

## Problem

The app was experiencing CORS errors when making API requests to the Railway backend:

```
Access to fetch at 'http://you-can-fi-production.up.railway.app/api/v1/net-worth/' 
(redirected from 'https://you-can-fi-production.up.railway.app/api/v1/net-worth') 
from origin 'http://localhost:8081' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
Redirect is not allowed for a preflight request.
```

## Root Causes

1. **Trailing Slash Redirect**: Frontend called `/net-worth` but backend expects `/net-worth/`, causing a redirect
2. **HTTP/HTTPS Redirect**: Railway might redirect HTTP → HTTPS, which breaks CORS preflight requests
3. **CORS Preflight Limitation**: Browsers cannot follow redirects during CORS preflight (OPTIONS) requests

## Fixes Applied

### 1. Added Trailing Slashes to API Endpoints ✅

**File**: `src/api/services/netWorthService.ts`

Changed:
- `/net-worth` → `/net-worth/`

This ensures the frontend calls match what the backend expects, avoiding redirects.

### 2. Improved CORS Configuration ✅

**File**: `backend/app/main.py`

- Added explicit HTTP methods
- Added `expose_headers` for better compatibility
- Added `max_age` to cache preflight requests (reduces redirect attempts)

### 3. Force HTTPS in API Client ✅

**File**: `src/api/client.ts`

- Automatically converts HTTP → HTTPS for Railway URLs
- Ensures we always use HTTPS, avoiding redirects

### 4. Updated API Config ✅

**File**: `src/api/config.ts`

- Ensured production URL always uses HTTPS
- Added comment about avoiding redirects

## Additional Steps (If Issue Persists)

### Option 1: Configure Railway to Serve HTTPS Directly

1. Go to Railway dashboard
2. Check your service settings
3. Ensure HTTPS is enabled and HTTP redirects are configured properly
4. Railway should serve HTTPS directly without redirects

### Option 2: Add Explicit CORS Origins

If you want to restrict CORS to specific origins:

**Backend** (`backend/app/config.py` or Railway environment variables):

```python
CORS_ORIGINS=["https://youcanfi.app", "http://localhost:8081", "http://localhost:19006"]
```

**Railway Environment Variables**:
```
CORS_ORIGINS=["https://youcanfi.app","http://localhost:8081"]
```

### Option 3: Use Railway's Custom Domain

Railway provides custom domains with proper HTTPS. Consider:
1. Setting up a custom domain in Railway
2. Using that domain instead of `*.up.railway.app`
3. This ensures proper HTTPS without redirects

## Testing

After applying fixes:

1. **Clear browser cache** (Ctrl+Shift+R or Cmd+Shift+R)
2. **Check browser console** for CORS errors
3. **Test API calls** - they should work without redirect errors
4. **Verify network tab** - requests should go directly to HTTPS endpoint

## Verification

To verify the fix is working:

1. Open browser DevTools → Network tab
2. Make an API request (e.g., load dashboard)
3. Check the request:
   - Should go to `https://you-can-fi-production.up.railway.app/api/v1/...`
   - Should NOT show a redirect (status 301/302)
   - Should return 200 OK with CORS headers

## Common Issues

### Issue: Still seeing redirect errors

**Solution**: 
- Check Railway dashboard - ensure HTTPS is properly configured
- Verify the API URL in `src/api/config.ts` uses HTTPS
- Clear browser cache and hard reload

### Issue: CORS errors from different origin

**Solution**:
- Add your origin to `CORS_ORIGINS` in backend config
- For development, `["*"]` allows all origins (current setting)

### Issue: Preflight requests failing

**Solution**:
- Ensure backend CORS middleware is configured correctly
- Check that `allow_methods` includes "OPTIONS"
- Verify `allow_headers` includes "Authorization" and "Content-Type"

## Notes

- CORS preflight requests (OPTIONS) **cannot** follow redirects - this is a browser security limitation
- Always use HTTPS in production to avoid redirect issues
- Trailing slashes matter - ensure frontend and backend match
- Railway's `*.up.railway.app` domains should serve HTTPS directly

