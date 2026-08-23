# Supabase Setup Guide for SheSync+

This guide will help you set up Supabase for authentication and storage in your SheSync+ Next.js application.

## Prerequisites

- A Supabase account and project
- Node.js and npm/yarn installed
- Git for version control

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization and enter project details
4. Wait for the project to be created

## Step 2: Get Project Credentials

1. In your Supabase project dashboard, go to Settings > API
2. Copy the following values:
   - Project URL
   - Anon (public) key
   - Service role key (optional, for admin operations)

## Step 3: Set Environment Variables

1. Copy `env.local.example` to `.env.local`
2. Update the values with your actual Supabase credentials:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Step 4: Set Up Database Schema

1. In your Supabase dashboard, go to SQL Editor
2. Copy the contents of `supabase-initial-schema.sql`
3. Paste and run the SQL script
4. Verify that all tables are created successfully

## Step 5: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Test the `/api/cycle` endpoint:
   ```bash
   curl -X POST http://localhost:3000/api/cycle \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer test-token" \
     -d '{
       "phase": "menstrual",
       "mood": 7,
       "symptoms": ["cramps", "fatigue"]
     }'
   ```

## Database Schema Overview

### Tables Created

- **users**: Basic user information
- **cycles**: Menstrual cycle tracking data
- **entries**: User entries (fantasy, notes, moodboards)
- **partners**: Partner relationship management
- **subscriptions**: Subscription and billing information

### Row Level Security (RLS)

All tables have RLS enabled with policies that ensure users can only access their own data. The policies use `auth.uid()` to identify the current user.

## API Endpoints

### POST /api/cycle
Logs a new cycle entry with:
- `phase`: menstrual, follicular, ovulation, or luteal
- `mood`: 1-10 scale
- `symptoms`: array of symptom strings (optional)

### GET /api/cycle
Retrieves cycle entries for the authenticated user.

## Next Steps

1. **Authentication**: Implement JWT verification in the API routes
2. **User Management**: Add user registration and login endpoints
3. **Data Validation**: Enhance input validation and error handling
4. **Real-time Features**: Add Supabase real-time subscriptions
5. **File Storage**: Integrate Supabase Storage for media files

## Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**
   - Ensure `.env.local` is in your project root
   - Restart your development server after adding environment variables

2. **Database Connection Errors**
   - Verify your Supabase URL and keys are correct
   - Check that your IP is not blocked by Supabase

3. **RLS Policy Errors**
   - Ensure all tables have RLS enabled
   - Verify policies are created correctly
   - Check that `auth.uid()` is working properly

### Getting Help

- Check the [Supabase documentation](https://supabase.com/docs)
- Review the [Next.js API routes documentation](https://nextjs.org/docs/api-routes/introduction)
- Open an issue in your project repository

## Security Notes

- Never commit `.env.local` to version control
- Use environment variables for all sensitive configuration
- Regularly rotate your Supabase keys
- Monitor your Supabase usage and set up alerts
