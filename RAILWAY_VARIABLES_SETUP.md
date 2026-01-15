# Setting Environment Variables in Railway

## Important: Railway vs Supabase

- **Supabase**: Your database (PostgreSQL)
- **Railway**: Your backend service (FastAPI)

The Plaid environment variables need to be set in **Railway**, not Supabase.

## Step-by-Step: Set Variables in Railway

### 1. Go to Railway Dashboard

1. Visit: https://railway.app/
2. Sign in to your account
3. Select your project (e.g., "determined-reprieve" or "you-can-FI")

### 2. Select Your Backend Service

1. Click on the **backend service** (the one that runs FastAPI)
2. It should be named something like "you-can-FI" or "backend"

### 3. Open Variables Tab

1. Click on the **"Variables"** tab in the service view
2. This is different from the project-level variables

### 4. Add Plaid Variables

Click **"New Variable"** and add these 4 variables one by one:

```bash
PLAID_CLIENT_ID=your_plaid_client_id_here
PLAID_SECRET=your_plaid_sandbox_secret_here
PLAID_ENVIRONMENT=sandbox
PLAID_ENCRYPTION_KEY=your_generated_encryption_key_here
```

**Important Notes:**
- Replace the placeholder values with your actual values
- `PLAID_ENVIRONMENT` should be `sandbox` for testing
- No quotes needed around the values
- Railway will automatically redeploy after you save

### 5. Generate Encryption Key (if needed)

If you haven't generated the encryption key yet, run:

```bash
cd /Users/logesh/projects/you-can-FI/backend
source venv/bin/activate  # if you have a venv
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Copy the output and use it as `PLAID_ENCRYPTION_KEY`.

### 6. Verify Variables Are Set

After adding all 4 variables, you should see them listed in the Variables tab:
- ✅ PLAID_CLIENT_ID
- ✅ PLAID_SECRET
- ✅ PLAID_ENVIRONMENT
- ✅ PLAID_ENCRYPTION_KEY

### 7. Wait for Redeployment

Railway will automatically redeploy your service after you add/update variables. This takes ~2-3 minutes.

### 8. Test

After deployment completes, test the "Connect Bank Account" button again. The error should be gone!

## Troubleshooting

### Can't find the Variables tab?

1. Make sure you're in the **service view**, not the project view
2. The Variables tab should be next to "Settings", "Deployments", etc.

### Variables not showing up?

1. Refresh the Railway dashboard
2. Check that you're in the correct service (backend, not frontend)
3. Make sure you clicked "Save" after adding each variable

### Still getting errors after setting variables?

1. Check Railway logs:
   - Go to Deployments → Latest → View Logs
   - Look for errors about Plaid initialization

2. Verify variable names (case-sensitive):
   - `PLAID_CLIENT_ID` (not `plaid_client_id`)
   - `PLAID_SECRET` (not `plaid_secret`)
   - `PLAID_ENVIRONMENT` (not `plaid_environment`)
   - `PLAID_ENCRYPTION_KEY` (not `plaid_encryption_key`)

3. Check for typos in values (especially the encryption key)

## Quick Reference

**Where to set:**
- ✅ Railway → Backend Service → Variables tab
- ❌ NOT in Supabase

**What to set:**
1. `PLAID_CLIENT_ID` - From Plaid Dashboard
2. `PLAID_SECRET` - From Plaid Dashboard (Sandbox)
3. `PLAID_ENVIRONMENT` - Set to `sandbox`
4. `PLAID_ENCRYPTION_KEY` - Generated with Python script



