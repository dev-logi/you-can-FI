# Production Build Preparation for MyFinPal

## Pre-Build Checklist

Before creating your production build, verify:

### Configuration ✅
- [x] App name: "MyFinPal"
- [x] Version: "1.0.0"
- [x] Build number: "10"
- [x] Bundle identifier: "com.youcanfi.app"
- [x] Icon: Updated to new design (1024x1024px PNG)

### Environment Variables
- [ ] Production API URL configured
- [ ] Supabase credentials set for production
- [ ] All environment variables verified

### Testing
- [ ] App tested in TestFlight
- [ ] All features working correctly
- [ ] No known critical bugs
- [ ] Authentication flow tested
- [ ] Data persistence verified
- [ ] API connectivity confirmed

## Create Production Build

### Command

```bash
# Navigate to project root
cd /Users/logesh/projects/you-can-FI

# Create production iOS build
eas build --platform ios --profile production
```

### Build Process

1. **EAS will prompt you:**
   - If credentials need setup, it will guide you
   - If build configuration needs adjustment

2. **Build starts:**
   - Build runs in the cloud (15-30 minutes)
   - You'll see progress in terminal
   - You'll receive email notification when complete

3. **Monitor build:**
   ```bash
   # Check build status
   eas build:list
   
   # View specific build details
   eas build:view [BUILD_ID]
   ```

### After Build Completes

1. **Download build** (optional, for testing):
   ```bash
   eas build:download [BUILD_ID]
   ```

2. **Install on device:**
   - Transfer .ipa file to device
   - Install via TestFlight or direct install
   - Test all features thoroughly

3. **Verify:**
   - [ ] App launches correctly
   - [ ] Login/signup works
   - [ ] Onboarding completes
   - [ ] Data saves and loads
   - [ ] API calls succeed
   - [ ] No crashes or errors

4. **Build appears in App Store Connect:**
   - Automatically synced (may take 10-30 minutes)
   - Check App Store Connect > Your App > TestFlight > Builds

## Build Troubleshooting

### Build Fails

1. **Check build logs:**
   ```bash
   eas build:view [BUILD_ID]
   ```

2. **Common issues:**
   - Missing environment variables
   - Code signing issues
   - Dependency conflicts
   - Configuration errors

3. **Fix and rebuild:**
   - Address issues from logs
   - Create new build (build number auto-increments)

### Build Not Appearing in App Store Connect

1. **Wait 10-30 minutes** - Processing takes time
2. **Verify build profile** - Must be `production`
3. **Check Apple Developer account** - Must be linked
4. **Check App Store Connect** - Look in TestFlight section

## Next Steps After Build

Once build is ready:

1. ✅ Build appears in App Store Connect
2. ✅ Test on physical device
3. ✅ All features verified
4. → Proceed to App Store Connect setup
5. → Upload screenshots
6. → Complete listing information
7. → Submit for review

## Build Commands Reference

```bash
# Create production build
eas build --platform ios --profile production

# List all builds
eas build:list

# View specific build
eas build:view [BUILD_ID]

# Download build
eas build:download [BUILD_ID]

# Cancel a build
eas build:cancel [BUILD_ID]

# Check build status
eas build:status
```

## Important Notes

- **Build number increments automatically** with each new build
- **Version number** requires manual update in `app.json`
- **Builds are stored** in EAS and App Store Connect
- **You can have multiple builds** - select which one to submit
- **Builds expire** after 90 days in TestFlight (but not in App Store Connect for submission)

---

**Ready to build?** Run the command above and monitor the progress. The build will take 15-30 minutes.
