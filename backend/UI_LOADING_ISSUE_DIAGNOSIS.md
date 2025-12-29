# UI Not Loading Values - Diagnosis & Fix

## ✅ What's Working

1. **Backend Health Check**: ✅ Passing
2. **Authentication Enforcement**: ✅ Working (403 for unauthorized requests)
3. **Token Setting**: ✅ Token is set in API client when session changes (see `app/_layout.tsx` lines 67-70, 127-133)

## 🔍 Potential Issues

### 1. Token Not Being Sent
**Check**: Is the token actually being sent in API requests?

**How to verify**:
- Open browser DevTools → Network tab
- Look for API requests to `/api/v1/assets/` or `/api/v1/liabilities/`
- Check the Request Headers for `Authorization: Bearer <token>`

**If missing**: The token might not be set correctly or might be expired.

### 2. Token Expired
**Check**: Is the token expired?

**How to verify**:
- Check the token's expiration in browser DevTools → Application → Local Storage
- Or decode the JWT token at https://jwt.io
- Look for the `exp` field

**Fix**: User needs to log out and log back in to get a fresh token.

### 3. User ID Mismatch
**Check**: Does the token's `sub` claim match the `user_id` in the database?

**How to verify**:
1. Decode the JWT token (https://jwt.io)
2. Get the `sub` value (this is the user_id)
3. Check database: `SELECT * FROM assets WHERE user_id = 'sub_value_here';`

**If no records**: The user might not have any assets/liabilities, or they're associated with a different user_id.

### 4. API Returning Empty Arrays
**Check**: What does the API actually return?

**How to test**:
```bash
# Get token from browser DevTools
TOKEN="your_token_here"

# Test assets endpoint
curl -H "Authorization: Bearer $TOKEN" \
  https://you-can-fi-production.up.railway.app/api/v1/assets/

# Test liabilities endpoint
curl -H "Authorization: Bearer $TOKEN" \
  https://you-can-fi-production.up.railway.app/api/v1/liabilities/

# Test net worth endpoint
curl -H "Authorization: Bearer $TOKEN" \
  https://you-can-fi-production.up.railway.app/api/v1/net-worth/
```

**If empty arrays `[]`**: The user has no data, or data is associated with a different user_id.

**If errors**: Check the error message for clues.

### 5. Frontend Error Handling
**Check**: Are API errors being caught and displayed?

**How to verify**:
- Open browser console (F12)
- Look for error messages from `[NetWorthStore]` or `[API Client]`
- Check if errors are being logged but not shown to the user

**Fix**: Check `src/features/netWorth/store.ts` - errors might be caught but not displayed.

### 6. CORS Issues
**Check**: Are requests being blocked by CORS?

**How to verify**:
- Open browser console
- Look for CORS errors like "Access to fetch at ... has been blocked by CORS policy"

**Fix**: Verify backend CORS settings in `backend/app/main.py`

## 🔧 Recommended Fixes

### Immediate Actions

1. **Test with a real token**:
   ```bash
   # Get token from browser DevTools → Application → Local Storage
   # Look for supabase.auth.token or similar
   # Extract the access_token value
   
   # Then test:
   ./backend/test_all_apis_curl.sh YOUR_TOKEN
   ```

2. **Check browser console**:
   - Open DevTools → Console
   - Look for API errors
   - Check Network tab for failed requests

3. **Verify database**:
   ```sql
   -- Check if user has assets
   SELECT * FROM assets WHERE user_id = 'user_id_from_token';
   
   -- Check if user has liabilities
   SELECT * FROM liabilities WHERE user_id = 'user_id_from_token';
   ```

4. **Check API responses**:
   - Open DevTools → Network tab
   - Find requests to `/api/v1/assets/` or `/api/v1/liabilities/`
   - Check the Response tab to see what the API returns

### Code Fixes (if needed)

1. **Add better error logging** in `src/features/netWorth/store.ts`:
   ```typescript
   refresh: async () => {
     set({ isLoading: true, error: null });
     
     try {
       const [summary, assets, liabilities, assetBreakdown, liabilityBreakdown] =
         await Promise.all([
           NetWorthApiService.calculate(),
           NetWorthApiService.getAssets(),
           NetWorthApiService.getLiabilities(),
           NetWorthApiService.getAssetBreakdown(),
           NetWorthApiService.getLiabilityBreakdown(),
         ]);
       
       console.log('[NetWorthStore] Refresh success:', {
         assetsCount: assets.length,
         liabilitiesCount: liabilities.length,
         summary
       });
       
       set({
         isLoading: false,
         isInitialized: true,
         summary,
         assets,
         liabilities,
         assetBreakdown,
         liabilityBreakdown,
       });
     } catch (error) {
       console.error('[NetWorthStore] Refresh error:', error);
       // Log more details
       if (error instanceof Error) {
         console.error('[NetWorthStore] Error details:', {
           message: error.message,
           stack: error.stack
         });
       }
       set({
         isLoading: false,
         error: 'Failed to load net worth data',
       });
     }
   },
   ```

2. **Add token validation** in `app/_layout.tsx`:
   ```typescript
   // Update API client token when session changes
   useEffect(() => {
     if (session?.access_token) {
       console.log('[RootLayout] Setting auth token:', session.access_token.substring(0, 20) + '...');
       ApiClient.setAuthToken(session.access_token);
     } else {
       console.log('[RootLayout] Clearing auth token');
       ApiClient.clearAuthToken();
     }
   }, [session]);
   ```

## 📋 Testing Checklist

- [ ] Health check endpoint works
- [ ] Root endpoint works
- [ ] Unauthorized requests are rejected (403)
- [ ] JWT token is obtained from login
- [ ] Token is set in API client (check console logs)
- [ ] Token is sent in API requests (check Network tab)
- [ ] API returns data (not empty arrays or errors)
- [ ] Frontend receives and displays data
- [ ] Database has records for the user
- [ ] User ID in token matches user_id in database

## 🎯 Next Steps

1. **Get a JWT token** from a logged-in user
2. **Test authenticated endpoints** using the test script
3. **Check browser console** for errors
4. **Check Network tab** for API responses
5. **Verify database** has data for the user
6. **Check token expiration** - user might need to log in again

## 📞 Debugging Commands

```bash
# Test health check
curl https://you-can-fi-production.up.railway.app/health

# Test with token (replace YOUR_TOKEN)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://you-can-fi-production.up.railway.app/api/v1/assets/

# Run full test suite (requires token)
./backend/test_all_apis_curl.sh YOUR_TOKEN
```

