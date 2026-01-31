# Email Confirmation Testing Guide

## Overview
This guide explains how to test Supabase email confirmation functionality in the You Can FI app.

## Prerequisites

1. **Supabase Dashboard Access**
   - Go to https://app.supabase.com
   - Navigate to your project: `cwsoawrcxogoxrgmtowx`

2. **Enable Email Confirmation**
   - Go to **Authentication** → **Settings**
   - Scroll to **Email Auth** section
   - Toggle **"Enable email confirmations"** to **ON**
   - Save changes

3. **Configure Redirect URL**
   - In **Authentication** → **Settings** → **URL Configuration**
   - Under **Redirect URLs**, add:
     - `youcanfi://email-confirmed` (for mobile app deep link)
     - `exp://localhost:8081` (for development)
   - Save changes

## Testing Flow

### Step 1: Sign Up with Email Confirmation Enabled

1. Open the app
2. Navigate to **Sign Up** screen
3. Enter a test email (use a real email you can access)
4. Enter a password (min 6 characters)
5. Confirm password
6. Tap **Create Account**

### Expected Behavior:

**If Email Confirmation is ENABLED:**
- User is redirected to **"Check Your Email"** screen
- No session is created immediately
- User sees message: "We've sent a confirmation email to [email]"
- User can:
  - Resend confirmation email
  - Open email app
  - Go back to sign in

**If Email Confirmation is DISABLED:**
- User is immediately logged in
- Session is created
- User proceeds to onboarding

### Step 2: Check Email

1. Open your email inbox
2. Look for email from Supabase (subject: "Confirm your signup")
3. Click the confirmation link in the email

### Expected Behavior:
- Email opens in browser
- Redirects to `youcanfi://email-confirmed` (or configured redirect URL)
- On mobile: App opens automatically
- User is now verified and can sign in

### Step 3: Sign In After Confirmation

1. Go back to app
2. Navigate to **Sign In** screen
3. Enter the email you just confirmed
4. Enter password
5. Tap **Sign In**

### Expected Behavior:
- User successfully signs in
- Session is created
- User proceeds to onboarding (if not completed) or dashboard

## Testing Scenarios

### Scenario 1: Unconfirmed Email Login Attempt

1. Sign up with email confirmation enabled
2. **Don't** click the confirmation link
3. Try to sign in immediately

**Expected:**
- Error message: "Please verify your email address before signing in."
- "Resend confirmation email" link appears
- User can click to resend

### Scenario 2: Resend Confirmation Email

1. Sign up with email confirmation enabled
2. On the "Check Your Email" screen
3. Tap **"Resend Confirmation Email"**

**Expected:**
- Success message appears
- New confirmation email is sent
- User can check inbox again

### Scenario 3: Email Confirmation Disabled

1. Disable email confirmation in Supabase dashboard
2. Sign up with a new account

**Expected:**
- User is immediately logged in
- No "Check Your Email" screen
- Direct navigation to onboarding

## Supabase Dashboard Configuration

### Current Settings to Check:

1. **Authentication → Settings → Email Auth**
   - Enable email confirmations: **ON/OFF** (toggle to test both states)
   - Secure email change: **OFF** (for MVP)
   - Double confirm email changes: **OFF** (for MVP)

2. **Authentication → Settings → URL Configuration**
   - Site URL: `exp://localhost:8081` (for development)
   - Redirect URLs:
     - `youcanfi://email-confirmed`
     - `exp://localhost:8081`
     - `https://you-can-fi-production-b1b7.up.railway.app` (for web)

3. **Authentication → Email Templates**
   - Confirm signup template: Default Supabase template
   - Can customize if needed

## Troubleshooting

### Issue: Email not received
- Check spam/junk folder
- Verify email address is correct
- Wait a few minutes (email delivery can be delayed)
- Check Supabase logs: **Authentication** → **Logs**

### Issue: Confirmation link doesn't work
- Verify redirect URL is configured correctly
- Check that deep link scheme matches `app.json` (`youcanfi://`)
- For web: Ensure redirect URL is in allowed list

### Issue: User can sign in without confirming
- Verify email confirmation is enabled in Supabase
- Check Supabase logs for confirmation status
- Ensure backend validates `email_confirmed_at` if needed

### Issue: App doesn't open from email link
- Verify deep link scheme is configured: `youcanfi://`
- For iOS: May need to configure Associated Domains
- For Android: Verify intent filters in AndroidManifest.xml

## Testing Checklist

- [ ] Email confirmation enabled in Supabase
- [ ] Redirect URLs configured
- [ ] Sign up shows "Check Your Email" screen
- [ ] Confirmation email received
- [ ] Confirmation link works
- [ ] User can sign in after confirmation
- [ ] Unconfirmed users cannot sign in
- [ ] Resend confirmation email works
- [ ] Error messages are user-friendly
- [ ] Deep link opens app (if configured)

## Notes

- For MVP, you can disable email confirmation to simplify the flow
- Email confirmation adds security but requires email access
- Consider adding email confirmation as optional feature later
- Deep link handling for email confirmation may need additional setup for production

