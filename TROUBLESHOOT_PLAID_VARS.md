# Troubleshooting Plaid Variables in Railway

## If You've Set Variables But Still See Errors

### 1. Verify Variables Are Actually Set

Go to Railway Dashboard:
1. https://railway.app/
2. Select your **backend service**
3. Click **Variables** tab
4. Look for these exact variable names (case-sensitive):
   - ✅ `PLAID_CLIENT_ID`
   - ✅ `PLAID_SECRET`
   - ✅ `PLAID_ENVIRONMENT`
   - ✅ `PLAID_ENCRYPTION_KEY`

### 2. Check for Common Issues

#### Issue: Variable Names Are Wrong
- ❌ `plaid_client_id` (lowercase)
- ❌ `PLAID_CLIENT_ID_` (trailing underscore)
- ❌ `PLAID_CLIENT` (missing `_ID`)
- ✅ `PLAID_CLIENT_ID` (correct)

#### Issue: Values Have Quotes
- ❌ `PLAID_CLIENT_ID="your_id"` (with quotes)
- ✅ `PLAID_CLIENT_ID=your_id` (without quotes)

#### Issue: Environment Not Set to "sandbox"
- ❌ `PLAID_ENVIRONMENT=production`
- ❌ `PLAID_ENVIRONMENT=development`
- ✅ `PLAID_ENVIRONMENT=sandbox`

### 3. Wait for Redeployment

After adding/updating variables:
1. Railway automatically redeploys
2. This takes **2-3 minutes**
3. Check the **Deployments** tab to see if deployment is complete
4. Status should be "Active" (green)

### 4. Check Railway Logs

1. Go to Railway → Your Service → **Deployments**
2. Click on the **latest deployment**
3. Click **View Logs**
4. Look for errors like:
   - "Plaid client not initialized"
   - "PLAID_CLIENT_ID not set"
   - Any import errors

### 5. Test the Endpoint

Run this script to verify:

```bash
./backend/verify_railway_plaid_vars.sh
```

**Expected Results:**
- ✅ If variables are set: Should get 403 (auth required) or 200 (if you provide JWT)
- ❌ If variables missing: Will get 500 with "not initialized" error

### 6. Verify Variable Values

Make sure the values are correct:

1. **PLAID_CLIENT_ID**: Should be a string like `1234567890abcdef`
   - Get from: https://dashboard.plaid.com/team/keys

2. **PLAID_SECRET**: Should be a long string (Sandbox secret)
   - Get from: https://dashboard.plaid.com/team/keys
   - Make sure it's the **Sandbox** secret, not Production

3. **PLAID_ENVIRONMENT**: Should be exactly `sandbox` (lowercase, no quotes)

4. **PLAID_ENCRYPTION_KEY**: Should be a base64 string like `gAAAAABl...`
   - Generate with: `python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`

### 7. Force Redeploy

If variables are set but still not working:

1. Go to Railway → Your Service → **Settings**
2. Scroll down to **Redeploy**
3. Click **Redeploy** to force a fresh deployment

### 8. Check Service-Level vs Project-Level Variables

Make sure variables are set at the **service level**, not project level:

- ✅ **Service Variables** (correct): Railway → Service → Variables
- ❌ **Project Variables** (wrong): Railway → Project → Variables

## Quick Checklist

- [ ] Variables are in Railway (not Supabase)
- [ ] Variables are in the **backend service** (not frontend)
- [ ] Variable names are correct (case-sensitive)
- [ ] No quotes around values
- [ ] `PLAID_ENVIRONMENT=sandbox` (lowercase)
- [ ] Deployment completed after setting variables
- [ ] Checked Railway logs for errors
- [ ] Tested endpoint with verification script

## Still Not Working?

If you've checked everything above and it's still not working:

1. **Share Railway logs** from the latest deployment
2. **Share the output** of `./backend/verify_railway_plaid_vars.sh`
3. **Double-check** you're looking at the correct service in Railway



