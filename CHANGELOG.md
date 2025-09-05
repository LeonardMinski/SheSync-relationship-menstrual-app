# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Supabase integration for authentication and database operations
- Complete authentication flow with signup, login, and email verification
- Landing page with project branding and feature highlights
- Email confirmation callback route (`/auth/callback`)
- Dashboard route for authenticated users (`/dashboard`)
- Comprehensive database schema with RLS policies for:
  - User profiles and preferences
  - Menstrual cycle tracking data
  - AI coach conversation history
  - Intimacy cards and fantasy entries
  - Subscription management
- Authentication middleware for route protection
- Environment variable configuration for Supabase
- Supabase configuration documentation
- Stripe payments integration with subscription tier syncing
- API routes for checkout session creation (`/api/checkout`)
- Stripe webhook handling for subscription events (`/api/webhooks/stripe`)
- Subscription tier management (free, premium, vip, lifetime)
- Pricing page with subscription plan selection
- TDD unit tests for payment processing and webhook handling

### Changed
- Moved cycle tracking functionality from `/` to `/dashboard`
- Updated authentication redirects to use `/dashboard` instead of `/`
- Enhanced error handling for Supabase operations
- Improved user profile creation during signup process

### Fixed
- Hydration errors in main layout component
- Empty error object handling in database operations
- TypeScript errors in authentication context
- Environment variable loading and validation

### Security
- Implemented Row Level Security (RLS) policies for all database tables
- Added authentication middleware for protected routes
- Secure handling of Supabase credentials
- User data isolation and privacy controls
