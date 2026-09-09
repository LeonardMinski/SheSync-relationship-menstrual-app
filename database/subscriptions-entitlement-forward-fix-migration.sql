-- Subscriptions / entitlement — FORWARD FIX from the live Round-1 state
-- ============================================================
-- NOT APPLIED. Proposal for review only — see
-- docs/stripe-subscription-migration-review.md ("Round 3 — Forward Fix")
-- for the full writeup and verification plan.
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

commit;
