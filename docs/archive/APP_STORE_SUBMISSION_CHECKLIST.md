# iOS App Store Submission Checklist for MyFinPal

## Pre-Submission Checklist

### App Configuration ✅
- [x] App name updated to "MyFinPal" in `app.json`
- [ ] Version number set to "1.0.0" (or appropriate for release)
- [ ] Build number incremented (currently 9, should be 10 for new submission)
- [ ] Bundle identifier verified: `com.youcanfi.app`
- [ ] Encryption compliance: `usesNonExemptEncryption: false` (correct for standard HTTPS)
- [ ] App icon updated (1024x1024px, PNG, no transparency)
- [ ] Splash screen configured
- [ ] Deep linking scheme verified: `youcanfi://`

### Privacy & Legal
- [ ] Privacy Policy created and hosted at publicly accessible URL
- [ ] Privacy Policy URL added to App Store Connect
- [ ] App Privacy questionnaire completed in App Store Connect
- [ ] Data collection practices declared (Email, Financial Information)
- [ ] Third-party services disclosed (Supabase, Railway)

### App Store Connect Setup
- [ ] App created in App Store Connect (or existing app updated)
- [ ] App name matches `app.json`: "MyFinPal"
- [ ] Subtitle added (30 characters max)
- [ ] Category selected: Finance
- [ ] Secondary category (optional): Lifestyle
- [ ] Age rating: 4+
- [ ] Pricing: Free (or set price)
- [ ] Availability: All countries (or select regions)

### App Store Listing
- [ ] Description written (up to 4000 characters)
- [ ] Keywords added (100 characters max)
- [ ] Promotional text added (170 characters, can update later)
- [ ] Support URL provided (required)
- [ ] Marketing URL added (optional)
- [ ] What's New text written for version 1.0.0

### Screenshots (Required)
- [ ] iPhone 6.7" screenshots (1290x2796px) - At least 3-5 screenshots
- [ ] iPhone 6.5" screenshots (1242x2688px) - At least 3-5 screenshots
- [ ] iPhone 5.5" screenshots (1242x2208px) - At least 3-5 screenshots
- [ ] iPad Pro 12.9" screenshots (2048x2732px) - If supporting tablets

**Screenshot Content:**
1. Onboarding welcome screen
2. Net worth dashboard with sample data
3. Assets breakdown view
4. Liabilities view
5. Category breakdown/pie chart

### App Preview Video (Optional but Recommended)
- [ ] 15-30 second video created
- [ ] Video showcases key features
- [ ] Video uploaded to App Store Connect

### Build & Testing
- [ ] Production build created: `eas build --platform ios --profile production`
- [ ] Build downloaded and tested on physical device
- [ ] All critical user flows tested:
  - [ ] Sign up / Login
  - [ ] Onboarding completion
  - [ ] Adding assets
  - [ ] Adding liabilities
  - [ ] Viewing net worth
  - [ ] Data persistence
- [ ] API connectivity verified (production backend)
- [ ] No critical bugs found
- [ ] App performs well (no crashes, reasonable load times)

### App Store Connect - Version Information
- [ ] Build selected from EAS builds
- [ ] Build processing completed (10-30 minutes)
- [ ] All screenshots uploaded
- [ ] App Preview video uploaded (if created)
- [ ] Description, keywords, and promotional text added
- [ ] Support URL verified and accessible
- [ ] Privacy Policy URL verified and accessible

### Final Review
- [ ] All required fields completed
- [ ] No placeholder content
- [ ] All features functional
- [ ] App complies with App Store Review Guidelines
- [ ] Test account credentials provided (if app requires login)
- [ ] Review notes added (if needed for special instructions)

### Submission
- [ ] Export compliance questions answered
- [ ] Review notes added (if needed)
- [ ] "Submit for Review" clicked
- [ ] Submission confirmation received

## Post-Submission

### Monitoring
- [ ] Check App Store Connect daily for status updates
- [ ] Monitor email for reviewer questions
- [ ] Respond promptly to any reviewer inquiries
- [ ] Prepare for potential rejection and fixes

### If Rejected
- [ ] Read rejection reason carefully
- [ ] Address all issues mentioned
- [ ] Fix bugs or compliance issues
- [ ] Create new build if needed
- [ ] Resubmit with explanation of fixes
- [ ] Request expedited review if urgent (with valid reason)

### If Approved
- [ ] App goes live automatically (or on scheduled date)
- [ ] Monitor initial user feedback
- [ ] Track crash reports (if using crash reporting)
- [ ] Respond to user reviews
- [ ] Plan first update (version 1.0.1)

## Quick Command Reference

```bash
# Create production build
eas build --platform ios --profile production

# Check build status
eas build:list

# View specific build
eas build:view [BUILD_ID]

# Submit to App Store (after build is in App Store Connect)
# Done through App Store Connect web interface
```

## Important URLs

- **App Store Connect**: https://appstoreconnect.apple.com
- **EAS Dashboard**: https://expo.dev/accounts/logi-dev/projects/you-can-fi/builds
- **Apple Developer**: https://developer.apple.com
- **App Store Review Guidelines**: https://developer.apple.com/app-store/review/guidelines/

## Timeline Estimate

- **Build creation**: 15-30 minutes
- **Build processing in App Store Connect**: 10-30 minutes
- **Review time**: 24-48 hours (can take up to 7 days)
- **Total**: 1-3 days from submission to approval (typical)

## Notes

- You can update promotional text, screenshots, and description without a new submission
- Version number and build number require a new build and submission
- Keep test account credentials ready in case reviewers need them
- Monitor App Store Connect regularly during review process
