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
