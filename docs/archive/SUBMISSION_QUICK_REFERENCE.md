# App Store Submission Quick Reference

## Current Status

✅ **Completed:**
- App name: MyFinPal
- Build number: 10
- Icon: Updated
- Documentation: Complete

⚠️ **Remaining:**
- Privacy policy hosting
- Screenshots capture
- Production build
- App Store Connect setup

## Quick Commands

```bash
# Create production build
eas build --platform ios --profile production

# Check build status
eas build:list

# View build details
eas build:view [BUILD_ID]
```

## Required Information

### App Store Connect
- **App Name:** MyFinPal
- **Subtitle:** Track net worth & reach FI
- **Category:** Finance
- **Age Rating:** 4+
- **Price:** Free

### Contact Information Needed
- [ ] Privacy Policy URL (host and get URL)
- [ ] Support Email
- [ ] Support URL (GitHub README or support page)

## Screenshot Requirements

**Required sizes:**
- iPhone 6.7": 1290x2796px (3-5 screenshots)
- iPhone 6.5": 1242x2688px (3-5 screenshots)
- iPhone 5.5": 1242x2208px (3-5 screenshots)
- iPad Pro 12.9": 2048x2732px (optional, 3-5 screenshots)

**Content order:**
1. Onboarding welcome
2. Net worth dashboard
3. Assets view
4. Category breakdown
5. Liabilities view

## Submission Checklist

### Before Build
- [x] App configuration complete
- [x] Icon updated
- [ ] Privacy policy hosted
- [ ] Screenshots ready

### Build
- [ ] Create production build
- [ ] Test on device
- [ ] Verify all features

### App Store Connect
- [ ] Complete app information
- [ ] Upload screenshots
- [ ] Add description/keywords
- [ ] Add privacy policy URL
- [ ] Select build
- [ ] Submit for review

## Important URLs

- **App Store Connect:** https://appstoreconnect.apple.com
- **EAS Dashboard:** https://expo.dev/accounts/logi-dev/projects/you-can-fi/builds
- **Apple Developer:** https://developer.apple.com

## Timeline

- **Build:** 15-30 minutes
- **Processing:** 10-30 minutes
- **Review:** 24-48 hours (typical)

## File Locations

- **Privacy Policy HTML:** `PRIVACY_POLICY.html` (ready to host)
- **Screenshot Guide:** `SCREENSHOT_CAPTURE_GUIDE.md`
- **Build Guide:** `BUILD_PREPARATION.md`
- **Full Submission Guide:** `APP_STORE_SUBMISSION_GUIDE.md`
- **Store Listing Content:** `APP_STORE_LISTING.md`

---

**Next Step:** Host privacy policy, then create production build.
