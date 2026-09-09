# Stripe subscription-sync / entitlement migration — review checkpoint

Branch: `fix/stripe-subscription-sync`
Status: **NOT APPLIED** — proposal for review only. This document is the
PROPOSED LIVE CHANGE checkpoint; nothing here has been run against the live
database.

Baseline confirmed before this review:

- Branch is `fix/stripe-subscription-sync`.
- `develop` is an ancestor of HEAD (HEAD is `develop`'s tip plus the restored
  `wip: stripe subscription sync implementation` stash — the implementation
  had survived two branch rebases only because it was stashed, not committed;
  it has since been reapplied to the working tree).
- Graft rebuilt against the restored tree (417 files, 1626 nodes, 3831 edges).
- Validation on this tree: `tsc --noEmit` clean, `lint` clean, 770/770 tests
  pass, `build` succeeds.

---

## A. Revised exact subscriptions migration SQL

`database/subscriptions-entitlement-migration.sql` was reviewed line by line
against the live application code and against
`database/security-advisory-hardening-migration.sql` (already merged into
`develop`). **It is already the correct, in-place version — no further
revision was needed.** Its own header states it was already revised once
("REVISED per review... migrated IN PLACE with ALTER TABLE rather than
dropped and recreated"), and its "Live shape" claims were independently
cross-verified:

- Its claim that `authenticated`/`anon` have NO grants on `public.subscriptions`
  is confirmed by `security-advisory-hardening-migration.sql:72,142` —
  `REVOKE ALL ON TABLE public.subscriptions FROM anon` and `FROM authenticated`
  were both already applied live on 2026-09-08.
- Its claim that `public.users` already has `anon` fully revoked is confirmed
  the same way (line 51 of that same file).
- Every constraint was checked for self-consistency against the actual
  webhook code (upsert `onConflict: 'user_id'`, the lifetime/recurring
  identifier split, the status enum) — no mismatch found.

**Non-blocking observation (not a SQL change):**
`subscriptions_billing_type_identifiers_check` requires
`stripe_subscription_id IS NOT NULL` whenever `billing_type = 'recurring'`.
The webhook satisfies this at `checkout.session.completed` time by reading
`session.subscription`, which Stripe populates synchronously for
subscription-mode Checkout sessions — so this holds in practice. Flagging
only so it's a known assumption, not silently relied on.

```sql
-- Subscriptions / entitlement architecture correction
-- ============================================================
-- Prepared as part of the Stripe subscription-sync repair
-- (branch fix/stripe-subscription-sync).
--
-- NOT APPLIED. This is a proposal for review — see the chat writeup's
-- "PROPOSED LIVE CHANGE" section for the exact impact and the
-- verification plan to run after applying it.
--
-- REVISED per review: the live public.subscriptions table (confirmed
-- 0 rows, confirmed unreferenced by any application code) is migrated
-- IN PLACE with ALTER TABLE rather than dropped and recreated, to
-- preserve table identity, its existing explicit privilege posture,
-- and avoid relying on Supabase's default-privilege behavior for a
-- freshly created table. No existing column changes type — every
-- change below is either a new column, a new/replaced CHECK
-- constraint, a new UNIQUE constraint, or a grant/policy change.
--
-- Live shape this migration was written against (verified via
-- information_schema / pg_constraint / pg_indexes / pg_policies /
-- information_schema.role_table_grants immediately before writing
-- it):
--   id uuid pk default uuid_generate_v4()
--   user_id uuid not null, fk -> users(id) on delete cascade
--   stripe_customer_id text not null, unique (subscriptions_stripe_customer_id_key)
--   stripe_subscription_id text nullable, unique (subscriptions_stripe_subscription_id_key)
--   plan text not null (NO check constraint today)
--   status text not null, check subscriptions_status_check in ('active','inactive','cancelled')
--   created_at / updated_at timestamptz, default now()
--   RLS enabled, ZERO policies (default-deny)
--   grants: only postgres + service_role; authenticated/anon have NONE
--   trigger update_subscriptions_updated_at already exists — left alone
--
-- public.users.subscription_tier is NOT touched by this migration. It
-- stays as a display-only cache (src/components/layout/Sidebar.tsx's
-- "Premium Member" label), written only by the webhook's service-role
-- client, never read for API authorization anywhere. RLS protects
-- rows, not columns, so step 4 below closes the remaining
-- direct-PostgREST self-upgrade path with a column-level GRANT/REVOKE.
-- This was audited against every current direct write to public.users
-- (see the accompanying chat message's "public.users direct-write
-- audit" section) — including fixing one real conflict found during
-- that audit: src/services/auth/index.ts's createUserProfile() used a
-- plain .upsert(), which compiles to INSERT ... ON CONFLICT (id) DO
-- UPDATE SET <every column>, and Postgres requires UPDATE privilege on
-- every column in that SET clause regardless of whether a conflict
-- actually occurs. That call now passes { onConflict: "id",
-- ignoreDuplicates: true } (DO NOTHING), which needs only INSERT
-- privilege (unchanged, already granted) and is also the semantically
-- correct behavior — this fallback path must never overwrite a row
-- handle_new_auth_user()'s trigger already created.
-- ============================================================

begin;

-- 1. New columns on the existing table ---------------------------------------
-- All added as NOT NULL directly where required — the table has 0 live
-- rows, so there is nothing for a NOT NULL addition to violate and no
-- transient default is needed.
alter table public.subscriptions
  add column stripe_checkout_session_id text,
  add column stripe_payment_intent_id text,
  add column stripe_price_id text,
  add column billing_type text not null default 'recurring',
  add column current_period_end timestamptz,
  add column cancel_at_period_end boolean not null default false,
  add column grace_period_ends_at timestamptz,
  add column last_stripe_event_created_at timestamptz;

-- Drop the transient default now that the (currently empty) column has
-- been backfilled implicitly — every future row must state its
-- billing_type explicitly; there is no sensible app-wide default.
alter table public.subscriptions alter column billing_type drop default;

-- 2. Constraints ---------------------------------------------------------------
-- plan has no check today; add one.
alter table public.subscriptions
  add constraint subscriptions_plan_check check (plan in ('premium', 'vip', 'lifetime'));

alter table public.subscriptions
  add constraint subscriptions_billing_type_check check (billing_type in ('recurring', 'lifetime'));

-- Replace the old, non-Stripe-shaped status check ('active','inactive',
-- 'cancelled') with Stripe's actual subscription status enum. Uses
-- "canceled" (one L, matching Stripe), not "cancelled" — the two must
-- never coexist. Safe to replace outright: the table has 0 rows, so no
-- existing value can violate the new constraint.
alter table public.subscriptions drop constraint subscriptions_status_check;
alter table public.subscriptions
  add constraint subscriptions_status_check check (status in (
    'active', 'trialing', 'past_due', 'unpaid', 'canceled',
    'incomplete', 'incomplete_expired', 'paused'
  ));

-- Lifetime is a one-time payment, never a recurring Stripe subscription
-- object — the two identifier shapes are mutually exclusive.
alter table public.subscriptions
  add constraint subscriptions_billing_type_identifiers_check check (
    (billing_type = 'lifetime' and stripe_subscription_id is null)
    or
    (billing_type = 'recurring' and stripe_subscription_id is not null)
  );

-- One current billing record per user. Stripe remains the historical
-- billing system; a plan upgrade/downgrade or renewal upserts this
-- same row rather than inserting a new one.
alter table public.subscriptions add constraint subscriptions_user_id_key unique (user_id);

-- stripe_customer_id / stripe_subscription_id already have unique
-- constraints live (subscriptions_stripe_customer_id_key,
-- subscriptions_stripe_subscription_id_key) — left as-is. Add the same
-- protection for the two new one-time-payment identifiers.
alter table public.subscriptions
  add constraint subscriptions_stripe_checkout_session_id_key unique (stripe_checkout_session_id);
alter table public.subscriptions
  add constraint subscriptions_stripe_payment_intent_id_key unique (stripe_payment_intent_id);

-- 3. Indexes ---------------------------------------------------------------------
-- stripe_customer_id and stripe_subscription_id are already uniquely
-- indexed via their UNIQUE constraints above — no separate index
-- needed. status has no index today and the webhook's out-of-order
-- guard and any future billing/admin view will filter on it.
create index if not exists subscriptions_status_idx on public.subscriptions (status);

-- update_subscriptions_updated_at already exists live on this table —
-- no trigger change needed.

-- 4. subscriptions grants and RLS ------------------------------------------------
-- RLS is already enabled live with zero policies (default-deny). Add
-- an owner-only SELECT policy: GET /api/entitlement and every Vault
-- route's requireVaultAccess() read this table through the CALLING
-- USER's own authenticated Supabase client (authenticateRequest's
-- per-request client, built from their Bearer token) — not a
-- service-role client — so a plain RLS policy with no matching table
-- grant would still deny every read with a permission error. The
-- GRANT SELECT below is therefore required, not optional, given that
-- architecture choice (see the accompanying chat message for why a
-- service-role read was not used instead: entitlement checks happen on
-- every Vault request and should scale with normal per-user RLS
-- rather than a privileged client).
create policy "Users can view own subscription" on public.subscriptions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

grant select on public.subscriptions to authenticated;

-- Explicitly preserved, not merely left alone: authenticated/anon have
-- never had INSERT/UPDATE/DELETE on this table (confirmed via
-- information_schema.role_table_grants before writing this
-- migration), and this migration adds none. Every write to
-- subscriptions happens exclusively through the webhook's
-- service-role client, which bypasses RLS entirely. anon gets no
-- grant of any kind — there is no anonymous read or write path to
-- billing data.
revoke insert, update, delete on public.subscriptions from authenticated;
revoke all on public.subscriptions from anon;

-- service_role already has full privileges on this table today
-- (confirmed live) and this migration does not touch that.

-- 5. Webhook idempotency / ordering ledger (new table) ----------------------------
create table public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  event_created_at timestamptz not null,
  processed_at timestamptz not null default now()
);

alter table public.stripe_webhook_events enable row level security;
-- No policies: service-role-only. There is no user-facing reason to
-- expose Stripe event IDs or webhook processing metadata to anyone.

-- A brand-new table can otherwise pick up whatever default privileges
-- this Supabase project has configured for anon/authenticated on
-- public-schema tables (the exact "default-privilege surprise" this
-- review flagged for the existing subscriptions table) — revoke
-- explicitly rather than relying on RLS default-deny alone.
revoke all on public.stripe_webhook_events from authenticated, anon;

-- service_role needs to record events (INSERT) and check for
-- duplicates via the primary key (which INSERT's unique-violation path
-- already covers without a separate SELECT) — grant only what the
-- webhook actually does today.
grant insert on public.stripe_webhook_events to service_role;

-- 6. Close the column-level self-upgrade path on public.users --------------------
-- The existing RLS policy ("Users can update own profile", USING
-- auth.uid() = id) authorizes UPDATE on the caller's own ROW, but says
-- nothing about which COLUMNS — an authenticated user calling
-- PostgREST/Supabase directly (bypassing the Next.js API route
-- entirely) could otherwise still set subscription_tier on their own
-- row. Column-level GRANTs are Postgres's mechanism for that: revoke
-- the blanket UPDATE and re-grant only the columns audited (see chat
-- message) as actually written by a current authenticated-role flow:
-- PUT /api/user (name, email, privacy_settings, onboarding_completed_at,
-- tracking_enabled) and createUserProfile's now-DO-NOTHING upsert
-- (which needs no UPDATE privilege on anything, per the fix above).
--
-- partner_id, subscription_tier, created_at, and id are deliberately
-- excluded: no current flow needs UPDATE privilege on any of them (see
-- audit). subscription_tier in particular must never be
-- authenticated-writable again.
revoke update on public.users from authenticated;
grant update (
  name,
  email,
  privacy_settings,
  onboarding_completed_at,
  tracking_enabled
) on public.users to authenticated;

commit;
```

---

## B. `public.users` direct-write audit

Every `.from('users')` / `.from("users")` call site in the app (exhaustive
`grep`, not just the changed files):

| Site | Operation | Columns | Client | Compatible with migration's grant? |
|---|---|---|---|---|
| `src/lib/api/authentication.ts:56` | SELECT | `*` (own row) | authenticated (per-request) | Yes — read-only, untouched by this migration |
| `src/services/auth/index.ts:206` (`loadOrCreateUserProfile`) | SELECT | `*` (own row) | authenticated | Yes — read-only |
| `src/services/auth/index.ts:193` (`createUserProfile`) | `upsert(..., {onConflict:"id", ignoreDuplicates:true})` → `INSERT ... ON CONFLICT DO NOTHING` | all (insert only) | authenticated | Yes — needs INSERT only, not UPDATE. This is the fix the migration's own header describes already having made. |
| `src/app/api/user/route.ts:14` (GET) | SELECT | `*` (own row) | authenticated | Yes |
| `src/app/api/user/route.ts:120` (PUT) | UPDATE | `name, email, privacy_settings, onboarding_completed_at, tracking_enabled` (own row) | authenticated | **Exact match** to the migration's granted column list |
| `src/app/api/user/route.ts:147` (DELETE step 1) | SELECT | `partner_id` (own row) | authenticated | Yes — read-only |
| `src/app/api/user/route.ts:155` (DELETE step 2) | UPDATE | `partner_id` — **on the partner's row**, `id = userData.partner_id`, not the caller | authenticated | See finding below |
| `src/app/api/user/route.ts:183` (DELETE step 3) | DELETE | own row | authenticated | Yes — DELETE grant untouched by this migration |
| `src/app/api/webhooks/stripe/route.ts:385` (`syncUserDisplayTier`) | UPDATE | `subscription_tier` | **service_role** | Yes — service_role bypasses RLS and column grants; unaffected |

**Finding (pre-existing, not caused by this migration):** the DELETE
handler's partner-unlink step (`route.ts:155`) targets a row where
`id ≠ auth.uid()`. The existing RLS policy (`auth.uid() = id`) already
blocks this today — it's a silent 0-row no-op, and the call's result is
never checked (no `error` destructured). After this migration, the same
call additionally fails on a column-privilege basis (`partner_id` isn't in
the granted list), but since the error was already being swallowed, **the
user-visible behavior doesn't change**: this partner-unlink step doesn't
work today and won't work after the migration either. Not fixed as part of
this change (would need a service-role client or a `SECURITY DEFINER` RPC)
— flagged so it's a known, not newly-introduced, gap.

**Conclusion:** exactly one authenticated-role write path touches
`public.users` columns (`PUT /api/user`), and it matches the migration's
granted column set exactly. `subscription_tier` has no authenticated-role
write path anywhere in the app.

---

## C. Resulting grants matrix

| Role | `public.subscriptions` | `public.stripe_webhook_events` | `public.users` |
|---|---|---|---|
| `postgres` (owner) | ALL (unchanged) | ALL | ALL (unchanged) |
| `service_role` | ALL (unchanged, already full) | **INSERT only** (new; no SELECT/UPDATE/DELETE — none needed) | ALL (unchanged) |
| `authenticated` | **SELECT only** (new, RLS-scoped to `auth.uid() = user_id`) | **NONE** (explicit revoke) | SELECT (unchanged) + **UPDATE limited to** `name, email, privacy_settings, onboarding_completed_at, tracking_enabled` (narrowed from all-columns) + INSERT (unchanged, `createUserProfile`'s DO-NOTHING) + DELETE (unchanged, own-row account deletion) |
| `anon` | NONE (already revoked live, reconfirmed) | **NONE** (explicit revoke) | NONE (already revoked live) |

---

## D. `past_due` grace-period semantics

- **Duration:** 7 days (`PAST_DUE_GRACE_PERIOD_MS`, `src/lib/entitlement/index.ts`).
- **Entitled while:** `now < grace_period_ends_at`. `past_due` with
  `grace_period_ends_at = null` is fail-closed (not entitled) — defensive,
  shouldn't occur since the webhook always sets it on the transition.
- **Deadline anchor:** the Stripe event's own `created` timestamp (not
  server-receive time), from the event that *first* transitions status into
  `past_due`.
- **No extension on repeat events:** if already `past_due` and another
  `past_due` event arrives (Stripe's dunning retries fire multiple
  `customer.subscription.updated` events), the existing
  `grace_period_ends_at` is preserved — never pushed out. Prevents
  indefinite grace via webhook retries.
- **Reset on recovery:** any non-`past_due` status clears
  `grace_period_ends_at` to null.
- **Fresh window on re-entry:** a *later*, separate `past_due` episode
  (after a prior recovery) gets a new full 7-day window, since
  `previousStatus` is no longer `past_due` at that point.
- Fully covered by `computeGracePeriodEndsAt()` (webhook) and unit-tested
  end-to-end in the "GRACE RECOVERY" webhook test plus 3 dedicated
  `computeEntitlement` grace-boundary tests.

---

## E. Duplicate / out-of-order webhook semantics

- **Idempotency:** every POST first attempts
  `INSERT INTO stripe_webhook_events (event_id, ...)`, PK'd on Stripe's
  `event.id`, *before* any switch/case handling. A unique-violation
  (`23505`) → `200 {received:true, duplicate:true}`, zero mutation. Covers
  Stripe's at-least-once delivery and manual dashboard retries.
- **Out-of-order:** `isStaleEvent()` compares the incoming event's `created`
  timestamp against `last_stripe_event_created_at` already stored on the
  row; `>=` (a tie also counts stale) → dropped, logged, no mutation.
  Applies to `handleSubscriptionUpdated`/`handleSubscriptionDeleted` (both
  look up the existing row by customer id first); `handleCheckoutSessionCompleted`
  has no staleness check since it establishes the row.
- These two guards are independent and complementary: the ledger stops the
  *same* event being applied twice; the timestamp stops a *different,
  older* event from clobbering newer state when Stripe delivers out of
  sequence.
- Tested explicitly: "DUPLICATE EVENT" and "OLDER OUT-OF-ORDER EVENT" cases
  in `route.test.ts`.

---

## F. Test coverage of the migration's assumptions

| Area | Coverage |
|---|---|
| Entitlement decision matrix | `src/lib/entitlement/index.test.ts` — 15 cases: every `BillingStatus` branch, lifetime edge cases, grace boundary (inside/outside/missing → fail-closed), `cancel_at_period_end` nuance |
| Webhook idempotency/ordering/grace | `src/app/api/webhooks/stripe/route.test.ts` — 10 cases (signature verification, duplicate short-circuit, subscription + lifetime checkout, past_due grace-set, out-of-order drop, cancellation, full grace-recovery cycle) |
| Entitlement route | `src/app/api/entitlement/route.test.ts` — auth required, FREE/PREMIUM scoped to caller |
| Vault gating, all 13 routes | Each has a test asserting `requireVaultAccess` is called with the **caller's own** id and blocks before any Vault mutation/RPC |
| **"Free partner doesn't inherit Premium"** | `src/app/api/vault/partner/route.test.ts` — explicit test: *"FREE: denies viewing the partner's Vault summary — entitlement is evaluated against the CALLING user, not whichever partner may be Premium"* |
| Checkout | `src/app/api/checkout/route.test.ts` — 8 cases (auth required, server-owned userId, plan allow-list, price lookup, lifetime mode, missing-price 500, customer reuse) |
| **"subscription_tier not client-writable"** | `src/app/api/user/route.test.ts` — explicit tests F: *"cannot self-upgrade — subscriptionTier is not a recognized field... never written"*, including alongside a legitimate field |

**Gap identified:** no test exercises the migration SQL itself against a
real/ephemeral Postgres (constraints, grants, RLS actually behaving as
written once applied). This is consistent with every other migration in
`database/` — none have DB-level automated tests — so it's not a new gap
this migration introduces, but worth a manual verification pass
(`information_schema.role_table_grants`, a same-row-owner vs. cross-row RLS
probe) immediately after applying, before declaring it done.

---

**This migration has not been applied.** Reviewer sign-off required on A–F
before any live database change.
