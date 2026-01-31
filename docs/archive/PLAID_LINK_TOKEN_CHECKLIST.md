# Plaid Link Token Success Checklist

For the "Connect Bank Account" button to work, the following must be configured:

## ✅ Required Steps

### 1. **Get Plaid Credentials**
   - Sign up at [Plaid Dashboard](https://dashboard.plaid.com/)
   - Go to **Team Settings** → **Keys**
   - Copy:
     - **Client ID**
     - **Sandbox Secret** (for testing)

### 2. **Set Environment Variables in Railway**
   
   Go to Railway Dashboard → Your Backend Service → **Variables** tab and add:

   ```bash
   PLAID_CLIENT_ID=your_client_id_here
   PLAID_SECRET=your_sandbox_secret_here
   PLAID_ENVIRONMENT=sandbox
   PLAID_ENCRYPTION_KEY=your_encryption_key_here
   ```

   **Generate Encryption Key:**
   ```bash
   python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
   ```

### 3. **Verify Backend Deployment**
   - ✅ Backend is deployed from `feature/plaid-integration` branch
   - ✅ Plaid router is loaded (check Railway logs for "✅ Plaid router loaded successfully")
   - ✅ Backend dependencies installed (`plaid-python>=9.0.0` and `cryptography>=41.0.0`)

### 4. **Verify Database Migration**
   - ✅ `connected_accounts` table exists
   - ✅ `assets` and `liabilities` tables have Plaid fields (`connected_account_id`, `is_connected`, `last_synced_at`)

### 5. **Test the API Endpoint**

   Test if the link token endpoint works:
   
   ```bash
   # Replace YOUR_JWT_TOKEN with a valid token from your app
   curl -X POST https://you-can-fi-production.up.railway.app/api/v1/plaid/link-token \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json"
   ```

   **Expected Success Response:**
   ```json
   {
     "link_token": "link-sandbox-xxxxx"
   }
   ```

   **Common Error Responses:**
   - `500 Internal Server Error` → Check Railway logs for Plaid client initialization errors
   - `401 Unauthorized` → JWT token is invalid or missing
   - `404 Not Found` → Plaid router not loaded (check Railway logs)

## 🔍 Troubleshooting

### Check Railway Logs
1. Go to Railway Dashboard → Backend Service → **Deployments** → **Latest** → **Logs**
2. Look for:
   - `✅ Plaid router loaded successfully` (good)
   - `⚠️ WARNING: Plaid router not available` (bad - check imports)
   - `WARNING: Failed to initialize Plaid client` (bad - check environment variables)
   - `RuntimeError: Plaid client not initialized` (bad - missing PLAID_CLIENT_ID or PLAID_SECRET)

### Verify Environment Variables
1. Railway Dashboard → Backend Service → **Variables**
2. Ensure all 4 variables are set:
   - `PLAID_CLIENT_ID`
   - `PLAID_SECRET`
   - `PLAID_ENVIRONMENT` (should be `sandbox` for testing)
   - `PLAID_ENCRYPTION_KEY`

### Check Backend Branch
1. Railway Dashboard → Backend Service → **Settings** → **Source**
2. Ensure branch is set to `feature/plaid-integration`

### Verify Dependencies
Check `backend/requirements.txt` includes:
```
plaid-python>=9.0.0
cryptography>=41.0.0
```

## 🎯 Quick Test

Once everything is configured, the button should:
1. ✅ Be visible on the dashboard
2. ✅ Not be disabled (unless loading)
3. ✅ Successfully create a link token when clicked
4. ✅ Open Plaid Link modal

If the button is still disabled or shows an error, check the browser/app console for error messages.

