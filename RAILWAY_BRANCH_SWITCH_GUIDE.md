# Railway Branch Switch Guide

## Switch Backend to Deploy from Feature Branch

### Steps to Change Deployment Branch in Railway Dashboard:

1. **Go to Railway Dashboard**
   - Navigate to: https://railway.app/dashboard
   - Find your project: `determined-reprieve` (or `you-can-FI`)

2. **Select the Backend Service**
   - Click on the backend service (the one with root directory `/backend`)

3. **Open Settings**
   - Click on the **"Settings"** tab in the service view

4. **Change Source Branch**
   - Look for **"Source"** or **"GitHub"** section
   - Find **"Branch"** dropdown/field
   - Change from `main` to `feature/asset-liability-itemization`
   - Save the changes

5. **Trigger Deployment**
   - Railway should automatically trigger a new deployment
   - If not, you can manually trigger it from the "Deployments" tab

### Alternative: Using Railway CLI

If you prefer using CLI:

```bash
# Install Railway CLI (if not installed)
npm i -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Set the branch (this might require Railway CLI v3+)
railway variables set RAILWAY_GIT_BRANCH=feature/asset-liability-itemization
```

### Verify Deployment

After switching:
1. Check the "Deployments" tab in Railway
2. You should see a new deployment starting
3. Wait for it to complete (usually 2-3 minutes)
4. Check the logs to ensure the new code is deployed

### Current Configuration

- **Backend Service**: Should deploy from `feature/asset-liability-itemization`
- **Frontend Service**: Already configured for `feature/asset-liability-itemization` (as per previous setup)

### Notes

- The branch change will trigger an automatic deployment
- Make sure both services are pointing to the same branch for consistency
- After deployment, test the onboarding flow to verify the debug logging is working

