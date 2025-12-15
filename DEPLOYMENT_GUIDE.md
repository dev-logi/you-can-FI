# Deployment Guide - You Can FI

## 📝 Supabase Connection Info

**Project**: personal-finance-FI  
**Project ID**: cwsoawrcxogoxrgmtowx  
**Database Host**: db.cwsoawrcxogoxrgmtowx.supabase.co

**Connection String (Original)**:
```
postgresql://postgres:[YOUR-PASSWORD]@db.cwsoawrcxogoxrgmtowx.supabase.co:5432/postgres
```

**Connection String (For Python/psycopg3)**:
```
postgresql+psycopg://postgres:[YOUR-PASSWORD]@db.cwsoawrcxogoxrgmtowx.supabase.co:5432/postgres
```

## 🔑 Get Your Database Password

1. Go to: https://supabase.com/dashboard/project/cwsoawrcxogoxrgmtowx/database/settings
2. Click "Reset database password" if you need a new one
3. Copy the password

## 🚀 Step 1: Run Database Migrations to Supabase

Open your terminal and run:

```bash
cd /Users/logesh/projects/you-can-FI/backend

# Activate virtual environment
source venv/bin/activate

# Set your connection string (replace [YOUR-PASSWORD] with actual password)
export DATABASE_URL="postgresql+psycopg://postgres:[YOUR-PASSWORD]@db.cwsoawrcxogoxrgmtowx.supabase.co:5432/postgres"

# Run migrations
alembic upgrade head
```

You should see output like:
```
INFO  [alembic.runtime.migration] Running upgrade  -> 001_initial, Initial migration
✅ Tables created successfully!
```

## ✅ Step 2: Verify Tables in Supabase

1. Go to: https://supabase.com/dashboard/project/cwsoawrcxogoxrgmtowx/editor
2. You should see 3 new tables:
   - `assets`
   - `liabilities`
   - `onboarding_state`

## 🚂 Step 3: Deploy to Railway

### A. Navigate to Railway
1. Go to: https://railway.app/new
2. Login with your account

### B. Create New Project
1. Select **"GitHub Repository"**
2. Authorize Railway to access your GitHub
3. Select your repository: `you-can-FI`

### C. Configure the Service
1. Railway should auto-detect the Dockerfile in `/backend`
2. If not, manually set:
   - **Root Directory**: `backend`
   - **Dockerfile Path**: `Dockerfile`

### D. Set Environment Variables
Click on "Variables" tab and add these:

```env
DATABASE_URL=postgresql+psycopg://postgres:[YOUR-PASSWORD]@db.cwsoawrcxogoxrgmtowx.supabase.co:5432/postgres
DEBUG=False
CORS_ORIGINS=["*"]
```

**Important**: Use the same password you used for migrations!

### E. Deploy
1. Click "Deploy"
2. Wait for deployment to complete (2-3 minutes)
3. Railway will provide a public URL like:
   ```
   https://personal-finance-fi-production.up.railway.app
   ```

## 🧪 Step 4: Test the Deployed API

Once Railway gives you the URL, test it:

```bash
# Health check
curl https://your-railway-url/health

# Should return: {"status": "healthy"}

# API documentation
open https://your-railway-url/docs
```

## 📱 Step 5: Update React Native App

Update `/Users/logesh/projects/you-can-FI/src/api/config.ts`:

```typescript
export const API_BASE_URL = __DEV__
  ? 'http://localhost:8000'
  : 'https://your-railway-url-here';  // Replace with actual Railway URL

export const IS_PRODUCTION = !__DEV__;
```

## 🔍 Troubleshooting

### Alembic Migration Fails

```bash
# Check connection
export DATABASE_URL="postgresql+psycopg://postgres:[PASSWORD]@db.cwsoawrcxogoxrgmtowx.supabase.co:5432/postgres"
python -c "from sqlalchemy import create_engine; engine = create_engine('$DATABASE_URL'); print('✅ Connection successful!')"
```

### Railway Build Fails

Check the logs in Railway dashboard:
- Make sure `DATABASE_URL` is set correctly
- Verify Dockerfile is in `backend/` directory
- Check that all dependencies are in `requirements.txt`

### API Returns 500 Error

1. Check Railway logs for error messages
2. Verify `DATABASE_URL` environment variable is correct
3. Make sure migrations ran successfully on Supabase

## 📊 Monitor Your Deployment

### Supabase Dashboard
- Database: https://supabase.com/dashboard/project/cwsoawrcxogoxrgmtowx/editor
- Logs: https://supabase.com/dashboard/project/cwsoawrcxogoxrgmtowx/logs/explorer

### Railway Dashboard
- After deployment, you'll have access to:
  - Deployment logs
  - Metrics
  - Environment variables
  - Domain settings

## 🎉 Success Checklist

- [ ] Alembic migrations completed successfully
- [ ] Tables visible in Supabase dashboard (assets, liabilities, onboarding_state)
- [ ] Railway deployment successful
- [ ] `/health` endpoint returns `{"status": "healthy"}`
- [ ] `/docs` shows interactive API documentation
- [ ] React Native app config updated with Railway URL
- [ ] Mobile app can connect to production API

---

**Need Help?** Check the logs in:
- Terminal (for Alembic)
- Supabase Dashboard → Logs
- Railway Dashboard → Deployments → View Logs

