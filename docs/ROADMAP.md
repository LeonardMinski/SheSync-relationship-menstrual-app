# Roadmap

## Product Focus

SheSync+ is being refocused around one clear MVP journey:

1. User logs in.
2. User logs cycle data.
3. User sees the dashboard.
4. User changes privacy settings.
5. Partner view respects those privacy settings.

The goal for the current phase is to make this loop reliable, understandable, and testable before expanding the product surface again.

## MVP Now

- Auth and session handling
- Cycle logging
- Dashboard summary based on logged cycle data
- Privacy settings for partner sharing
- Partner read-only view
- Partner view must only display data explicitly allowed by privacy settings

## MVP Routes

- `/`
- `/auth/login`
- `/auth/signup`
- `/auth/callback`
- `/auth/verify-email`
- `/dashboard`
- `/cycle`
- `/settings`
- `/settings/privacy`
- `/partner`

## Parked Routes

These routes may remain accessible, but should not appear in primary navigation during the MVP phase. If opened directly, they should show a "coming later" treatment.

- `/ai-coach`
- `/coach`
- `/fantasy`
- `/intimacy`
- `/partner/intimacy`
- `/pricing`

## Parked Feature Areas

Do not delete these feature folders yet. They are future product ideas and useful implementation references.

- AI coach
- Fantasy vault
- Intimacy deck and intimacy sessions
- Stripe checkout and paid plans
- Advanced analytics
- Notifications
- Rich partner invitations and partner management

## Phase 2

- Partner invitation flow
- Better dashboard charts and trend summaries
- Cycle prediction improvements
- Privacy audit UI showing exactly what partner can see
- Rebuild browser-level coverage for the MVP journey from the parked scenarios in `docs/PARKED_TEST_SCENARIOS.md`

## Phase 3

- AI coach based on logged data
- Intimacy prompts and shared connection activities
- Fantasy vault with explicit consent/sharing states
- Paid plan experiments
- Stripe checkout and subscription management
- Email reminders and notification preferences
