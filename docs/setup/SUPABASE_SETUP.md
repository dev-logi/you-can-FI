# Supabase Authentication Setup Guide

This guide will help you set up Supabase authentication for the You Can FI app.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A Supabase project created

## Step 1: Create a Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in your project details:
   - **Name**: You Can FI (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the region closest to your users
4. Click "Create new project" and wait for it to be ready (~2 minutes)

## Step 2: Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. You'll find:
   - **Project URL**: Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key**: Your public anon key (safe to expose in client code)

## Step 3: Configure Environment Variables

Create a `.env` file in the root of your project (or add to your existing `.env`):

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Important**: 
- Replace `your_supabase_project_url` with your actual Supabase project URL
- Replace `your_supabase_anon_key` with your actual anon key
- The `EXPO_PUBLIC_` prefix is required for Expo to expose these variables to your app

## Step 4: Configure Supabase Auth Settings

1. In your Supabase dashboard, go to **Authentication** → **Settings**
2. Under **Site URL**, add your app's URL (for development, you can use `exp://localhost:8081`)
3. Under **Redirect URLs**, add:
   - `exp://localhost:8081` (for Expo development)
   - Your production app URL (when ready)

## Step 5: Enable Email Authentication

1. Go to **Authentication** → **Providers**
2. Make sure **Email** provider is enabled
3. Configure email templates if desired (optional)

## Step 6: Test the Setup

1. Start your Expo app: `npm start`
2. You should see the login screen
3. Try creating a new account with email/password
4. Check your Supabase dashboard → **Authentication** → **Users** to see the new user

## Backend Integration (Next Steps)

The backend also needs to be updated to:
1. Verify Supabase JWT tokens
2. Extract user ID from tokens
3. Filter data by user ID

See `backend/SUPABASE_AUTH.md` for backend setup instructions.

## Troubleshooting

### "Supabase credentials not found" warning
- Make sure your `.env` file is in the project root
- Make sure variable names start with `EXPO_PUBLIC_`
- Restart your Expo development server after adding environment variables

### "Invalid API key" error
- Double-check your Supabase URL and anon key
- Make sure you're using the **anon/public** key, not the service_role key

### Authentication not working
- Check Supabase dashboard → **Authentication** → **Logs** for errors
- Verify your Site URL and Redirect URLs are configured correctly
- Make sure Email provider is enabled

## Security Notes

- The `anon` key is safe to expose in client code (it's public)
- Never commit your `.env` file to version control
- The `service_role` key should NEVER be used in client code (backend only)

