# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Architecture
- Documented the final production folder model across `app`, `components`, `context`, `hooks`, `lib`, `schemas`, `services`, `styles`, `test`, `types`, and `utils`.
- Consolidated duplicate API surfaces so cycle logging lives under `/api/cycle`, coach history lives under `/api/coach/messages`, and partner sharing lives under `/api/partner/shared-data`.
- Replaced vague service and library names with responsibility-based modules such as `fantasy/entries.ts`, `intimacy/boundaries.ts`, `intimacy/cards.ts`, `intimacy/sessions.ts`, `partner/data.ts`, `privacy/settings.ts`, `lib/api/authentication.ts`, and `lib/api/responses.ts`.
- Moved generic `ComingLater` and `LoadingSpinner` components into `components/ui/`.
- Kept runtime demo data in `utils/mockData.ts` because it is used by the running app, and left `tests/e2e/` as the intended Playwright spec location.

### Testing
- Added focused Vitest coverage for cycle insight fallbacks, email validation, and intimacy selector behaviour.
- Removed generated Playwright reports, test results, `.next`, and TypeScript build info from Git tracking while keeping them ignored locally.

### Documentation
- Updated README setup, environment variables, route map, folder responsibilities, script paths, and testing notes to match the current project structure.

### Added
- **APP POLISH COMPLETION**: Final polish pass completed with:
  - **UI/UX Improvements**:
    - Removed camera icons from all pages/components, replaced with Upload icon
    - Cleaned up auth pages by removing app header and user icons
    - Removed global footer while keeping bottom navigation on app pages
    - Made header and bottom navigation solid (no glass/blur effects)
    - Replaced numeric notification badges with simple red dot indicators
    - Fixed avatar upload functionality with proper file validation
  - **Authentication Flow**:
    - Streamlined login/signup pages with centered card layouts
    - Fixed redirect flow to dashboard after successful authentication
    - Improved error handling and user feedback
  - **Code Quality**:
    - Fixed linting errors and syntax issues
    - Removed dead code and unused imports
    - Added proper error handling throughout the application
    - Ensured consistent naming and code organization

- **APP POLISH**: Comprehensive app refinement and feature fixes with:
  - **Dashboard Enhancements**: 
    - CTA button for users with no cycle data linking to cycle logging
    - API insights integration (Infermedica, Nutritionix, NewsAPI) with fallback handling
    - Personalized recommendations and health tips
    - Improved header with "Shesync+" brand, avatar, notifications, and meeting button
  - **Extended Color Palette**: Secondary and tertiary colors for better dark/light mode contrast
  - **Persistent Footer**: Added to all pages with dummy links (About, Privacy, Terms, Support)
  - **Cycle Screen Improvements**:
    - Removed pagination arrows and +log button from header
    - Added CTA buttons ("Log Period", "Log Symptoms") for users with no data
    - Integrated API insights section with mood/symptoms tips and wellness suggestions
  - **Intimacy Feature Fixes**:
    - Fixed boundaries logging and storage with proper CRUD operations
    - Added fallback intimacy cards when database is empty
    - Implemented boundary status toggling (yes/maybe/no cycle)
    - Session sharing toggle functionality
    - Proper error handling and graceful fallbacks
  - **Fantasy Feature Fixes**:
    - Corrected database schema mapping (kind, content_text, content_url, comfort, share_status, redacted)
    - Fixed CRUD operations for fantasy entries
    - Updated NewFantasyPage to use correct schema properties
    - Proper form handling with comfort levels and share status controls
  - **Testing Infrastructure**:
    - Added Vitest schema validation tests for fantasy and intimacy features
    - Fixed PostCSS configuration for testing
    - Comprehensive test coverage for data validation and error handling
  - **Code Optimization**:
    - Extracted reusable UI components with proper TypeScript types
    - Removed unused code and imports
    - Added comprehensive comments for non-obvious logic
    - Fixed all linting errors and type mismatches

### Fixed
- **Authentication Flow**: Resolved login redirection issues with proper useEffect dependencies
- **Database Schema**: Aligned fantasy and intimacy schemas with actual database structure
- **PostCSS Configuration**: Fixed plugin configuration for proper build and testing
- **TypeScript Errors**: Resolved all type mismatches in fantasy and intimacy components
- **RLS Policies**: Identified and documented RLS policy requirements for database operations

### Changed
- **Brand Consistency**: Updated header to display "Shesync+" instead of "SheSync"
- **Component Architecture**: Moved dashboard to root page (`src/app/page.tsx`)
- **Database Integration**: All database access now properly abstracted through service layers
- **Error Handling**: Improved error handling with graceful fallbacks and user feedback

### Technical Details
- **Database Schema**: Fantasy entries use `kind`, `content_text`, `content_url`, `comfort`, `share_status`, `redacted` columns
- **API Integration**: Mock implementations for external APIs with fallback content
- **Testing**: Vitest configuration with proper mocking and schema validation
- **UI Components**: Fully typed components with accessibility features and design tokens
- **UI INTEGRATION**: Complete Visily-inspired design system implementation with:
  - **Design Tokens**: Comprehensive CSS custom properties for light/dark mode
    - Rose to purple gradient brand colors (`--cta-start`, `--cta-end`)
    - Semantic color tokens for backgrounds, text, borders, and status
    - Typography scale with Inter font family
    - Spacing, border radius, and shadow tokens
  - **Reusable Components**: Modern UI component library
    - `Button` with CTA, secondary, outline, and ghost variants
    - `Card` with default, elevated, and outlined variants
    - `Input` and `Textarea` with labels, validation, and helper text
    - `Toggle` with accessibility features and group support
    - `Navbar` with top navigation and bottom tab navigation
  - **Auth Flows**: Redesigned authentication pages
    - Full-screen card layout with brand gradient accent
    - Consistent input styling with proper focus states
    - Gradient CTA buttons with strong focus rings
    - Improved error handling and user feedback
  - **Dashboard**: Modern dashboard with new design system
    - Header with cycle phase summary and today's date
    - Stats cards for mood, energy, libido, and stress
    - Quick action buttons for main features
    - Bottom navigation bar with active tab highlighting
    - Modal forms for cycle logging with styled sliders
  - **Cycle Tracking**: Enhanced cycle logging interface
    - Daily log form with mood, energy, libido, and stress sliders
    - Symptom selection with toggle chips
    - History view with card-based layout
    - Date navigation with intuitive controls
  - **Intimacy Features**: Redesigned intimacy management
    - Boundaries list with status indicators and toggle chips
    - Today's intimacy card with category and difficulty badges
    - Reflection system with modal forms
    - Partner connection status display
  - **Fantasy Vault**: Modern fantasy entry management
    - Grid and list view modes with toggle
    - Filter system for privacy and content type
    - Create/edit modals with type selection
    - Share status controls (Hidden/Tease/Reveal)
    - Tag system with visual indicators
  - **AI Coach**: Chat interface with new design
    - Alternating message bubbles with proper styling
    - Fixed input bar with gradient send button
    - Quick prompt suggestions with icons
    - Typing indicators and loading states
  - **Partner Portal**: Read-only partner data display
    - Today at a glance with shared cycle data
    - Intimacy card display with partner reflections
    - Fantasy teasers with consent-based access
    - Privacy settings overview
    - Recent activity feed
  - **Settings**: Privacy controls with new design
    - Toggle switches for privacy settings
    - Card-based layout with clear sections
    - Helper text and descriptions
    - Reset to defaults functionality
  - **Accessibility**: WCAG AA compliance improvements
    - 4.5:1 contrast ratios for all text
    - Keyboard navigation support
    - Focus management with visible focus rings
    - Screen reader support with proper ARIA labels
    - Minimum 44px touch targets
    - High contrast mode support
    - Reduced motion preferences
  - **Testing**: Comprehensive test coverage
    - Vitest unit tests for all UI components
    - Playwright smoke tests for navigation flows
    - Accessibility testing for keyboard navigation
    - Responsive design testing across viewports
    - Dark mode toggle testing
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
