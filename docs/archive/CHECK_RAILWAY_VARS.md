# How to Check Railway Variables

## Quick Check

Since you've set the variables in Railway, let's verify they're correct:

### Step 1: Check Railway Dashboard

1. Go to: https://railway.app/
2. Select your **project** (e.g., "determined-reprieve")
3. Click on your **backend service** (e.g., "you-can-FI")
4. Click on the **Variables** tab
5. Look for these 4 variables:

```
PLAID_CLIENT_ID=...
PLAID_SECRET=...
PLAID_ENVIRONMENT=sandbox
PLAID_ENCRYPTION_KEY=...
```

### Step 2: Common Issues to Check

#### ✅ Variable Names (Must Be Exact)
- `PLAID_CLIENT_ID` (not `plaid_client_id` or `PLAID_CLIENT`)
- `PLAID_SECRET` (not `plaid_secret` or `PLAID_SECRET_KEY`)
- `PLAID_ENVIRONMENT` (not `plaid_environment` or `PLAID_ENV`)
- `PLAID_ENCRYPTION_KEY` (not `plaid_encryption_key`)

#### ✅ No Quotes Around Values
- ❌ `PLAID_CLIENT_ID="123456"`
- ✅ `PLAID_CLIENT_ID=123456`

#### ✅ Environment Should Be "sandbox"
- ❌ `PLAID_ENVIRONMENT=production`
- ❌ `PLAID_ENVIRONMENT=development`
- ✅ `PLAID_ENVIRONMENT=sandbox`

### Step 3: Test the Endpoint

To see the actual error, you need to test with authentication:

```bash
# Get a JWT token from your app (sign in, check console)
# Then run:
./backend/test_plaid_init.sh YOUR_JWT_TOKEN
```

Or test without auth to see if the endpoint exists:

```bash
curl -X POST https://you-can-fi-production.up.railway.app/api/v1/plaid/link-token \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected:**
- If variables are set: 403 (auth required) or 200 (with JWT)
- If variables missing: 500 with "not initialized" error

### Step 4: Check Deployment Status

1. Railway → Your Service → **Deployments**
2. Make sure the latest deployment shows **"Active"** (green)
3. If it's still deploying, wait for it to complete

### Step 5: Check Railway Logs

1. Railway → Your Service → **Deployments**
2. Click on **latest deployment**
3. Click **View Logs**
4. Look for:
   - ✅ "Plaid router loaded successfully"
   - ❌ "Plaid client not initialized"
   - ❌ Any errors about missing environment variables

## If Variables Are Set But Still Not Working

1. **Force Redeploy:**
   - Railway → Your Service → Settings → Redeploy

2. **Double-check variable names:**
   - Copy-paste the exact names from this document
   - Make sure there are no extra spaces

3. **Verify values:**
   - `PLAID_CLIENT_ID` should be a string (not empty)
   - `PLAID_SECRET` should be a long string (Sandbox secret)
   - `PLAID_ENVIRONMENT` should be exactly `sandbox`
   - `PLAID_ENCRYPTION_KEY` should be a base64 string

4. **Check service vs project:**
   - Variables should be in the **service** (not project) level
   - Make sure you're in the backend service, not frontend

## Still Having Issues?

Share:
1. Screenshot of Railway Variables tab
2. Output of `./backend/test_plaid_init.sh YOUR_JWT_TOKEN`
3. Latest Railway deployment logs



