# Plaid Integration - Native SDK Migration

## What Changed

Replaced the WebView-based Plaid Link implementation with the **official `react-native-plaid-link-sdk`**.

### Why This Was Necessary

The WebView approach had multiple issues:
1. ❌ iOS App Transport Security blocked CDN loading
2. ❌ Script loading was unreliable
3. ❌ JavaScript execution issues in WebView
4. ❌ Not officially supported by Plaid

### Benefits of Native SDK

1. ✅ **Native Performance** - Uses iOS/Android native UI
2. ✅ **Reliable** - Official Plaid SDK with proper support
3. ✅ **No WebView Issues** - No ATS, CSP, or script loading problems
4. ✅ **Better Security** - Native token handling
5. ✅ **Future-proof** - Maintained by Plaid

## Files Changed

### Added Dependency
```json
// package.json
"react-native-plaid-link-sdk": "^11.x.x"
```

### Rewrote PlaidLinkButton.tsx
- Uses `create()` and `open()` from native SDK
- Handles success/exit/error callbacks
- Exchanges token internally
- Shows loading state and error messages

### Deprecated PlaidLinkModal.tsx
- No longer used
- Kept as empty placeholder for backwards compatibility

### Updated Dashboard (index.tsx)
- Removed duplicate token exchange
- Uses accounts from metadata directly

## How It Works Now

```
User clicks "Connect Bank Account"
    ↓
PlaidLinkButton creates link token (backend API)
    ↓
PlaidLinkButton calls create() with token
    ↓
PlaidLinkButton calls open() with callbacks
    ↓
Native Plaid SDK opens (iOS native UI)
    ↓
User connects bank account
    ↓
onSuccess callback receives publicToken
    ↓
PlaidLinkButton exchanges token (backend API)
    ↓
Dashboard receives accounts in metadata
    ↓
AccountLinkingModal shows to link account
```

## ⚠️ REQUIRES REBUILD

This change adds a **native module**, so you **MUST rebuild** the app:

### Option 1: Local Build (EAS)
```bash
eas build --platform ios --local
# or for development
npx expo run:ios
```

### Option 2: EAS Cloud Build
```bash
eas build --platform ios
```

### Option 3: Xcode Direct
```bash
cd ios && pod install && cd ..
# Then open .xcworkspace in Xcode and build
```

## Testing After Rebuild

1. **Install the new build** on your device
2. **Open app** → Click "Connect Bank Account"
3. **Native Plaid UI should appear** (not a WebView)
4. **Connect using sandbox credentials:**
   - Institution: `first_plaid`
   - Username: `user_good`
   - Password: `pass_good`
5. **Verify account linking works**

## Expected Console Logs

```
[PlaidLinkButton] Creating link token...
[PlaidLinkButton] Link token created: link-sandbox-xxx...
[PlaidLinkButton] Creating Plaid Link...
[PlaidLinkButton] Opening Plaid Link...
[PlaidLinkButton] Plaid Event: OPEN { ... }
[PlaidLinkButton] Plaid Event: SELECT_INSTITUTION { ... }
[PlaidLinkButton] Link Success: { publicToken: ... }
[PlaidLinkButton] Exchanging public token...
[PlaidLinkButton] Exchange successful, accounts: [...]
[Dashboard] Plaid Link Success: public-sandbox-xxx { accounts: [...] }
```

## Troubleshooting

### "No native module found" Error
You need to rebuild the app. The native SDK requires compilation.

### "Link token not found" Error
Backend issue - check Railway logs for Plaid API errors.

### "INVALID_CONFIGURATION" Error
Backend Plaid configuration issue - already fixed in earlier commit.

### "User cancelled" Exit
User closed the modal without connecting - this is normal behavior.

## Commit Details

- **Commit:** `74f96d5`
- **Branch:** `feature/plaid-integration`
- **Message:** "feat: Replace WebView with official react-native-plaid-link-sdk"

## Summary

The Plaid integration now uses the official native SDK which should work reliably on physical devices. The WebView approach was inherently problematic due to iOS security restrictions.

**Action Required:** Rebuild the app and test on physical device.
