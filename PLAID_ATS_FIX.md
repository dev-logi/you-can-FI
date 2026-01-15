# Plaid Loading Issue - ATS Configuration Fix

## Issue
The Plaid Link modal shows "Loading Plaid Link..." indefinitely on both simulator and physical devices. The WebView cannot load the Plaid CDN script.

## Root Cause
**App Transport Security (ATS)** in iOS was blocking external HTTPS requests from the WebView, even though the URLs use HTTPS. iOS requires explicit permission in `Info.plist` (via `app.json` for Expo) to allow WebView to load content from external domains.

## Fix Applied
Added `NSAppTransportSecurity` exceptions to `app.json` for:

1. **cdn.plaid.com** - Plaid Link JavaScript library
2. **plaid.com** - Plaid API endpoints  
3. **you-can-fi-production.up.railway.app** - Backend API

### Configuration Added:
```json
"infoPlist": {
  "NSAppTransportSecurity": {
    "NSAllowsArbitraryLoads": false,
    "NSExceptionDomains": {
      "cdn.plaid.com": {
        "NSExceptionAllowsInsecureHTTPLoads": false,
        "NSIncludesSubdomains": true,
        "NSExceptionRequiresForwardSecrecy": true,
        "NSExceptionMinimumTLSVersion": "TLSv1.2"
      },
      "plaid.com": {
        "NSExceptionAllowsInsecureHTTPLoads": false,
        "NSIncludesSubdomains": true,
        "NSExceptionRequiresForwardSecrecy": true,
        "NSExceptionMinimumTLSVersion": "TLSv1.2"
      },
      "you-can-fi-production.up.railway.app": {
        "NSExceptionAllowsInsecureHTTPLoads": false,
        "NSIncludesSubdomains": true,
        "NSExceptionRequiresForwardSecrecy": true,
        "NSExceptionMinimumTLSVersion": "TLSv1.2"
      }
    }
  }
}
```

### Security Notes:
- **NSAllowsArbitraryLoads: false** - Still enforces HTTPS for all other domains
- **NSExceptionAllowsInsecureHTTPLoads: false** - Only HTTPS allowed (no HTTP)
- **TLSv1.2 minimum** - Secure TLS version required
- **Forward secrecy enabled** - Additional security measure

This is a **secure configuration** that only allows specific trusted domains.

## Testing After Fix

### ⚠️ REQUIRES REBUILD
This change modifies the app's `Info.plist`, so you **MUST rebuild** the app:

### For Development (Expo Go):
```bash
# This won't work with Expo Go - native changes need a custom build
```

### For Local Build (Current):
Your `eas build --platform ios --local` command is already running. Let it complete, then:

1. **Install the new build on your device**
2. **Test the Plaid flow:**
   - Open the app
   - Click "Connect Bank Account"
   - Modal should open
   - **Within 2-3 seconds**, Plaid interface should load
   - You should see the institution selection screen

### For Physical Device Testing:
```bash
# Option 1: Continue with current EAS build (recommended)
# Wait for the build to complete, then install via Xcode or TestFlight

# Option 2: Build directly in Xcode
npx expo run:ios --device
```

### Expected Behavior After Fix:

**Before:**
```
1. Click "Connect Bank Account"
2. Modal opens
3. Shows "Loading Plaid Link..."
4. Stays stuck forever
```

**After:**
```
1. Click "Connect Bank Account"
2. Modal opens
3. Shows "Loading Plaid Link..."
4. Console logs show:
   [Plaid WebView] Starting Plaid Link initialization...
   [Plaid WebView] Loading Plaid Link script from CDN...
   [Plaid WebView] Plaid Link script loaded successfully
   [Plaid WebView] Creating Plaid Link handler...
   [Plaid WebView] Opening Plaid Link...
5. Plaid interface appears (institution selection)
```

## Why This Was Needed

### iOS App Transport Security (ATS)
Introduced in iOS 9, ATS enforces secure network connections:

1. **Default Behavior:**
   - All network connections must use HTTPS
   - Specific domains must be explicitly allowed
   - WebViews have stricter rules than native network calls

2. **Why WebView Was Blocked:**
   - Even though `https://cdn.plaid.com` uses HTTPS
   - WebViews need explicit permission in `Info.plist`
   - Without exception, iOS silently blocks the request

3. **Why Native Calls Worked:**
   - Backend API calls (to Railway) worked because they use the native fetch API
   - WebView has additional restrictions for security

## Verification

After rebuilding and installing, check console logs:

### Success Indicators:
```
✅ [Plaid WebView] Plaid Link script loaded successfully
✅ [Plaid WebView] Creating Plaid Link handler...
✅ [Plaid WebView] Opening Plaid Link...
✅ Plaid interface visible
```

### Failure Indicators (if still not working):
```
❌ [Plaid WebView] Failed to load Plaid Link script
❌ Script timeout or network error
❌ Still stuck on "Loading..."
```

## If Still Not Working After Rebuild

### Check 1: Build Completed Successfully
Ensure EAS build finished and the new `Info.plist` was generated:
```bash
# In Xcode, check:
# YourApp -> Info -> App Transport Security Settings
# Should show exceptions for cdn.plaid.com, plaid.com, and Railway
```

### Check 2: Internet Connection
Test if device can reach Plaid CDN:
```bash
# On your Mac (same network as device):
curl -I https://cdn.plaid.com/link/v2/stable/link-initialize.js
# Should return 200 OK
```

### Check 3: Console Logs
Use Xcode console or React Native debugger to see exact error:
```bash
# In Xcode: Window → Devices and Simulators → Select Device → View Logs
# Filter for: Plaid or WebView
```

### Check 4: WebView Version
Ensure react-native-webview is up to date:
```bash
npm list react-native-webview
# Should be 11.x or higher
```

## Alternative Solutions

If ATS exceptions still don't work:

### Option 1: Use Native Plaid SDK
Replace WebView with native Plaid Link SDK:
```bash
npm install react-native-plaid-link-sdk
```
- More reliable
- Better performance
- Native iOS UI
- No ATS issues

### Option 2: Use Plaid's OAuth Flow
- Web-based flow instead of WebView
- Opens in Safari (no ATS restrictions)
- User returns to app via deep link

## Files Modified

- `app.json` - Added `infoPlist.NSAppTransportSecurity` configuration

## Commit Details

- **Branch:** `feature/plaid-integration`
- **Message:** "fix: Add App Transport Security exceptions for Plaid CDN"
- **Requires:** App rebuild to take effect

## Summary

iOS was blocking the Plaid CDN from loading in the WebView due to App Transport Security. Added explicit exceptions for:
- `cdn.plaid.com` (Plaid script)
- `plaid.com` (Plaid API)
- `you-can-fi-production.up.railway.app` (Backend API)

**Action Required:** Wait for the EAS build to complete, install the new build, and test the Plaid flow.
