# Plaid Environment Variables Setup

## Current Status

✅ **Backend Deployment**: Complete  
✅ **Database Migration**: Complete  
❌ **Environment Variables**: **NOT SET** (This is why you're seeing the error)

## The Error You're Seeing

```
ERROR [PlaidLinkButton] Error: {
  "detail": "Failed to create link token: Plaid client not initialized. 
             Check PLAID_CLIENT_ID and PLAID_SECRET environment variables.",
  "status": 500
}
```

**This is expected!** The Plaid router is working, but it needs the credentials to initialize the Plaid client.

## Solution: Set Environment Variables in Railway

### Step 1: Get Your Plaid Credentials

1. Go to https://dashboard.plaid.com/
2. Sign in or create an account
3. Go to **Team Settings** → **Keys**
4. Copy your **Client ID** and **Sandbox Secret** (for testing)

### Step 2: Generate Encryption Key

Run this command to generate a secure encryption key:

```bash
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Copy the output (it will look like: `gAAAAABl...`)

### Step 3: Set Variables in Railway

1. Go to Railway Dashboard: https://railway.app/
2. Select your **backend service** (you-can-FI)
3. Click on the **Variables** tab
4. Add these 4 variables:

```bash
PLAID_CLIENT_ID=your_client_id_here
PLAID_SECRET=your_sandbox_secret_here
PLAID_ENVIRONMENT=sandbox
PLAID_ENCRYPTION_KEY=your_generated_encryption_key_here
```

**Important:**
- Replace `your_client_id_here` with your actual Plaid Client ID
- Replace `your_sandbox_secret_here` with your actual Sandbox Secret
- Keep `PLAID_ENVIRONMENT=sandbox` for testing
- Replace `your_generated_encryption_key_here` with the key from Step 2

### Step 4: Redeploy

After adding the variables:
1. Railway will automatically redeploy
2. Wait for deployment to complete (~2-3 minutes)
3. Test the "Connect Bank Account" button again

## Verification

After setting the variables, you should see:
- ✅ No error when clicking "Connect Bank Account"
- ✅ Plaid Link modal opens
- ✅ You can connect test accounts

## Troubleshooting

### Still seeing errors?

1. **Check Railway logs:**
   - Go to Railway → Your Service → Deployments → Latest → View Logs
   - Look for any errors about Plaid initialization

2. **Verify variables are set:**
   - Railway → Variables tab
   - Make sure all 4 variables are present (no typos)

3. **Check Plaid Dashboard:**
   - Make sure your Plaid account is active
   - Verify you're using Sandbox credentials (not Production)

4. **Test the endpoint directly:**
   ```bash
   # Get a JWT token from your app
   ./backend/test_plaid_with_auth.sh YOUR_JWT_TOKEN
   ```

## Next Steps After Setup

Once environment variables are set:
1. Test connecting a Sandbox account
2. Verify account sync works
3. Test linking accounts to assets/liabilities
4. When ready for production, switch to Production credentials

