# Plaid WebView Loading Fix

## Issue
The Plaid Link modal was stuck on "Loading Plaid Link..." screen, both in simulator and on physical devices. The Plaid CDN script wasn't loading.

## Root Cause
The WebView component had several configuration issues:

1. **Missing `originWhitelist`** - The WebView couldn't make HTTPS requests to external CDNs
2. **Missing Content Security Policy** - External scripts were being blocked
3. **Poor JavaScript injection timing** - Using `injectJavaScript()` with setTimeout wasn't reliable
4. **Missing iOS-specific props** - Needed for proper media and content handling

## Fixes Applied

### 1. Added Critical WebView Props
```tsx
originWhitelist={['*']}                      // Allow all origins including HTTPS CDNs
allowsInlineMediaPlayback={true}             // iOS: Allow inline media
mediaPlaybackRequiresUserAction={false}      // iOS: Auto-play without user action
scalesPageToFit={false}                      // Proper scaling
mixedContentMode="always"                    // Android: Allow HTTPS in HTTP context
allowFileAccess={true}                       // Allow file access
allowUniversalAccessFromFileURLs={true}      // Allow universal access
```

### 2. Added Content Security Policy
Added a meta tag in the HTML head to allow all external resources:
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src * 'unsafe-inline' 'unsafe-eval'; 
               script-src * 'unsafe-inline' 'unsafe-eval'; 
               connect-src *; 
               img-src * data: blob: 'unsafe-inline'; 
               frame-src *; 
               style-src * 'unsafe-inline';">
```

### 3. Moved Script to Inline HTML
**Before:** Used `webViewRef.current?.injectJavaScript()` with setTimeout  
**After:** Put the Plaid loading script directly in the HTML `<script>` tag

This is more reliable because:
- Script runs immediately when the page loads
- No timing issues with React Native bridge
- Better error handling
- Cleaner code

### 4. Enhanced Error Handling
Added comprehensive logging and error display:
```javascript
- Console logs at each step of initialization
- User-friendly error messages displayed in the UI
- Detailed error reporting via postMessage
- Better debugging capabilities
```

## Testing

### Before Fix
- Modal opens
- Shows "Loading Plaid Link..."
- Stays stuck indefinitely
- No errors in console
- No Plaid interface

### After Fix (Expected)
- Modal opens
- Shows "Loading Plaid Link..."
- Plaid CDN script loads
- Plaid interface appears
- Can select bank and connect account

## How to Test

### 1. Restart the Development Server
The fix is **frontend-only**, so you need to reload the app:

```bash
# If using Expo
# Press 'r' in the Metro bundler terminal to reload
# Or shake the device and tap "Reload"

# If using iOS Simulator
# Cmd+R to reload
```

### 2. Test the Flow
1. Open the app
2. Click "Connect Bank Account"
3. Modal should open
4. Watch console logs (should see "[Plaid WebView]" messages)
5. Plaid interface should load within 2-3 seconds
6. Select institution: `first_plaid`
7. Username: `user_good`, Password: `pass_good`

### 3. Check Console Logs
You should see logs like:
```
[Plaid WebView] Starting Plaid Link initialization...
[Plaid WebView] Loading Plaid Link script from CDN...
[Plaid WebView] Plaid Link script loaded successfully
[Plaid WebView] Creating Plaid Link handler...
[Plaid WebView] Opening Plaid Link...
[Plaid WebView] Plaid Link loaded
```

## If Still Not Working

If the Plaid interface still doesn't load:

### Check 1: Network Connectivity
Ensure the device/simulator has internet access and can reach:
- `https://cdn.plaid.com`

Test in Safari/Chrome on the same device:
```
https://cdn.plaid.com/link/v2/stable/link-initialize.js
```

### Check 2: Console Logs
Look for specific error messages:
- "Failed to load Plaid Link script" → Network/CDN issue
- "Plaid.create not available" → Script loaded but Plaid object missing
- "Failed to create Plaid Link" → Configuration error

### Check 3: React Native WebView Version
Ensure `react-native-webview` is up to date:
```bash
npm list react-native-webview
# Should be 11.x or higher
```

If outdated:
```bash
npm install react-native-webview@latest
# Then rebuild the app
```

### Check 4: Platform-Specific Issues

**iOS:**
- Check if WebView has internet permission
- Verify App Transport Security allows HTTPS CDN

**Android:**
- Check INTERNET permission in AndroidManifest.xml
- Verify cleartext traffic is allowed (though we're using HTTPS)

## Alternative Solution

If WebView continues to have issues, consider using the native Plaid SDK:

```bash
npm install react-native-plaid-link-sdk
```

This provides:
- Better performance
- More reliable loading
- Native UI integration
- Better error handling

See: https://github.com/plaid/react-native-plaid-link-sdk

## Files Modified

- `src/features/plaid/components/PlaidLinkModal.tsx` - WebView configuration and script loading

## Commit Details

- **Commit:** `3a9eec1`
- **Branch:** `feature/plaid-integration`
- **Message:** "fix: Improve Plaid WebView configuration for script loading"

## Summary

The WebView wasn't configured to load external HTTPS scripts. Fixed by:
1. Adding proper WebView props (`originWhitelist`, iOS props, etc.)
2. Adding Content Security Policy to HTML
3. Moving script loading from injected JS to inline HTML
4. Enhanced error handling and logging

**Action Required:** Reload the app (`Cmd+R` or shake device) to see the fix.
