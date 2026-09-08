# Roadmap

## Product Focus (updated 2026-09-02 — supersedes the MVP-only nav below)

SheSync+'s full information architecture is now live in navigation: **Home, Cycle,
Coach, Connect, Vault**, with Settings reached from the avatar/profile menu.
This replaces the narrower "Home / Cycle / Partner / Settings" MVP nav that
`docs/MVP_AUDIT.md` and `docs/MVP_DESIGN_SPEC.md` (2026-08-30) recommended.

Only **Home, Cycle, Partner (inside Connect), Privacy Settings, and Vault**
are backed by real, working data end to end (updated 2026-09-08 — see
`docs/vault-v1.md`). **Coach and Connect's Explore/Boundaries/Reflections
tabs are still UI-only** — approved-design screens rendered with
`FeaturePlaceholder`/`EmptyState`, with no fabricated data and no backend
wiring. See each route's own placeholder copy and the `// TODO(V1-*)` markers
in source for what's still required before they're real. Do not read this file
as a claim that those areas are functionally complete.

The underlying MVP loop this app must keep working is unchanged:

1. User logs in.
2. User logs cycle data.
3. User sees the dashboard.
4. User changes privacy settings.
5. Partner view respects those privacy settings.

## Real (data-backed) Now

- Auth and session handling
- Cycle logging
- Dashboard summary based on logged cycle data
- Privacy settings for partner sharing
- Partner read-only view (now surfaced inside `/connect`'s "Partner" tab)
- Partner view must only display data explicitly allowed by privacy settings
- Vault (Sparks, teases, the mutual-reveal ceremony, Afterglow, Desire
  Decks) — see `docs/vault-v1.md`

## Routes

- `/`
- `/auth/login`
- `/auth/signup`
- `/auth/callback`
- `/auth/verify-email`
- `/onboarding` — **UI placeholder**, reachable but not yet auto-routed to
  after signup. There is no `has_completed_onboarding` (or equivalent) field
  on the user profile, so nothing currently decides "show this once, then
  never again" — wiring signup to redirect here without that field would risk
  showing onboarding on every login. Add that field + the redirect logic
  together once onboarding actually needs to persist something.
- `/dashboard` — Home. Real data.
- `/cycle` — Real data.
- `/coach` — **UI placeholder.** No AI backend wired.
- `/connect` — Explore/Boundaries/Reflections tabs are **UI placeholders**;
  the Partner tab reuses the real, working partner-linking feature
  (`PartnerPortal`) at its previous `/partner` route.
- `/partner` — still resolves directly (kept for existing links/tests);
  `/connect` is now the primary entry point.
- `/vault` — Real data (Vault V1, see `docs/vault-v1.md`). Spark create/edit/
  archive, tease/response, the mutual-reveal ceremony, revealed reactions,
  focused conversation, Afterglow, Desire Decks, Give & Receive, and For
  Tonight are all backed by real persistence and RLS/RPC-enforced privacy.
  Not yet gated by Premium entitlement — see "Not yet real" below.
- `/settings`, `/settings/privacy` — reached via the avatar/profile menu.

## Still Parked (unreachable from primary nav, `ComingLater` if visited directly)

- `/ai-coach` (superseded by `/coach`'s placeholder UI)
- `/fantasy` (superseded by `/vault`, now real — see `docs/vault-v1.md`)
- `/intimacy` (superseded by `/connect`'s Explore/Boundaries/Reflections tabs)
- `/partner/intimacy`
- `/pricing`

## Parked/legacy feature code (do not delete, do not wire up as-is)

- `src/components/intimacy/*`, `src/services/intimacy/*` — per
  `docs/MVP_AUDIT.md` §11, the intimacy schema has drifted from the code that
  queries it; do not assume this still works against the live database.
- `src/components/fantasy/*`, `src/services/fantasy/*`
- `src/components/ai-coach/*`, `src/hooks/useCoach.ts`, `src/app/api/coach/*`
- Stripe checkout/webhooks, advanced analytics, notifications

## Next (making the new nav real)

- Wire `/coach` to an authenticated Coach service scoped to cycle/wellbeing
  logs only (Vault/private content excluded unless explicitly attached).
- Design and build real persistence for Connect's Explore/Boundaries/
  Reflections (reflection responses, boundary preferences) — do not reuse the
  drifted `src/services/intimacy/*` layer without re-auditing it first.
- Rebuild browser-level coverage for the MVP journey from
  `docs/PARKED_TEST_SCENARIOS.md`.
- Real full-browser QA for Vault V1 (see `docs/vault-v1.md` "Manual QA
  required") — this pass validated server-side behavior, tsc/lint/build, and
  route compilation, but did not exercise the UI with a live authenticated
  session in a browser (no browser-automation tool was available).

## Not yet real (do not build UI that implies otherwise)

- **Premium entitlement.** No API route anywhere checks `subscription_tier`
  server-side. The Stripe webhook (`src/app/api/webhooks/stripe/route.ts`)
  cannot even write `subscription_tier` today — it authenticates with the
  anon key, so `auth.uid()` is null and the `users` table's owner-only RLS
  UPDATE policy silently rejects the write. Stripe itself is stub-configured
  (placeholder keys only). Vault's Desire Decks show a "Premium" label for
  product-truth/branding purposes, but nothing in Vault is actually gated by
  it — do not add a gate here until real subscription infrastructure exists,
  and never gate with a client-side-only check when it does.

## Later

- Paid plan experiments, Stripe checkout and subscription management
- Email reminders and notification preferences
- Cycle prediction improvements, richer dashboard charts/trends
