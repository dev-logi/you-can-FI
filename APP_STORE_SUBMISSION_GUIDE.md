# Complete iOS App Store Submission Guide for MyFinPal

## Overview

This guide walks you through the complete process of submitting MyFinPal to the iOS App Store, from final configuration to post-submission monitoring.

## Prerequisites

- ✅ App Store Connect account set up
- ✅ Apple Developer account active
- ✅ EAS Build configured
- ✅ App tested in TestFlight
- ✅ All features working correctly

## Step 1: Final App Configuration

### Update app.json

The following has been completed:
- ✅ App name: "MyFinPal"
- ✅ Version: "1.0.0"
- ✅ Build number: "10" (incremented from 9)
- ✅ Bundle identifier: "com.youcanfi.app"
- ✅ Encryption: `usesNonExemptEncryption: false`

### Verify Configuration

```bash
# Check current configuration
cat app.json | grep -A 5 '"ios"'
```

Expected output should show:
- `"name": "MyFinPal"`
- `"buildNumber": "10"`

## Step 2: Privacy Policy

### Status
- ✅ Privacy policy template created in `PRIVACY_POLICY.md`
- ⚠️ **Action Required**: Customize the template with your specific details
- ⚠️ **Action Required**: Host at a publicly accessible URL

### Hosting Options

1. **GitHub Pages** (Free, Recommended)
   ```bash
   # Create a gh-pages branch
   git checkout -b gh-pages
   # Copy PRIVACY_POLICY.md to index.html (convert markdown to HTML)
   # Push to GitHub
   # Enable GitHub Pages in repository settings
   # URL will be: https://[username].github.io/[repo-name]/
   ```

2. **Personal Website**
   - Upload HTML version to your website
   - Ensure it's accessible via HTTPS

3. **Privacy Policy Generators**
   - Termly.io
   - PrivacyPolicies.com
   - Generate and host on their platform

### Required Content

Your privacy policy must include:
- What data you collect (email, financial information)
- How you use the data
- Where data is stored (Supabase)
- Third-party services (Supabase, Railway)
- User rights (access, deletion)
- Security measures
- Contact information

## Step 3: App Store Listing Content

### Status
- ✅ All content created in `APP_STORE_LISTING.md`

### Quick Reference

**Subtitle** (30 characters):
- "Track net worth & reach FI"

**Keywords** (100 characters):
- "finance, net worth, FIRE, financial independence, wealth, budget, money, assets, liabilities"

**Promotional Text** (170 characters):
- "Track your net worth and measure your progress toward financial independence. Simple, private, and designed for your journey to FI."

See `APP_STORE_LISTING.md` for full description and all content.

## Step 4: Screenshots

### Status
- ✅ Screenshot guide created in `SCREENSHOT_GUIDE.md`

### Required Sizes

1. **iPhone 6.7"** (iPhone 14 Pro Max, 15 Pro Max): 1290x2796px
2. **iPhone 6.5"** (iPhone 11 Pro Max, XS Max): 1242x2688px
3. **iPhone 5.5"** (iPhone 8 Plus): 1242x2208px
4. **iPad Pro 12.9"** (if supporting tablets): 2048x2732px

### Screenshot Content Order

1. Onboarding welcome screen
2. Net worth dashboard with sample data
3. Assets breakdown view
4. Liabilities view
5. Category breakdown/pie chart

### How to Capture

1. Run app on simulator or device
2. Navigate to each screen
3. Take screenshot (Cmd+S on simulator, or device screenshot)
4. Resize to required dimensions using image editor
5. Save as PNG files

## Step 5: App Icon

### Status
- ✅ Icon suggestions created in `ICON_SUGGESTIONS.md`

### Requirements

- **Size**: 1024x1024 pixels
- **Format**: PNG (no transparency)
- **No rounded corners**: Apple adds them automatically
- **No drop shadows**: Apple adds them automatically
- **Safe area**: Keep important elements within center 80%

### Current Icon
- Location: `./assets/icon.png`
- ⚠️ **Action Required**: Update with new icon design based on suggestions

## Step 6: Create Production Build

### Command

```bash
# Create production build for App Store
eas build --platform ios --profile production
```

### Build Process

1. EAS will prompt for any missing credentials
2. Build will be created in the cloud (15-30 minutes)
3. You'll receive a notification when complete
4. Build will appear in EAS dashboard and App Store Connect

### Monitor Build

```bash
# Check build status
eas build:list

# View specific build details
eas build:view [BUILD_ID]
```

### After Build Completes

1. Download the build (optional, for testing)
2. Install on physical device to test
3. Verify all features work correctly
4. Build will automatically appear in App Store Connect

## Step 7: App Store Connect Setup

### Access App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Sign in with your Apple Developer account
3. Navigate to "My Apps"
4. Select your app (or create new if first time)

### App Information

1. **App Name**: MyFinPal
2. **Subtitle**: "Track net worth & reach FI" (30 chars max)
3. **Category**: Finance
4. **Secondary Category**: Lifestyle (optional)
5. **Age Rating**: 4+ (Finance apps typically 4+)
6. **Pricing**: Free (or set your price)

### App Privacy

1. Click "App Privacy" section
2. Complete privacy questionnaire:
   - Data types: Email, Financial Information
   - Data usage: App Functionality
   - Data linked to user: Yes
   - Tracking: No
3. Add Privacy Policy URL (must be publicly accessible)

### Version Information

1. Click on version 1.0.0 (or create new version)
2. **What's New**: 
   ```
   Welcome to MyFinPal! Track your net worth, manage your assets and liabilities, and measure your progress toward financial independence. Simple, private, and designed for your journey to FI.
   ```

3. **Screenshots**: Upload for all required device sizes
4. **App Preview**: Upload video if created (optional)
5. **Description**: Copy from `APP_STORE_LISTING.md`
6. **Keywords**: "finance, net worth, FIRE, financial independence, wealth, budget, money, assets, liabilities"
7. **Promotional Text**: Copy from `APP_STORE_LISTING.md`
8. **Support URL**: Required (GitHub README or support page)
9. **Marketing URL**: Optional (your website)

### Build Selection

1. Go to "Build" section
2. Click "+" to add build
3. Select your production build from EAS
4. Wait for processing (10-30 minutes)
5. Build status will show "Ready to Submit" when complete

## Step 8: Final Review Checklist

Before submitting, verify:

- [ ] App name matches in app.json and App Store Connect
- [ ] Build number is 10 (or appropriate for submission)
- [ ] All screenshots uploaded for required device sizes
- [ ] Privacy policy URL is accessible
- [ ] Description, keywords, and promotional text added
- [ ] Support URL is accessible
- [ ] Build is selected and processed
- [ ] No placeholder content
- [ ] All features functional
- [ ] Test account credentials ready (if app requires login)

## Step 9: Submit for Review

### Export Compliance

1. Answer export compliance questions:
   - Uses encryption: Yes (standard HTTPS)
   - Uses non-exempt encryption: No
   - This matches your `usesNonExemptEncryption: false` setting

### Review Notes (Optional)

If your app requires special instructions for reviewers:

```
Test Account:
Email: [test-email]
Password: [test-password]

Note: This app requires email verification. Please check the test email inbox for the verification link.
```

### Submit

1. Click "Submit for Review" button
2. Confirm submission
3. Status will change to "Waiting for Review"
4. You'll receive email confirmation

## Step 10: Monitor Review Process

### Review Timeline

- **Typical**: 24-48 hours
- **Can take**: Up to 7 days
- **Status updates**: Via email and App Store Connect

### Status Stages

1. **Waiting for Review**: Your app is in queue
2. **In Review**: Apple is reviewing your app
3. **Pending Developer Release**: Approved, waiting for you to release
4. **Ready for Sale**: App is live in App Store
5. **Rejected**: Issues found, needs fixes

### If Rejected

1. Read rejection reason carefully
2. Address all issues mentioned
3. Fix bugs or compliance issues
4. Create new build if needed (increment build number)
5. Resubmit with explanation of fixes
6. Can request expedited review if urgent (with valid reason)

### If Approved

1. App goes live automatically (or on scheduled date)
2. Monitor initial user feedback
3. Track crash reports (if using crash reporting)
4. Respond to user reviews
5. Plan first update (version 1.0.1)

## Step 11: Post-Launch

### Immediate Actions

1. **Monitor Reviews**: Check App Store Connect for user reviews
2. **Track Metrics**: Monitor downloads, ratings, and reviews
3. **Respond to Users**: Answer questions and address concerns
4. **Monitor Crashes**: Check for any crash reports

### First Update Planning

- Plan version 1.0.1 for bug fixes
- Increment build number for each update
- Consider user feedback for improvements

## Quick Command Reference

```bash
# Create production build
eas build --platform ios --profile production

# List all builds
eas build:list

# View specific build
eas build:view [BUILD_ID]

# Check build status
eas build:status

# Cancel a build (if needed)
eas build:cancel [BUILD_ID]
```

## Important URLs

- **App Store Connect**: https://appstoreconnect.apple.com
- **EAS Dashboard**: https://expo.dev/accounts/logi-dev/projects/you-can-fi/builds
- **Apple Developer**: https://developer.apple.com
- **App Store Review Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **App Store Review Status**: Check in App Store Connect

## Timeline Estimate

- **Build creation**: 15-30 minutes
- **Build processing**: 10-30 minutes
- **Review time**: 24-48 hours (typical), up to 7 days
- **Total**: 1-3 days from submission to approval (typical)

## Troubleshooting

### Build Fails

1. Check build logs: `eas build:view [BUILD_ID]`
2. Verify `app.json` configuration
3. Check for missing dependencies
4. Review EAS build logs for errors

### Build Not Appearing in App Store Connect

1. Wait 10-30 minutes for processing
2. Check that build was created with `--profile production`
3. Verify Apple Developer account is linked
4. Check App Store Connect for any errors

### Review Rejection

1. Read rejection reason carefully
2. Check App Store Review Guidelines
3. Fix all mentioned issues
4. Create new build with fixes
5. Resubmit with explanation

## Notes

- You can update promotional text, screenshots, and description without a new submission
- Version number and build number require a new build and submission
- Keep test account credentials ready in case reviewers need them
- Monitor App Store Connect regularly during review process
- Respond promptly to any reviewer questions

## Support Resources

- **Expo Documentation**: https://docs.expo.dev
- **EAS Build Docs**: https://docs.expo.dev/build/introduction/
- **Apple App Store Review**: https://developer.apple.com/app-store/review/
- **App Store Connect Help**: Available in App Store Connect dashboard

---

**Good luck with your submission!** 🚀
