# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **PARTNER PORTAL**: Comprehensive partner sharing system with:
  - Privacy-respecting shared data display (cycle phase, mood, intimacy cards, fantasy teasers)
  - Real-time partner data updates based on privacy settings
  - Partner linking system using `partner_links` table with RLS
  - "Today at a glance" dashboard for partner's shared activities
  - Recent activity feed showing partner's shared experiences
  - Supportive actions and connection tips for partners
  - Comprehensive API endpoints for partner data management
  - Full test coverage with Vitest for privacy settings validation
  - Playwright E2E tests for sharing/unsharing flow scenarios
- **INTIMACY feature**: Complete intimacy and connection system with:
  - Boundaries management (yes/maybe/no preferences)
  - Daily intimacy card selection with phase-aware suggestions
  - Reflection system for connection experiences
  - Partner sharing with strict RLS policies
  - 40+ curated non-explicit intimacy cards across 5 categories
  - Partner portal for viewing shared activities
  - Comprehensive database schema with proper RLS
  - Full test coverage for schemas and selectors
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
