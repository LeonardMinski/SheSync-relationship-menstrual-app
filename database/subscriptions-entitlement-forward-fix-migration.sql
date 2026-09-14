-- Subscriptions / entitlement — FORWARD FIX from the live Round-1 state
-- ============================================================
-- NOT APPLIED. Proposal for review only — see
-- docs/stripe-subscription-migration-review.md ("Round 3 — Forward Fix")
-- for the full writeup and verification plan. Section 4 (the
-- subscription_reconciliation_locks table + reconcile_subscription_if_owner
-- RPC) was added by the same-day Round-3 correctness re-review that closed
-- two remaining races, then AMENDED IN PLACE by a same-day Round-4
-- correctness re-review (customer-level fencing + canonical-subscription-id
-- rule, replacing the original subscription-level fence) — still not
-- applied.
--
-- CONTEXT — why this file exists instead of re-running
-- subscriptions-entitlement-migration.sql:
--
-- database/subscriptions-entitlement-migration.sql ("Round 2") was never
-- applied. However, an EARLIER draft of that same migration ("Round 1")
-- WAS applied live, recorded as Supabase migration
-- 20260909060545_subscriptions_entitlement_correction, before Round 2's
-- corrections (the claim/outcome ledger state machine, the stricter
-- billing-shape check, stripe_price_id NOT NULL, and the
-- stripe_webhook_events grant narrowing) were ever written. Round 2's
-- file assumes a pristine pre-migration schema — it CREATE TABLEs
-- stripe_webhook_events and ADD COLUMNs on subscriptions that already
-- exist live — so running it now would fail outright.
--
-- This file instead evolves the ACTUAL live (Round-1) schema forward to
-- the same final target Round 2 described, plus the claim-token ownership
-- model added in this pass (see src/app/api/webhooks/stripe/route.ts).
-- Nothing here recreates a table or column that already exists.
--
-- Confirmed live immediately before writing this file (read-only
-- information_schema / pg_constraint / pg_indexes / pg_policies /
-- role_table_grants / role_column_grants inspection):
--
--   public.subscriptions — 0 rows.
--     Has every Round-1/Round-2-shared column already (stripe_price_id
--     nullable, billing_type NOT NULL with no default, etc.).
--     Constraint is subscriptions_billing_type_identifiers_check (the
--     LOOSER Round-1 shape — still permits lifetime+premium, lifetime+vip,
--     recurring+lifetime), not subscriptions_billing_shape_check.
--     Grants/RLS already match the final target: authenticated has
--     SELECT only (RLS-scoped via "Users can view own subscription"),
--     anon has nothing, service_role unchanged. Nothing to touch here.
--
--   public.stripe_webhook_events — 0 rows.
--     Only 4 columns live: event_id (PK), event_type, event_created_at,
--     processed_at (NOT NULL DEFAULT now()) — the Round-1
--     existence-implies-success shape, no status/started_at/claim_token,
--     no CHECK tying processed_at to status. service_role has
--     unrestricted ALL PRIVILEGES (Round-1's exact flagged
--     under-narrowing bug: a bare additive GRANT INSERT never actually
--     narrowed the broader default this project's pg_default_acl already
--     handed service_role). anon/authenticated already have nothing.
--
--   public.users — 6 rows (irrelevant to the grant changes below — no
--     column being touched has any per-row content to preserve).
--     UPDATE already correctly narrowed live (Round 1's column-level
--     grant to name/email/privacy_settings/onboarding_completed_at/
--     tracking_enabled). INSERT was NEVER touched by any prior migration:
--     authenticated holds full-column INSERT, including
--     subscription_tier — confirmed via role_column_grants. This is the
--     structural gap this file closes.
--
-- Every ALTER below is idempotent-safe against exactly this starting
-- state — it is NOT safe to re-run against a database that has already
-- had this file applied (e.g. DROP CONSTRAINT on a constraint that no
-- longer exists would error), by design, same as every other migration
-- in this directory.
-- ============================================================

begin;

-- 1. subscriptions: replace the looser Round-1 cross-field invariant with
--    the final shape, and require stripe_price_id. The table has 0 live
--    rows (reconfirmed above), so both changes apply instantly with
--    nothing to backfill or validate against.
alter table public.subscriptions drop constraint subscriptions_billing_type_identifiers_check;

-- subscriptions_plan_check (already live, unchanged) still independently
-- bounds plan to the 3-value domain; this constraint additionally
-- forbids the combinations that check alone can't rule out —
-- lifetime+premium, lifetime+vip, recurring+lifetime — leaving exactly
-- two legal shapes:
--   lifetime:  billing_type='lifetime' AND plan='lifetime'          AND stripe_subscription_id IS NULL
--   recurring: billing_type='recurring' AND plan IN ('premium','vip') AND stripe_subscription_id IS NOT NULL
alter table public.subscriptions
  add constraint subscriptions_billing_shape_check check (
    (billing_type = 'lifetime' and plan = 'lifetime' and stripe_subscription_id is null)
    or
    (billing_type = 'recurring' and plan in ('premium', 'vip') and stripe_subscription_id is not null)
  );

-- Every write path that can create or carry forward a subscriptions row
-- (handleCheckoutSessionCompleted, reconcileSubscriptionFromStripe in
-- src/app/api/webhooks/stripe/route.ts) either supplies a real Stripe
-- price id or refuses to write at all — see that file's comments. This
-- is the DB-level backstop.
alter table public.subscriptions alter column stripe_price_id set not null;

-- subscriptions grants, RLS policy, and indexes already match the final
-- target live (reconfirmed above) — intentionally nothing else here.

-- 2. stripe_webhook_events: evolve the Round-1 4-column
--    existence-implies-success table in place into the claim/outcome
--    state machine with explicit per-attempt ownership. 0 live rows, so
--    every new column below can be added NOT NULL directly with no
--    transient default needed for existing data.
alter table public.stripe_webhook_events
  add column status text not null default 'processing' check (status in ('processing', 'processed', 'failed')),
  add column started_at timestamptz not null default now(),
  -- Per-attempt ownership token: every claim (fresh or reclaimed) gets a
  -- brand-new one (see claimEvent/tryReclaim). Finalizing an attempt
  -- (markProcessed/markFailed) requires THIS token to still match — a
  -- stale claimant whose token has since been superseded by a reclaim
  -- can no longer alter the row at all. No default: every insert and
  -- every reclaim always supplies one explicitly; a code path that
  -- forgot to would fail loudly rather than silently minting an
  -- unrelated token the application never learns.
  add column claim_token uuid not null;

-- Round-1's processed_at (NOT NULL DEFAULT now()) encoded
-- "row exists ⇒ succeeded". The state machine needs it NULL for
-- processing/failed and set exactly for processed — see the CHECK below.
alter table public.stripe_webhook_events alter column processed_at drop not null;
alter table public.stripe_webhook_events alter column processed_at drop default;

-- Structural enforcement of "mark processed only after the mutation
-- succeeds": processed_at can be non-null if and only if status is
-- 'processed' — the application can't accidentally set one without the
-- other.
alter table public.stripe_webhook_events
  add constraint stripe_webhook_events_processed_at_matches_status check (
    (status = 'processed') = (processed_at is not null)
  );

-- The app's own reclaim query (an orphaned 'processing' row whose claim
-- looks abandoned — see src/app/api/webhooks/stripe/route.ts) filters on
-- status; a future admin/ops view listing failed events would too.
create index if not exists stripe_webhook_events_status_idx on public.stripe_webhook_events (status);

-- Round-1 left service_role with unrestricted ALL PRIVILEGES on this
-- table (confirmed live) instead of the intended narrow set — this
-- project's pg_default_acl grants new public tables default privileges
-- to anon/authenticated/service_role, so a bare additive GRANT never
-- narrows that. Revoke everything from all three roles first, then grant
-- back exactly what the claim/process/finalize algorithm needs.
revoke all on public.stripe_webhook_events from anon, authenticated, service_role;

-- service_role's algorithm needs:
--   INSERT  — claim a brand-new event_id
--   SELECT  — on a claim conflict, read the existing row's status/started_at
--             to decide duplicate-skip vs. reclaim-and-retry
--   UPDATE  — reclaim a 'failed' or stale-orphaned 'processing' row, and
--             finalize a claimed row (by matching claim_token) to
--             'processed' or 'failed'
-- No DELETE: nothing in the app removes ledger rows.
grant select, insert, update on public.stripe_webhook_events to service_role;

-- anon / authenticated: NONE — already the case live, reconfirmed, not
-- left to an inherited default.

-- 3. Close the authenticated INSERT self-upgrade path on public.users.
-- UPDATE was already correctly narrowed by the Round-1 apply. INSERT
-- never was: authenticated holds full-column INSERT today, including
-- subscription_tier — confirmed via role_column_grants immediately
-- before writing this file. The only legitimate authenticated-role
-- INSERT anywhere in the app is createUserProfile()'s fallback upsert
-- (src/services/auth/index.ts, ON CONFLICT (id) DO NOTHING) — audited
-- against every `.from('users').insert/upsert` call site in the app
-- (there is exactly one) and against handle_new_auth_user() (runs as
-- the trigger/table owner on auth.users insert, not as `authenticated`,
-- so it is entirely unaffected by this grant). That fallback's payload
-- was narrowed in the same commit as this migration
-- (toProfileInsertPayload in src/services/auth/index.ts) to send exactly
-- the columns below — subscription_tier is deliberately excluded from
-- both the grant and the payload; the column's own
-- NOT NULL DEFAULT 'free' establishes free status without it.
revoke insert on public.users from authenticated;
grant insert (
  id,
  email,
  name,
  created_at,
  privacy_settings,
  tracking_enabled
) on public.users to authenticated;

-- 4. Round-3 correctness review (see
--    docs/stripe-subscription-migration-review.md): claim_token above
--    protects only the per-event_id LEDGER outcome (processed/failed). It
--    does not protect the actual public.subscriptions mutation, so a
--    claimant that retrieved Stripe state and then stalled past
--    PROCESSING_CLAIM_STALE_MS could resume after a DIFFERENT attempt —
--    a reclaim of the same event_id, a wholly distinct event_id for the
--    same subscription, a resubscribe under a brand-new subscription id,
--    or a Lifetime checkout for the same customer — already wrote a
--    newer state, and overwrite it with its own now-stale snapshot.
--
-- AMENDED (same-day Round-4 correctness re-review, before this file was
-- ever applied): the first version of this section fenced by
-- stripe_subscription_id. That left a cross-subscription hole —
-- public.subscriptions is canonical per USER/CUSTOMER (one row per user,
-- upserted ON CONFLICT (user_id)), not per subscription, so a resubscribe
-- (old sub_old -> new sub_new, same customer) or a Lifetime-vs-recurring
-- race left TWO different, mutually-blind lock rows each believing they
-- alone fenced the ONE shared canonical row. Fixed here in place —
-- amending this same not-yet-applied file rather than adding a follow-up
-- migration — by fencing the CUSTOMER instead, and adding a
-- canonical-identity rule so a normal lifecycle event can never silently
-- switch which subscription (or billing state) is canonical.
--
-- Fix: a per-CUSTOMER reconciliation fencing token (same
-- distributed-locking pattern as claim_token, applied one level down —
-- keyed by Stripe customer id), acquired BEFORE calling
-- stripe.subscriptions.retrieve() (or, for Lifetime, before its own
-- canonical write) and checked-and-consumed atomically, in the same
-- transaction as the canonical write, by reconcile_subscription_if_owner()
-- below. EVERY entitlement-changing webhook path for a customer —
-- recurring checkout, every customer.subscription.* lifecycle event, and
-- Lifetime checkout — acquires and is checked against this SAME lock row.
-- See acquireReconciliationLock/writeSubscriptionIfOwner in
-- src/app/api/webhooks/stripe/route.ts.
create table public.subscription_reconciliation_locks (
  stripe_customer_id text primary key,
  reconciliation_token uuid not null,
  acquired_at timestamptz not null default now()
);

alter table public.subscription_reconciliation_locks enable row level security;
-- No policies: service-role-only, same rationale as stripe_webhook_events
-- above — nothing here is ever user-facing.

revoke all on public.subscription_reconciliation_locks from anon, authenticated, service_role;

-- service_role's algorithm needs:
--   INSERT/UPDATE (via upsert) — acquire/replace the current
--     reconciliation token for a customer, before retrieving Stripe state
--     or applying a Lifetime write (acquireReconciliationLock)
--   SELECT — read inside reconcile_subscription_if_owner() below (runs as
--     the function owner via SECURITY DEFINER, but an explicit grant
--     keeps this table's own privileges legible without depending on
--     that implicit bypass)
-- No DELETE: exactly one lock row per Stripe customer id, for the life of
-- that customer — no cleanup concern distinct from the customer itself.
grant select, insert, update on public.subscription_reconciliation_locks to service_role;

-- Atomically verifies the caller still holds the CURRENT reconciliation
-- token for this CUSTOMER and, only if so, applies the canonical
-- subscriptions upsert and the users.subscription_tier display-cache
-- sync in the same transaction. Returns false ("lost ownership") without
-- writing anything if EITHER:
--
--   1. A later reconciliation attempt for this same customer has since
--      replaced the fencing token (see acquireReconciliationLock) — some
--      other attempt already applied a state that is, by construction,
--      at least as current as this caller's own now-stale retrieve; or
--
--   2. p_is_authoritative is false (an ordinary customer.subscription.*
--      lifecycle event, never a purchase/checkout) AND the subscription
--      this call is trying to write is not the one currently canonical
--      for this user (a different, noncanonical stripe_subscription_id;
--      or the canonical row is billing_type='lifetime') — a normal
--      lifecycle event must never SWITCH which subscription or billing
--      state is canonical, only reconcile the one that already is. Only
--      an authoritative purchase/checkout path (p_is_authoritative =
--      true) may establish or replace canonical identity — recurring
--      checkout.session.completed (may set/replace
--      stripe_subscription_id) and Lifetime checkout.session.completed
--      (may set billing_type='lifetime' and clear
--      stripe_subscription_id) both call this with
--      p_is_authoritative = true.
--
-- Either case is a benign no-op for the caller, never a failure: the
-- canonical row already reflects the correct state.
--
-- Both FOR UPDATE clauses are load-bearing: the first holds this
-- customer's lock row for the remainder of THIS transaction so a
-- concurrent acquire (a different reconciliation attempt replacing the
-- token) cannot interleave between the ownership check and the write;
-- the second (only taken for a non-authoritative call, since an
-- authoritative call's own INSERT ... ON CONFLICT DO UPDATE takes an
-- equivalent row lock as part of the upsert itself) holds the current
-- canonical subscriptions row for this user so the canonical-identity
-- check and the write are likewise one atomic step, not two statements a
-- concurrent authoritative write could interleave between.
create or replace function public.reconcile_subscription_if_owner(
  p_stripe_customer_id text,
  p_reconciliation_token uuid,
  p_is_authoritative boolean,
  p_user_id uuid,
  p_stripe_subscription_id text,
  p_stripe_checkout_session_id text,
  p_stripe_payment_intent_id text,
  p_stripe_price_id text,
  p_plan text,
  p_billing_type text,
  p_status text,
  p_current_period_end timestamptz,
  p_cancel_at_period_end boolean,
  p_grace_period_ends_at timestamptz,
  p_last_stripe_event_created_at timestamptz,
  p_subscription_tier text
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_is_current boolean;
  v_existing_subscription_id text;
  v_existing_billing_type text;
begin
  -- Fence 1: still the current owner for this CUSTOMER?
  select (reconciliation_token = p_reconciliation_token)
    into v_is_current
  from public.subscription_reconciliation_locks
  where stripe_customer_id = p_stripe_customer_id
  for update;

  if v_is_current is not true then
    return false;
  end if;

  -- Fence 2: canonical-subscription-id rule (skipped entirely for an
  -- authoritative purchase/checkout path, which may always
  -- establish/replace canonical identity).
  if not p_is_authoritative then
    select stripe_subscription_id, billing_type
      into v_existing_subscription_id, v_existing_billing_type
    from public.subscriptions
    where user_id = p_user_id
    for update;

    if not found then
      -- No canonical row yet for this user — only an authoritative
      -- checkout may establish one.
      return false;
    end if;

    if v_existing_billing_type = 'lifetime' then
      -- Lifetime is canonical; a recurring lifecycle event is
      -- noncanonical for this user.
      return false;
    end if;

    if v_existing_subscription_id is distinct from p_stripe_subscription_id then
      -- This lifecycle event belongs to an old/noncanonical Stripe
      -- subscription (e.g. a resubscribe already replaced it as
      -- canonical) — benign no-op.
      return false;
    end if;
  end if;

  insert into public.subscriptions (
    user_id, stripe_customer_id, stripe_subscription_id,
    stripe_checkout_session_id, stripe_payment_intent_id, stripe_price_id,
    plan, billing_type, status, current_period_end, cancel_at_period_end,
    grace_period_ends_at, last_stripe_event_created_at
  ) values (
    p_user_id, p_stripe_customer_id, p_stripe_subscription_id,
    p_stripe_checkout_session_id, p_stripe_payment_intent_id, p_stripe_price_id,
    p_plan, p_billing_type, p_status, p_current_period_end, p_cancel_at_period_end,
    p_grace_period_ends_at, p_last_stripe_event_created_at
  )
  on conflict (user_id) do update set
    stripe_customer_id = excluded.stripe_customer_id,
    stripe_subscription_id = excluded.stripe_subscription_id,
    stripe_checkout_session_id = excluded.stripe_checkout_session_id,
    stripe_payment_intent_id = excluded.stripe_payment_intent_id,
    stripe_price_id = excluded.stripe_price_id,
    plan = excluded.plan,
    billing_type = excluded.billing_type,
    status = excluded.status,
    current_period_end = excluded.current_period_end,
    cancel_at_period_end = excluded.cancel_at_period_end,
    grace_period_ends_at = excluded.grace_period_ends_at,
    last_stripe_event_created_at = excluded.last_stripe_event_created_at;

  update public.users
  set subscription_tier = p_subscription_tier
  where id = p_user_id;

  return true;
end;
$$;

revoke all on function public.reconcile_subscription_if_owner(
  text, uuid, boolean, uuid, text, text, text, text, text, text, text,
  timestamptz, boolean, timestamptz, timestamptz, text
) from public;
revoke execute on function public.reconcile_subscription_if_owner(
  text, uuid, boolean, uuid, text, text, text, text, text, text, text,
  timestamptz, boolean, timestamptz, timestamptz, text
) from anon, authenticated;
grant execute on function public.reconcile_subscription_if_owner(
  text, uuid, boolean, uuid, text, text, text, text, text, text, text,
  timestamptz, boolean, timestamptz, timestamptz, text
) to service_role;

commit;
