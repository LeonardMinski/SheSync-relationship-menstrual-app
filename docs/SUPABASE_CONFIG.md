# Supabase Configuration Guide

## Environment Variables Setup

1. **Copy the environment file:**
   ```bash
   cp env.example .env.local
   ```

2. **Update the following variables in `.env.local`:**
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Supabase Dashboard Configuration

### 1. Site URL Settings

In your Supabase project dashboard:

1. Go to **Authentication** → **URL Configuration**
2. Set the following URLs:

#### Development Environment
- **Site URL**: `http://localhost:3000`
- **Redirect URLs**: 
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/dashboard`

#### Production Environment
- **Site URL**: `https://yourdomain.com`
- **Redirect URLs**:
  - `https://yourdomain.com/auth/callback`
  - `https://yourdomain.com/dashboard`

### 2. Email Templates (Optional)

Configure custom email templates in **Authentication** → **Email Templates**:

- **Confirm signup**: Customize the email verification message
- **Magic Link**: For passwordless login (if enabled)
- **Change Email Address**: For email change confirmations
- **Reset Password**: For password reset emails

### 3. Authentication Providers

Enable/configure authentication providers in **Authentication** → **Providers**:

- **Email**: Enabled by default
- **Google, Facebook, etc.**: Configure as needed

## Database Schema

Run the SQL schema from `supabase-schema.sql` in your Supabase SQL Editor to create the required tables and policies.

## Testing the Configuration

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test the authentication flow:**
   - Visit `http://localhost:3000`
   - Click "Get Started" to sign up
   - Check email for verification link
   - Complete the signup process
   - Verify redirect to `/dashboard`

3. **Check for common issues:**
   - Environment variables loaded correctly
   - No console errors related to Supabase
   - Email verification links work
   - User data appears in Supabase dashboard

## Troubleshooting

### "Failed to fetch" errors
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check if Supabase project is active
- Ensure `.env.local` file exists and is properly formatted

### Email verification not working
- Check Site URL and Redirect URLs in Supabase dashboard
- Verify email templates are enabled
- Check spam folder for verification emails

### Authentication redirects not working
- Ensure middleware is properly configured
- Check that redirect URLs match exactly (including protocol)
- Verify authentication tokens are being set correctly

## Security Notes

- Never commit `.env.local` to version control
- Use strong, unique passwords for Supabase admin access
- Regularly rotate API keys in production
- Enable Row Level Security (RLS) on all tables
- Review and test RLS policies regularly
