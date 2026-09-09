# Stripe subscription-sync / entitlement migration — review checkpoint

Branch: `fix/stripe-subscription-sync`
Status: **NOT APPLIED** — proposal for review only. This document is the
PROPOSED LIVE CHANGE checkpoint; nothing here has been run against the live
database.

This document now covers two review rounds. Round 1 (below) is kept as
written, with one correction noted inline. Round 2 — the corrected ledger
design, grants, invariants, ordering fix, reconciled test count, commit SHA,
and final validation — is appended at the bottom under "Round 2".

Baseline confirmed before round 1:

- Branch is `fix/stripe-subscription-sync`.
- `develop` is an ancestor of HEAD (HEAD is `develop`'s tip plus the restored
  `wip: stripe subscription sync implementation` stash — the implementation
  had survived two branch rebases only because it was stashed, not committed;
  it has since been reapplied to the working tree).
- Graft rebuilt against the restored tree (417 files, 1626 nodes, 3831 edges).
- Validation on this tree: `tsc --noEmit` clean, `lint` clean, `build`
  succeeds. **Correction:** the "770/770 tests pass" claim originally made
  here was wrong — that number came from a run against `develop`, before the
  Stripe stash was ever applied, mistakenly attributed to this branch's tree.
  This branch was never actually test-run at that point. See "Round 2 → G"
  for the reconciled, freshly-verified counts (813/813 on this branch as of
  round 2).

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

---
---

# Round 2

Second review pass. Six issues were raised against round 1; all six are
addressed below. **Still not applied.**

## A. Corrected webhook ledger design

`stripe_webhook_events` is now an explicit claim/outcome state machine
instead of an existence-implies-success table:

```sql
create table public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  event_created_at timestamptz not null,
  status text not null default 'processing' check (status in ('processing', 'processed', 'failed')),
  started_at timestamptz not null default now(),
  processed_at timestamptz,
  constraint stripe_webhook_events_processed_at_matches_status check (
    (status = 'processed') = (processed_at is not null)
  )
);
```

`processed_at` can be non-null **iff** `status = 'processed'` — enforced
structurally, not just by convention, so the application can't accidentally
mark something processed without a timestamp or vice versa.

## B. Retry/failure semantics

Implemented in `src/app/api/webhooks/stripe/route.ts` as `claimEvent` →
process → `markProcessed`/`markFailed`:

| Case | Behavior |
|---|---|
| **New event** | `INSERT` claims it (`status='processing'`). Proceeds to process. |
| **Processing succeeds** | `markProcessed` sets `status='processed', processed_at=now()`. Returns 200. |
| **Processing throws** | Outer `catch` calls `markFailed` (`status='failed'`, `processed_at` stays null), returns **500**. Stripe's own retry schedule will redeliver the same `event_id`. |
| **Retry of a `failed` event** | Claim conflicts (unique violation) → reads the row → `status='failed'` → compare-and-swap `UPDATE ... WHERE status='failed'` reclaims it → processes again. |
| **Retry of a `processed` event** | Claim conflicts → `status='processed'` → `200 {duplicate:true}`, zero mutation, no reclaim attempted. |
| **Concurrent duplicate (still processing)** | Claim conflicts → `status='processing'` and `started_at` is recent (< 60s) → treated as genuinely in-flight → `200 {duplicate:true}`, **no reclaim attempted, no mutation**. |
| **Orphaned claim (crashed before finalizing)** | Claim conflicts → `status='processing'` and `started_at` is older than 60s → treated as abandoned → CAS-reclaimed and reprocessed. |
| **Lost reclaim race** | Two requests both try to reclaim the same `failed`/orphaned row; the CAS `UPDATE ... WHERE status = <expected>` lets exactly one succeed (Postgres serializes the row-level update), the other sees 0 rows affected and backs off as a duplicate. |

Every `upsertSubscription`/`syncUserDisplayTier`/lookup call now **throws**
on a DB error instead of `console.error`-and-return — nothing that fails to
complete its mutation can reach `markProcessed`. This includes the "no
existing row yet" and "unrecognized status/price" guards, which used to
silently no-op: they're now failures too, since those are exactly the cases
where the intended mutation didn't happen (an out-of-order
`customer.subscription.updated` arriving before `checkout.session.completed`,
for instance, can now succeed on Stripe's automatic retry instead of being
lost forever).

**Tests added** (`src/app/api/webhooks/stripe/route.test.ts`, new
`describe("ledger claim/retry/duplicate semantics")` block): `FAIL AFTER
LEDGER CLAIM` (two-phase — first delivery fails and returns 500 with the row
marked `failed`; the retry then reclaims and succeeds), `PROCESSED DUPLICATE`
(no mutation, no reclaim attempted), `CONCURRENT DUPLICATE` (recent claim, no
reclaim, no mutation), `ORPHANED CLAIM` (stale claim, reclaimed and
processed), `LOST RECLAIM RACE` (0-row CAS result backs off correctly).

## C. Corrected event-ordering semantics

`handleCheckoutSessionCompleted` now looks up any existing row **by
`user_id`** (the identifier it always has, unlike `stripe_customer_id` which
it's often the one *establishing*) and applies the exact same `isStaleEvent`
guard the subscription-update/delete handlers already used. Chose **option
A** (one consistent model) over option B: a resubscribing user reuses their
existing Stripe customer id (`POST /api/checkout`'s "reuse the caller's
existing Stripe customer" behavior), so a newer `customer.subscription.updated`
for that same resubscription can legitimately reach the row before this
older `checkout.session.completed` does — proving "checkout only fills
non-regressing fields" wasn't available since checkout writes
`status`/`current_period_end` unconditionally.

A stale checkout event is skipped (not applied) and still marked `processed`
— it's a deliberate, correct no-op, not a failure.

**Test added:** `NEWER SUBSCRIPTION EVENT then OLDER CHECKOUT COMPLETED` —
seeds an existing row with a newer `last_stripe_event_created_at` than the
incoming checkout event; asserts `upsert` is never called and the event is
still marked `processed`.

## D. Revised exact migration SQL

The full, current file (`database/subscriptions-entitlement-migration.sql`,
committed at `07f88f91`):

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
-- REVISED (round 2) per a second review pass: three corrections beyond
-- round 1 — (a) stripe_webhook_events is now an explicit
-- processing/processed/failed state machine, not a bare
-- existence-implies-success ledger, because a request that claimed an
-- event and then failed mid-processing must remain retryable, not get
-- silently acknowledged on Stripe's retry; (b) its grants now start
-- from an explicit REVOKE ALL against anon/authenticated/service_role
-- before granting service_role exactly SELECT/INSERT/UPDATE, because
-- this project's pg_default_acl grants new public tables default
-- privileges to all three roles — a bare GRANT INSERT does not narrow
-- an already-broader default; (c) subscriptions_billing_type_identifiers_check
-- is replaced with subscriptions_billing_shape_check, which also pins
-- plan to the correct value per billing_type (round 1 still permitted
-- lifetime+premium, lifetime+vip, and recurring+lifetime), and
-- stripe_price_id is now NOT NULL. See the matching route.ts changes
-- in the same commit for the claim/process/finalize algorithm and the
-- checkout.session.completed ordering fix these grants and
-- constraints exist to support.
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

-- The full cross-column billing shape, replacing the narrower
-- identifiers-only check from the first review round. subscriptions_plan_check
-- (above) still independently bounds plan to the 3-value domain; this
-- constraint additionally forbids the combinations that check alone can't
-- rule out — lifetime+premium, lifetime+vip, recurring+lifetime — leaving
-- exactly two legal shapes:
--   lifetime:  billing_type='lifetime' AND plan='lifetime'          AND stripe_subscription_id IS NULL
--   recurring: billing_type='recurring' AND plan IN ('premium','vip') AND stripe_subscription_id IS NOT NULL
alter table public.subscriptions
  add constraint subscriptions_billing_shape_check check (
    (billing_type = 'lifetime' and plan = 'lifetime' and stripe_subscription_id is null)
    or
    (billing_type = 'recurring' and plan in ('premium', 'vip') and stripe_subscription_id is not null)
  );

-- stripe_price_id: traced every write path that can create or carry
-- forward a subscriptions row (handleCheckoutSessionCompleted,
-- handleSubscriptionUpdated, handleSubscriptionDeleted in
-- src/app/api/webhooks/stripe/route.ts). Every one of them either
-- supplies a real price id or refuses to write at all:
--   - checkout's own route (POST /api/checkout) already 500s before
--     ever creating a Stripe Checkout Session if priceIdForPlan()
--     returns null for the requested plan — an unconfigured price
--     never reaches Stripe, so a checkout.session.completed event
--     can only exist for a plan whose price was configured.
--   - handleSubscriptionUpdated bails out with no upsert at all if
--     planForPriceId() can't map the event's price back to a plan
--     (see "unrecognized price" — never writes a null-priced row).
--   - handleSubscriptionDeleted only ever carries forward an
--     existing row's stripe_price_id, which by the two points above
--     was already guaranteed non-null.
-- The one gap: nothing stops the webhook's OWN checkout upsert from
-- writing null if STRIPE_PRICE_* were removed from the environment in
-- the narrow window between session creation and webhook delivery —
-- the app-level guard added in the same commit as this migration
-- closes that (throws before attempting the upsert), and this NOT
-- NULL is the DB-level backstop: on the 0-row table it applies
-- instantly; against any future non-empty state it would reject a
-- write missing a price id rather than silently persisting one.
alter table public.subscriptions alter column stripe_price_id set not null;

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

-- 5. Webhook idempotency / ordering / retry ledger (new table) --------------------
-- REVISED per second review round: the first draft treated "a row exists
-- for this event_id" as "successfully processed," so a request that
-- claimed the event and then failed mid-processing (a transient DB error,
-- a thrown exception) left the ledger permanently believing the event was
-- handled — Stripe's retry of that exact event_id would hit the
-- unique-violation path and get acknowledged with 200, and the billing
-- mutation that never happened would never be attempted again. Seeing an
-- event is not the same as successfully processing it. status turns the
-- ledger into an explicit claim/outcome state machine instead of a bare
-- existence check:
--   processing — claimed, currently (or was, if orphaned) being handled
--   processed  — the required billing mutation(s) committed successfully
--   failed     — processing was attempted and did not complete; safe, and
--                expected, to be retried
create table public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  event_created_at timestamptz not null,
  status text not null default 'processing' check (status in ('processing', 'processed', 'failed')),
  started_at timestamptz not null default now(),
  processed_at timestamptz,
  -- Structural enforcement of "mark processed only after the mutation
  -- succeeds": processed_at can be non-null if and only if status is
  -- 'processed' — the application can't accidentally set one without
  -- the other.
  constraint stripe_webhook_events_processed_at_matches_status check (
    (status = 'processed') = (processed_at is not null)
  )
);

-- The app's own reclaim query (an orphaned 'processing' row whose claim
-- looks abandoned — see src/app/api/webhooks/stripe/route.ts) filters on
-- status; a future admin/ops view listing failed events would too.
create index if not exists stripe_webhook_events_status_idx on public.stripe_webhook_events (status);

alter table public.stripe_webhook_events enable row level security;
-- No policies: service-role-only. There is no user-facing reason to
-- expose Stripe event IDs or webhook processing metadata to anyone.

-- CORRECTED per second review round: this project's pg_default_acl
-- grants new public-schema tables default privileges to anon,
-- authenticated, AND service_role — so the first draft's
-- `grant insert ... to service_role` only ADDED to whatever broader
-- default service_role already silently had; it never actually
-- narrowed service_role to insert-only, and said nothing about
-- anon/authenticated at all for this specific table beyond relying on
-- RLS default-deny. Revoke everything from all three roles first, then
-- grant back exactly what the redesigned claim/process/finalize
-- algorithm needs.
revoke all on public.stripe_webhook_events from anon, authenticated, service_role;

-- service_role's algorithm (see the webhook route) needs:
--   INSERT  — claim a brand-new event_id
--   SELECT  — on a claim conflict, read the existing row's status/started_at
--             to decide duplicate-skip vs. reclaim-and-retry
--   UPDATE  — reclaim a 'failed' or stale-orphaned 'processing' row, and
--             finalize a claimed row to 'processed' or 'failed'
-- No DELETE: nothing in the app removes ledger rows; retention/cleanup is
-- a separate, not-yet-built operational concern.
grant select, insert, update on public.stripe_webhook_events to service_role;

-- anon / authenticated: NONE. Nothing in the app reads or writes this
-- table except the webhook's service-role client, and there is no
-- user-facing reason to expose Stripe event IDs or processing state.

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

## E. Corrected grants matrix

| Role | `public.subscriptions` | `public.stripe_webhook_events` | `public.users` |
|---|---|---|---|
| `postgres` (owner) | ALL | ALL | ALL |
| `service_role` | ALL (unchanged) | **REVOKE ALL, then SELECT + INSERT + UPDATE only** (no DELETE) | ALL (unchanged) |
| `authenticated` | SELECT only (RLS-scoped) | **NONE** (explicit `REVOKE ALL`, not inherited default) | SELECT + UPDATE limited to 5 named columns + INSERT + DELETE |
| `anon` | NONE | **NONE** (explicit `REVOKE ALL`, not inherited default) | NONE |

The change from round 1: `stripe_webhook_events` no longer relies on a bare
`GRANT INSERT` to *imply* narrowing — it's `REVOKE ALL FROM anon,
authenticated, service_role` first, so the grant list that follows is the
complete, exact privilege set for every role, not an addition on top of an
unknown default.

## F. Tightened DB invariants

- `subscriptions_billing_shape_check` replaces
  `subscriptions_billing_type_identifiers_check` — now rejects
  `lifetime+premium`, `lifetime+vip`, and `recurring+lifetime`, leaving
  exactly the two legal shapes.
- `stripe_price_id` is now `NOT NULL`. Traced every write path (see the SQL
  comment in D) — every legitimate event supplies one; the only gap was the
  webhook's own missing defensive check for a mid-flight config removal,
  which was added (`handleCheckoutSessionCompleted` now throws before the
  upsert if `priceIdForPlan` returns null, mirroring what `POST
  /api/checkout` already does).

## G. Reconciled test-count report

The round-1 checkpoint's "770/770, ran earlier in this session against this
exact tree" claim was wrong. That run was actually against `develop`, before
the Stripe stash was ever applied, and the number was mistakenly attributed
to this branch's tree in the checkpoint. This branch had not actually been
test-run at that point.

Freshly measured:

| | Test files | Test cases |
|---|---|---|
| `develop` (`git ls-tree`, no checkout needed) | 101 | 770 |
| `fix/stripe-subscription-sync`, pre-round-2 (stash as originally restored) | 104 | 808 |
| `fix/stripe-subscription-sync`, post-round-2 (current, committed) | 104 | **813** |

**Added Stripe/entitlement test files** (present on this branch, absent from
`develop`): `src/lib/entitlement/index.test.ts`,
`src/app/api/entitlement/route.test.ts`,
`src/app/api/webhooks/stripe/route.test.ts`.

**Removed/missing test files:** none. A `comm` diff between the two
branches' file lists in both directions confirms every file `develop` has,
this branch also has — the +3 files are pure additions.

**Why the count changed:** the 3 new files above account for most of the +38
over develop's 770; the rest comes from small additions inside *existing*
files that already had Vault/checkout/user route tests (new
`requireVaultAccess` mock wiring and assertions in each of the 13 Vault
route test files, plus new cases in `checkout/route.test.ts` and
`user/route.test.ts`). Round 2 added 6 new cases to the webhook test file's
ledger-semantics coverage and removed 1 (the old imprecise "DUPLICATE EVENT"
test, superseded by the more precise "PROCESSED DUPLICATE" test), net +5,
landing at 813.

On the "807" figure raised in review: no such claim was made in this
session, so its origin can't be traced from here — but it's within one of
the actual, freshly-measured 808 pre-round-2 figure, suggesting it's a real
number from wherever it came from, not a fabricated one. The 770 claim, by
contrast, was simply incorrect. Treat 813 (current, verified in I below) as
ground truth going forward.

## H. Final commit SHA

`07f88f9117fd22cb508475dc46bc12f8d27c1846` on `fix/stripe-subscription-sync`,
pushed to `origin/fix/stripe-subscription-sync`.

## I. Final validation results

- `npx tsc --noEmit` — clean
- `npm run lint` — clean (2 pre-existing warnings, unrelated: `layout.tsx`
  custom-font, `Avatar.tsx` `<img>`)
- `npm test` — **813/813 passed**, 104 files
- `npm run build` — succeeds

`git status`: clean except `.claude/`, `.mcp.json`, `.ignore` — untracked,
personal/machine-specific tooling config (the `.mcp.json` embeds this
account's Supabase project ref; `.claude/settings.json` has this machine's
absolute paths) that got swept into the original `git stash -u` alongside
the real implementation. Deliberately excluded from this commit — not part
of "the Stripe implementation, tests and migration," and not this review's
call to make about whether they belong in the repo at all. Left exactly as
found.

**Item 7 (account-delete finding):** recorded in round 1 (section B above),
not touched. Not fixed inside this Stripe change. Follow-up: use Graft later
to check whether `partner_id` on `public.users` is now obsolete given
`partner_links` is canonical — if so the right fix is likely removing the
dead unlink attempt, not repairing it.

## J. PROPOSED LIVE CHANGE checkpoint

Migration SQL: section D above (full file in
`database/subscriptions-entitlement-migration.sql`, commit `07f88f91`).

**This migration has NOT been applied.** All four required behaviors (new
event → claim → process → mark processed only after success; processing
failure → mark failed → non-2xx; retry of failed → reprocessable; retry of
processed → no-op; concurrent duplicate → no double mutation) are
implemented and covered by passing tests, run against the code as
committed. Grants for all three tables are explicit and start from a full
revoke. The plan/billing_type/subscription_id invariant now admits exactly
two shapes.

**Stopping here per instruction — no live DDL executed.**

---
---

# Round 3 — Forward Fix

**IMPORTANT DISCOVERY that motivates this round:** a checkpoint audit found
that Round 2's `database/subscriptions-entitlement-migration.sql` was never
applied, but an EARLIER draft of that same migration — "Round 1" — WAS
applied live, recorded as Supabase migration
`20260909060545_subscriptions_entitlement_correction`, before Round 2's own
corrections (the claim/outcome ledger state machine, the stricter billing
shape check, `stripe_price_id NOT NULL`, the `stripe_webhook_events` grant
narrowing) were ever written. Round 2's file assumes a pristine
pre-migration schema, so re-running it now fails outright (it re-creates
`stripe_webhook_events` and re-adds columns that already exist). This round
introduces a NEW migration,
`database/subscriptions-entitlement-forward-fix-migration.sql`, that evolves
the ACTUAL live (Round-1) schema forward, plus three further findings from
that same audit and one design addition (claim-token ownership).

Round 1 and Round 2 above are kept exactly as written — nothing in this
section rewrites them. **Still not applied.**

## A. Confirmed live starting schema (read-only, immediately before writing the forward-fix)

- `public.subscriptions` — 0 rows. Every Round-1/Round-2-shared column
  already present (`stripe_price_id` nullable, `billing_type` NOT NULL with
  no default, etc.). Constraint is `subscriptions_billing_type_identifiers_check`
  (Round-1's looser shape — still permits `lifetime+premium`, `lifetime+vip`,
  `recurring+lifetime`), not `subscriptions_billing_shape_check`. Grants/RLS
  already match the final target (`authenticated` SELECT-only via the
  owner-scoped RLS policy, `anon` nothing, `service_role` unchanged) — not
  touched by the forward fix.
- `public.stripe_webhook_events` — 0 rows. Only 4 columns live: `event_id`
  (PK), `event_type`, `event_created_at`, `processed_at` (NOT NULL DEFAULT
  now()) — the Round-1 existence-implies-success shape. No `status`,
  `started_at`, or `claim_token`; no CHECK tying `processed_at` to status.
  `service_role` holds unrestricted `ALL PRIVILEGES` (Round-1's exact
  flagged under-narrowing bug). `anon`/`authenticated` already have
  nothing.
- `public.users` — UPDATE already correctly narrowed live (Round 1's
  column-level grant to `name, email, privacy_settings,
  onboarding_completed_at, tracking_enabled`). INSERT was never touched by
  any prior migration: `authenticated` holds full-column INSERT, including
  `subscription_tier` — confirmed via `information_schema.role_column_grants`.
  RLS INSERT/UPDATE policies (`auth.uid() = id`) restrict row ownership
  only, never columns — confirmed via `pg_policies`.

Live state matched the prior checkpoint exactly — nothing had drifted since,
so no stop-and-report was needed before implementing.

## B. Why Round 2's file cannot be applied directly

It targets a pristine pre-migration schema: `CREATE TABLE
public.stripe_webhook_events` (already exists), `ALTER TABLE
public.subscriptions ADD COLUMN stripe_checkout_session_id ...` etc. (already
added by the live Round-1 apply). Running it now errors immediately on the
first conflicting statement. The forward-fix migration instead only issues
statements that are valid against the schema in section A.

## C. Forward-fix migration — exact SQL

Full file: `database/subscriptions-entitlement-forward-fix-migration.sql`.
Three parts: (1) swap `subscriptions_billing_type_identifiers_check` for the
stricter `subscriptions_billing_shape_check` and set `stripe_price_id NOT
NULL`; (2) evolve `stripe_webhook_events` in place — add `status`,
`started_at`, `claim_token uuid not null`, drop `processed_at`'s NOT
NULL/default, add the `processed_at ⇔ status='processed'` CHECK, add the
status index, and re-narrow `service_role`'s grant via an explicit `REVOKE
ALL` first; (3) `REVOKE INSERT ... GRANT INSERT (id, email, name,
created_at, privacy_settings, tracking_enabled)` on `public.users` for
`authenticated`, excluding `subscription_tier`. See the file itself for the
full annotated SQL and the audit trail behind each column list.

## D. Final `subscriptions` constraints/nullability

- `subscriptions_billing_shape_check`: exactly two legal shapes —
  `lifetime` (`plan='lifetime'`, `stripe_subscription_id IS NULL`) or
  `recurring` (`plan IN ('premium','vip')`, `stripe_subscription_id IS NOT NULL`).
- `stripe_price_id`: `NOT NULL` (was nullable).
- Everything else (plan/status/billing_type checks, unique keys, the
  owner-SELECT RLS policy, grants) — unchanged, already correct live.

## E. Final `stripe_webhook_events` schema

```
event_id           text primary key
event_type         text not null
event_created_at   timestamptz not null
status             text not null default 'processing' check (status in ('processing','processed','failed'))
started_at         timestamptz not null default now()
claim_token        uuid not null                 -- new in this round
processed_at       timestamptz null              -- was NOT NULL DEFAULT now()
constraint stripe_webhook_events_processed_at_matches_status check ((status = 'processed') = (processed_at is not null))
```
Grants after the fix: `service_role` → `SELECT, INSERT, UPDATE` only (no
DELETE), via an explicit `REVOKE ALL` first (this project's
`pg_default_acl` hands new tables default privileges to all three roles, so
a bare additive `GRANT` never narrows that — the exact bug Round 1 shipped
with). `anon`/`authenticated` → none.

## F. Claim-token ownership algorithm

`claimEvent` now returns `{ outcome: 'duplicate' }` or `{ outcome: 'claimed',
claimToken }` — every fresh claim and every reclaim (from `'failed'` or a
stale `'processing'` row) mints a brand-new `claimToken` via
`randomUUID()`. `markProcessed(eventId, claimToken)` and
`markFailed(eventId, claimToken)` finalize with `UPDATE ... WHERE event_id =
? AND claim_token = ?` — a stale claimant's token no longer matches once a
reclaim has replaced it, so the CAS affects 0 rows. Both finalize functions
return `'finalized' | 'lost_ownership'` explicitly rather than assuming a
0-row update means success; the POST handler branches on this: on
`'lost_ownership'` it logs a distinct warning and responds success (200)
without forcing an extra Stripe retry, since (a) the mutation this request
already performed is safe to have run (see G) and (b) the reclaiming
attempt's own response is what should drive any further retry. A DB error
(as opposed to a clean 0-row CAS miss) inside `markFailed` is treated as
`'finalized'`, preserving the original best-effort semantics of that path —
ownership status is genuinely unknown on a transient error, not lost.
Implemented in `src/app/api/webhooks/stripe/route.ts`
(`claimEvent`/`tryReclaim`/`markProcessed`/`markFailed`).

## G. Final webhook ordering/reconciliation algorithm

Replaced the `>=`-based `isStaleEvent()` timestamp guard entirely — deleted,
not patched, because a `>` fix (as first proposed) still doesn't produce a
total order across events sharing a timestamp, and this repo's own review
called that out as an incomplete fix. Instead,
`reconcileSubscriptionFromStripe()` is now the single source of every
subscription-lifecycle write: for `customer.subscription.created/updated/
deleted` AND for `checkout.session.completed`'s subscription-mode branch, it
calls `stripe.subscriptions.retrieve(subscriptionId)` and writes THAT
object's status/price/period/cancel-flag — never the triggering event's own
embedded payload. A delivery that is old, retried, or ties another event's
timestamp still converges to the same current Stripe truth a "new" delivery
would, so it can never regress canonical state, with no ordering heuristic
needed at all. Canceled subscriptions remain retrievable from Stripe
indefinitely in their terminal state, so `customer.subscription.deleted`
uses this exact same path rather than a separate handler — no special-case
terminal-event rule was needed. `last_stripe_event_created_at` is still
written on every upsert for observability, just no longer read back as a
gate.

## H. Checkout responsibility after the fix

`checkout.session.completed` (subscription mode) now only ESTABLISHES the
customer↔user↔checkout-session linkage (and creates the row for a
brand-new customer); it calls the same `reconcileSubscriptionFromStripe()`
lifecycle events use, supplying `newRowUserId`/`newCheckoutSessionId` only.
It no longer authoritatively writes `status`/`current_period_end`/
`cancel_at_period_end`/grace state itself — those always come from the
retrieved subscription, so checkout can never regress a more current
lifecycle write, regardless of delivery order. Lifetime (payment mode) is
unchanged: there is no ongoing Stripe subscription object for a one-time
payment to reconcile against, so checkout remains the sole and permanent
source of truth there, as it always was.

## I. `public.users` INSERT/UPDATE grants matrix (final)

| | INSERT | UPDATE |
|---|---|---|
| `authenticated` | `id, email, name, created_at, privacy_settings, tracking_enabled` | `name, email, privacy_settings, onboarding_completed_at, tracking_enabled` |
| `subscription_tier` | **excluded** (new in this round) | excluded (Round 1) |
| `anon` | none | none |
| `service_role` | unchanged (ALL) | unchanged (ALL) |

## J. Proof `subscription_tier` is structurally non-writable by authenticated users

- **INSERT:** the forward-fix migration's `REVOKE INSERT ... GRANT INSERT
  (6 named columns)` excludes it — a direct PostgREST INSERT naming it now
  fails on column privilege, not merely on the app never sending it.
- **UPDATE:** already excluded live since the Round-1 apply (unchanged by
  this round).
- **App-level, belt-and-suspenders:** `createUserProfile()`'s payload
  (`toProfileInsertPayload` in `src/services/auth/index.ts`) explicitly
  omits `subscription_tier` before calling `.upsert()` — it no longer sends
  `'free'` even though that's what `buildUserRecord()`'s in-memory read
  model reports. `UserProfileInsert` (`src/types/auth.ts`) is `Omit<UserRecord,
  "subscription_tier">`, a distinct type from the read-model `UserRecord`
  so the trust boundary is explicit at the type level, not just by
  convention. Covered by
  `src/services/auth/profileSchemaContract.test.ts`'s new
  `UserProfileInsert schema contract` block and by an assertion added to
  `src/services/auth/index.test.ts`'s existing "creates a missing profile"
  test that inspects the actual `.upsert()` call payload.
- `PUT /api/user`'s allowlist (unchanged, already excluded it) remains the
  only other write surface.

## K. Test files/cases added

- `src/app/api/webhooks/stripe/route.test.ts` — 19 cases (was 14):
  rewrote every subscription-lifecycle test to mock
  `stripe.subscriptions.retrieve` as the source of truth instead of trusting
  event payloads; replaced the two old staleness-skip tests ("OLDER
  OUT-OF-ORDER EVENT", "NEWER SUBSCRIPTION EVENT then OLDER CHECKOUT
  COMPLETED") with "OLDER EVENT AFTER NEWER STATE", "EQUAL-SECOND DISTINCT
  EVENTS", and "CHECKOUT CANNOT REGRESS"; added "CURRENT OWNER CAN MARK
  PROCESSED", "CURRENT OWNER CAN MARK FAILED", "STALE OWNER CANNOT MARK
  PROCESSED AFTER RECLAIM", and "STALE OWNER CANNOT MARK FAILED AFTER
  RECLAIM".
- `src/services/auth/profileSchemaContract.test.ts` — +1 case (new
  `UserProfileInsert schema contract` describe block, plus a compile-time
  assertion that `UserProfileInsert` excludes `subscription_tier`).
- `src/services/auth/index.test.ts` — same 15 cases, two strengthened:
  "restores an existing session and profile" now asserts `upsert` is never
  called (existing profile not overwritten); "creates a missing profile for
  an authenticated user" now asserts the actual `.upsert()` payload omits
  `subscription_tier`.

Net: 104 test files (unchanged), **819 cases** (was 813, +6).

## L. Full validation results

- `npx tsc --noEmit` — clean
- `npm run lint` — clean (the same 2 pre-existing, unrelated warnings:
  `layout.tsx` custom-font, `Avatar.tsx` `<img>`)
- `npm test` — **819/819 passed**, 104 files, 0 failed, 0 skipped
- `npm run build` — succeeds

## M. Files changed

- `database/subscriptions-entitlement-forward-fix-migration.sql` (new)
- `src/app/api/webhooks/stripe/route.ts` (claim-token ownership,
  Stripe-truth reconciliation, narrowed checkout responsibility)
- `src/app/api/webhooks/stripe/route.test.ts` (rewritten per K)
- `src/types/auth.ts` (`UserProfileInsert` type)
- `src/services/auth/index.ts` (`toProfileInsertPayload`, narrowed
  `createUserProfile` payload)
- `src/services/auth/index.test.ts` (strengthened per K)
- `src/services/auth/profileSchemaContract.test.ts` (new contract per K)
- `docs/stripe-subscription-migration-review.md` (this section)

`database/subscriptions-entitlement-migration.sql` (Round 2's file) and
every prior section of this document are untouched.

## N. Commit SHA

Recorded once committed — see the commit immediately following this
document update on `fix/stripe-subscription-sync`.

## O. git status + untouched stash list

Working tree: clean except the same untracked, machine-local
`.claude/`/`.mcp.json`/`.ignore` noted since Round 2. Two pre-existing
stashes (`wip: stripe subscription sync implementation`, and an unrelated
`develop` WIP) — **not** popped, applied, or dropped; left exactly as
found.

## P. Remaining known issues

- The account-delete `partner_id` unlink bug (Round 1, section B) —
  confirmed still present, deliberately **not** fixed here (out of scope
  for this pass; needs a service-role client or a `SECURITY DEFINER` RPC,
  and a Graft check on whether `partner_id` is even still load-bearing now
  that `partner_links` is canonical).
- No automated test runs the forward-fix SQL against a real/ephemeral
  Postgres — consistent with every other migration in `database/`, not a
  new gap. See Q for the manual verification plan to run immediately after
  applying.

## Q. PROPOSED LIVE CHANGE — forward-fix migration

Migration SQL: section C above (full file in
`database/subscriptions-entitlement-forward-fix-migration.sql`).

**This migration has NOT been applied.** Post-apply verification plan:

1. **Schema:** `subscriptions_billing_shape_check` exists,
   `subscriptions_billing_type_identifiers_check` does not;
   `stripe_price_id` is `NOT NULL`; `stripe_webhook_events` has
   `status`/`started_at`/`claim_token`/nullable `processed_at` plus the
   matching-status CHECK and the `status` index.
2. **Grants:** `information_schema.role_table_grants` for
   `stripe_webhook_events` shows `service_role` → exactly
   `SELECT,INSERT,UPDATE` (no DELETE, no leftover `ALL`);
   `anon`/`authenticated` → nothing. `role_column_grants` for `users`
   shows `authenticated` INSERT limited to the 6 named columns, with
   `subscription_tier` absent from that list (still absent from UPDATE
   too).
3. **Policies:** `pg_policies` unchanged — owner-only SELECT on
   `subscriptions`; no policies on `stripe_webhook_events`.
4. **Attack — INSERT:** as an authenticated (non-service-role) client,
   attempt `INSERT INTO users (id, email, name, subscription_tier, ...)
   VALUES (auth.uid(), ..., 'lifetime', ...)` → expect a column-privilege
   error naming `subscription_tier`.
5. **Attack — UPDATE:** attempt `UPDATE users SET subscription_tier =
   'lifetime' WHERE id = auth.uid()` → expect the same class of error
   (already true pre-fix; re-confirm post-fix).
6. **Normal profile creation:** sign up a new account → `public.users`
   row appears with `subscription_tier = 'free'` (from the column default,
   never from the client) and every other `createUserProfile`-supplied
   column intact.
7. **Subscription owner SELECT:** as the owning authenticated user, `SELECT
   * FROM subscriptions WHERE user_id = auth.uid()` succeeds (once a row
   exists).
8. **Cross-user subscription SELECT:** as a different authenticated user,
   the same query against someone else's row returns zero rows (RLS).
9. **Webhook claim/process/finalize:** send a test `checkout.session.completed`
   and a `customer.subscription.updated` through the real webhook endpoint
   (Stripe CLI or dashboard test event) → `stripe_webhook_events` gets a row
   with `status='processed'`, `claim_token` set, `processed_at` set;
   `subscriptions` reflects Stripe's actual current state.
10. **Vault FREE denied / Premium allowed:** as a FREE account, any Vault
    route returns 403 ("Vault is a Premium feature..."); after a real or
    simulated upgrade to an entitled plan, the same route succeeds.

**Stopping here per instruction — no live DDL executed.**
