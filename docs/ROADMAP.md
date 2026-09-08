# Roadmap

## Product Focus (updated 2026-09-02 — supersedes the MVP-only nav below)

SheSync+'s full information architecture is now live in navigation: **Home, Cycle,
Coach, Connect, Vault**, with Settings reached from the avatar/profile menu.
This replaces the narrower "Home / Cycle / Partner / Settings" MVP nav that
`docs/MVP_AUDIT.md` and `docs/MVP_DESIGN_SPEC.md` (2026-08-30) recommended.

**Home, Cycle, Coach, Partner (inside Connect), Privacy Settings, and
Vault** are backed by real, working data end to end (updated 2026-09-08 —
Coach corrected the same day; see `docs/COACH_CONVERSATION_WORKSPACE.md`
and `docs/vault-v1.md`). **Connect's Explore/Boundaries/Reflections
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
- Onboarding completion state (persisted, gates both redirect directions —
  see `/onboarding` below; this list previously omitted it in error)
- Cycle logging
- Dashboard summary based on logged cycle data
- Privacy settings for partner sharing
- Partner read-only view (now surfaced inside `/connect`'s "Partner" tab)
- Partner view must only display data explicitly allowed by privacy settings
- Vault (Sparks, teases, the mutual-reveal ceremony, Afterglow, Desire
  Decks) — see `docs/vault-v1.md`
- Coach (persisted conversations, real OpenAI-generated replies scoped to
  cycle/wellbeing logs only) — see `docs/COACH_CONVERSATION_WORKSPACE.md`.
  This list previously omitted Coach and called it a UI-only placeholder;
  that was stale — Coach Conversation Workspace V1 already made it real.

## Routes

- `/`
- `/auth/login`
- `/auth/signup`
- `/auth/callback`
- `/auth/verify-email`
- `/onboarding` — **Real, real data (corrected 2026-09-08).** This entry
  was stale: `public.users.onboarding_completed_at` exists, `PATCH
  /api/user` sets it on completion, and `(app)/layout.tsx` uses
  `shouldRedirectToOnboarding`/`shouldRedirectAwayFromOnboarding`
  (`src/features/onboarding/onboarding.utils.ts`) to redirect both ways —
  verified live end-to-end with a fresh test account: login with
  `onboarding_completed_at` null redirects to `/onboarding`, completing
  the 3-step wizard persists the timestamp, and a subsequent
  login/reload does not show it again.
- `/dashboard` — Home. Real data. Daily Check-in (mood save) was broken
  end-to-end until 2026-09-08 — `src/app/api/cycle/route.ts` has written a
  `sleep` value since commit 167c48d5, but `database/cycle-sleep-
  migration.sql` (which adds that column) had never been applied to the
  live project, so every save 500'd (`PGRST204: Could not find the
  'sleep' column`). Migration applied live 2026-09-08; verified fixed
  with a live authenticated save + reload.
- `/cycle` — Real data.
- `/coach` — **Real data (corrected 2026-09-08).** This entry wrongly said
  "UI placeholder, no AI backend wired" — stale since the Coach
  Conversation Workspace V1 pass. `coach_conversations`/`coach_messages`
  persist real threaded conversations, and replies come from a real
  OpenAI call (`src/features/coach/openaiClient.ts`) scoped to the
  user's own cycle/wellbeing logs. See
  `docs/COACH_CONVERSATION_WORKSPACE.md` for the full data model and
  security posture, and the "Parked/legacy" section below for the
  different, still-parked `/ai-coach` prototype this superseded.
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
- `/pricing` — reached via the public marketing homepage's CTA. Real,
  designed plan-comparison page; "Unlock Premium" is honestly disabled
  (checkout isn't wired up — see "Not yet real" below).

## Still Parked (unreachable from primary nav, `ComingLater` if visited directly)

- `/ai-coach` (the old unauthenticated prototype; superseded by the real
  `/coach` — see "Parked/legacy" below, its files were deleted outright,
  not left parked, and a regression test guards against them reappearing)
- `/fantasy` (superseded by `/vault`, now real — see `docs/vault-v1.md`)
- `/intimacy` (superseded by `/connect`'s Explore/Boundaries/Reflections tabs)
- `/partner/intimacy`

`/pricing` was previously listed here but isn't a `ComingLater` stub — it's a
real, designed pricing page (linked from the public marketing homepage's CTA)
with plan comparison cards and an honestly-disabled "Unlock Premium" button
plus a `FeaturePlaceholder` disclosing checkout isn't wired up yet. See
Routes below.

## Parked/legacy feature code (do not delete, do not wire up as-is)

- `src/components/intimacy/*`, `src/services/intimacy/*` — per
  `docs/MVP_AUDIT.md` §11, the intimacy schema has drifted from the code that
  queries it; do not assume this still works against the live database.
- `src/components/fantasy/*`, `src/services/fantasy/*`
- `ai_coach_messages` table and its old flat Q&A shape — the real Coach
  feature uses `coach_conversations`/`coach_messages` instead (see
  `docs/COACH_CONVERSATION_WORKSPACE.md`). Note: `src/components/ai-coach/
  AICoach.tsx`, `src/hooks/useCoach.ts`, and the old unauthenticated
  `src/app/api/coach/route.ts` / `src/app/api/coach/messages/route.ts`
  this table backed were not left parked — they were deleted outright
  (see `src/app/api/coach/legacy-routes-removed.test.ts`). Only the
  table itself remains, unused.
- Stripe checkout/webhooks, advanced analytics, notifications

## Next (making the new nav real)

- Design and build real persistence for Connect's Explore/Boundaries/
  Reflections (reflection responses, boundary preferences) — do not reuse the
  drifted `src/services/intimacy/*` layer without re-auditing it first.
- Rebuild browser-level coverage for the MVP journey from
  `docs/PARKED_TEST_SCENARIOS.md`.
- Full Figma pixel-level reconciliation for Vault V1's 22 approved frames
  (see `docs/vault-v1.md` "What's deferred") — a live-authenticated smoke
  check on 2026-09-08 confirmed `/vault` and `/api/vault/sparks` work
  end-to-end against the now-applied `vault-v1-migration.sql`, but a full
  screenshot-diff pass against each frame, using a dedicated test account,
  is still needed.

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
- **Account deletion.** `DELETE /api/user` exists server-side but has no UI
  entry point anywhere (no "Delete Account" control exists in Settings or
  elsewhere) and no test coverage — found during the 2026-09-08 showcase
  audit. Left unwired deliberately rather than fixed in that pass: even if
  it were wired up today it would under-delete. It only clears legacy/
  parked tables (`intimacy_cards`, `fantasy_entries`, `ai_coach_messages`)
  plus `cycle_data`, and nulls the vestigial `users.partner_id` column
  (the real partner feature uses `partner_links`, not that column) — it
  never touches `periods`, `period_day_logs`, `vault_sparks`,
  `vault_afterglow_reflections`, any `relationship_*` table,
  `coach_conversations`/`coach_messages`, `partner_links`, or several
  others, and never deletes the `auth.users` row itself, so a real user
  could still log back in after "deletion." Do not add a Delete Account
  button that calls this route as-is; it needs a full per-table audit and
  an `auth.users` deletion path (service-role admin API — the
  `SUPABASE_SERVICE_ROLE_KEY` env var is currently a placeholder locally
  and unused in any real code path) before it does what it claims.

## Later

- Paid plan experiments, Stripe checkout and subscription management
- Email reminders and notification preferences
- Cycle prediction improvements, richer dashboard charts/trends
