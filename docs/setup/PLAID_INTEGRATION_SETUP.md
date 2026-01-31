# Plaid Integration Setup Guide

This guide will help you complete the setup and testing of the Plaid integration for Phase 1.

## Prerequisites

1. **Plaid Account**: Sign up at [Plaid Dashboard](https://dashboard.plaid.com/)
2. **Backend Access**: Access to your backend environment (Railway or local)
3. **Database Access**: Ability to run database migrations

## Step 1: Get Plaid Credentials

1. Go to [Plaid Dashboard](https://dashboard.plaid.com/)
2. Navigate to **Team Settings** → **Keys**
3. Copy your:
   - **Client ID**
   - **Sandbox Secret** (for testing)
   - **Development Secret** (for development)
   - **Production Secret** (for production - only after approval)

## Step 2: Configure Backend Environment Variables

Add the following to your backend `.env` file (or Railway environment variables):

```bash
# Plaid Configuration
PLAID_CLIENT_ID=your_client_id_here
PLAID_SECRET=your_sandbox_secret_here  # Use sandbox for testing
PLAID_ENVIRONMENT=sandbox  # Options: 'sandbox', 'development', 'production'
PLAID_ENCRYPTION_KEY=your_encryption_key_here  # Generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### Generate Encryption Key

Run this command to generate a secure encryption key:

```bash
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Copy the output and use it as `PLAID_ENCRYPTION_KEY`.

## Step 3: Run Database Migration

The migration creates the `connected_accounts` table and adds Plaid fields to `assets` and `liabilities` tables.

### Local Development

```bash
cd backend
source venv/bin/activate
PYTHONPATH=/Users/logesh/projects/you-can-FI/backend alembic upgrade head
```

### Railway (Production)

The migration should run automatically on deployment, but you can also run it manually:

1. Go to Railway dashboard
2. Open your backend service
3. Go to **Deployments** → **Latest** → **Shell**
4. Run:
   ```bash
   cd backend
   PYTHONPATH=/Users/logesh/projects/you-can-FI/backend alembic upgrade head
   ```

## Step 4: Install Backend Dependencies

Make sure the Plaid Python SDK is installed:

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

This will install:
- `plaid-python>=9.0.0`
- `cryptography>=41.0.0`

## Step 5: Test Backend API

### Test Link Token Generation

```bash
# Get your JWT token from the app or Supabase
curl -X POST https://your-backend-url/api/v1/plaid/link-token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "link_token": "link-sandbox-xxxxx"
}
```

## Step 6: Frontend Setup

The frontend dependencies are already installed. The `PlaidLinkButton` component is ready to use.

### Add PlaidLinkButton to Dashboard

The button can be added to:
- Dashboard screen (main screen)
- Add Asset screen
- Add Liability screen
- Connected Accounts screen

## Step 7: Testing with Plaid Sandbox

### Test Accounts

Plaid Sandbox provides test credentials. Use these for testing:

**Institution**: `first_plaid`
**Username**: `user_good`
**Password**: `pass_good`

### Test Flow

1. **Connect Account**:
   - Click "Connect Bank Account" button
   - Plaid Link modal opens
   - Select institution: `first_plaid`
   - Enter test credentials
   - Select accounts to connect

2. **Account Linking**:
   - After connection, `AccountLinkingModal` appears
   - Choose to link to existing asset/liability or create new
   - Complete the linking process

3. **Sync Account**:
   - Go to Assets or Liabilities screen
   - Find the connected account (has "SYNCED" badge)
   - Click "Sync" to refresh balance
   - Or go to Connected Accounts screen to sync all

4. **Verify Sync**:
   - Check that balance is updated
   - Verify last synced timestamp
   - Check for any sync errors

## Step 8: Handle Account Linking Flow

After a user connects a Plaid account, the flow should:

1. Show `AccountLinkingModal` with account info
2. User chooses to:
   - **Link to existing**: Select from matching assets/liabilities
   - **Create new**: Navigate to add asset/liability screen with pre-filled data
3. Backend automatically syncs balance after linking

## Step 9: Error Handling

Common errors and solutions:

### "Failed to create link token"
- Check `PLAID_CLIENT_ID` and `PLAID_SECRET` are set correctly
- Verify `PLAID_ENVIRONMENT` matches your secret type
- Check backend logs for detailed error

### "Failed to exchange token"
- Token may have expired (link tokens expire after 4 hours)
- Regenerate link token and try again

### "Failed to sync account"
- Check account is still active in Plaid
- Verify access token is valid
- Check backend logs for Plaid API errors

### "Failed to decrypt access token"
- Verify `PLAID_ENCRYPTION_KEY` is set correctly
- Ensure the same key is used for encryption and decryption

## Step 10: Production Checklist

Before going to production:

- [ ] Get Plaid production access (requires application and approval)
- [ ] Update `PLAID_ENVIRONMENT` to `production`
- [ ] Use production secrets
- [ ] Test with real bank accounts (your own)
- [ ] Set up webhook endpoints (for future Phase 2)
- [ ] Review Plaid security best practices
- [ ] Set up monitoring for sync errors
- [ ] Document user-facing error messages

## Troubleshooting

### WebView Not Loading Plaid Link

If the Plaid Link modal doesn't load:
- Check browser console for errors (web)
- Verify `react-native-webview` is installed
- Check network connectivity
- Verify link token is valid

### Migration Issues

If migration fails:
- Check database connection
- Verify Alembic is configured correctly
- Check for existing conflicting tables/columns
- Review migration file for errors

### Backend API Errors

Check backend logs for:
- Plaid API errors (rate limits, invalid credentials)
- Database connection issues
- Encryption/decryption errors

## Next Steps (Phase 2)

Once Phase 1 is working:
- [ ] Add transaction fetching
- [ ] Implement webhooks for account updates
- [ ] Add automatic periodic syncing
- [ ] Handle account re-authentication
- [ ] Add account removal/disconnection UI

## Support

- [Plaid Documentation](https://plaid.com/docs/)
- [Plaid Support](https://support.plaid.com/)
- [Plaid API Reference](https://plaid.com/docs/api/)

