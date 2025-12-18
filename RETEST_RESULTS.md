# Retest Results - Task Generation Bug Fix

**Date:** December 18, 2024  
**Test Method:** Browser testing via Expo web  
**Fix Applied:** Added state refresh on tasks screen focus

## Test Results

### Issue Found: CORS Error Blocking API Calls

**Problem:** The app cannot make API calls in the browser due to CORS policy errors:
```
Access to fetch at 'http://you-can-fi-production.up.railway.app/api/v1/onboarding/' 
(redirected from 'https://you-can-fi-production.up.railway.app/api/v1/onboarding') 
from origin 'http://localhost:8081' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
Redirect is not allowed for a preflight request.
```

**Impact:** 
- All API calls are failing in the browser
- Answers to questions are not being saved
- Tasks are not being generated because the backend never receives the answers
- The state refresh fix cannot be tested because API calls fail

**Root Cause:** 
- The Railway backend is redirecting HTTPS requests to HTTP
- CORS preflight requests cannot follow redirects
- This prevents the browser from making any API calls

## Fix Status

### Task Generation Bug Fix
✅ **Code Fix Applied:** Added `useFocusEffect` hook to refresh state when tasks screen comes into focus
- Location: `app/(onboarding)/tasks.tsx`
- The fix is correctly implemented and should work once CORS is resolved

### CORS Issue (Blocking Testing)
❌ **CORS Configuration Issue:** Backend needs to:
1. Fix HTTPS to HTTP redirect (or ensure HTTPS is used consistently)
2. Add proper CORS headers to allow requests from `http://localhost:8081`
3. Ensure preflight OPTIONS requests are handled correctly

## Recommendations

### Immediate Actions:
1. **Fix CORS Configuration** - This is blocking all browser testing
   - Update backend CORS settings to allow `http://localhost:8081`
   - Fix HTTPS/HTTP redirect issue
   - Ensure OPTIONS preflight requests are handled

2. **Test Task Generation Fix** - Once CORS is fixed:
   - Answer "Yes" to cash accounts question
   - Select 401(k) in retirement question
   - Navigate to tasks screen
   - Verify both tasks appear in the list

### Alternative Testing:
- Test in iOS Simulator (where CORS doesn't apply)
- Use a local backend instead of Railway for browser testing
- Test with production build instead of development server

## Code Changes Made

### File: `app/(onboarding)/tasks.tsx`
- Added `useFocusEffect` hook to refresh state when screen comes into focus
- Added proper error handling for state refresh
- Ensures latest tasks are fetched from backend when screen loads

The fix is correctly implemented and should resolve the task generation display issue once API calls are working.


