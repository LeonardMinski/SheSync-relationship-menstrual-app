-- SECURITY ADVISORY HARDENING MIGRATION — applied 2026-09-08 via the
-- Supabase MCP (mcp__supabase__apply_migration, name "security_advisory_
-- hardening"). Kept here for the record and for local/other-environment
-- parity.
--
-- Produced from a live read-only audit of project wuvjrpgoqrpaogpewlyj
-- (2026-09-08). Every change below was independently verified against:
--   (a) the live pg_policies / grants / pg_proc catalogs,
--   (b) actual application code paths (src/app/api/**), and
--   (c) the corresponding RPC function bodies.
-- See the accompanying audit report for the full reasoning, the
-- attack-style validation, and the two significant findings this
-- migration deliberately does NOT fix (both need a team decision, not a
-- silent DDL change):
--   1. public.handle_new_auth_user() is not currently attached to any
--      trigger on auth.users in this live project. New-user profile
--      creation is therefore running entirely on the client-side
--      loadOrCreateUserProfile() fallback (src/services/auth/index.ts).
--      This migration hardens the function anyway (it's still a live,
--      unnecessarily-exposed SECURITY DEFINER function) but does not
--      create/attach a trigger — that changes runtime behavior and is
--      out of scope for an advisory-hardening pass.
--   2. database/vault-v1-migration.sql (vault_sparks, vault_afterglow_
--      reflections, and the vault_* RPCs the app already calls) had not
--      been applied to this live project at all as of this audit. Not a
--      security finding, not touched by this file — applied separately
--      the same day (2026-09-08, migration name "vault_v1").
--
-- Nothing here creates a new permissive policy. Nothing here touches
-- auth settings, the Postgres version, or MFA. Nothing here drops a
-- table. All revokes below were checked against actual RLS policies and
-- actual call sites so that no legitimate app path is broken — see the
-- report's DATABASE OBJECT -> APP CALLER -> ROLE -> REQUIRED PRIVILEGE
-- table for the evidence behind each line.

BEGIN;

-- ---------------------------------------------------------------
-- 1. ANON HAS NO LEGITIMATE DIRECT-TABLE ROLE IN THIS APP.
--    Supabase Auth (signup/login) runs through the auth schema via
--    GoTrue, not through PostgREST grants on these public tables. No
--    route in src/app/api serves an anon (unauthenticated) request by
--    reading/writing a public.* table directly — every route calls
--    authenticateRequest() first. RLS already denies anon on every
--    policy-protected table (auth.uid() is null for anon), so this is
--    defense-in-depth: closing the gap that today depends entirely on
--    every current and future policy being correct.
-- ---------------------------------------------------------------

REVOKE ALL ON TABLE
  public.users,
  public.cycle_data,
  public.periods,
  public.period_day_logs,
  public.partner_links,
  public.partner_contexts,
  public.boundary_items,
  public.intimacy_cards,
  public.intimacy_cards_legacy,
  public.intimacy_sessions,
  public.fantasy_entries,
  public.fantasy_entries_legacy,
  public.fantasy_shares,
  public.consent_events,
  public.support_preferences,
  public.relationship_appreciations,
  public.relationship_sessions,
  public.relationship_session_answers,
  public.relationship_memories,
  public.shared_replies,
  public.ai_coach_messages,
  public.subscriptions,
  public.coach_conversations,
  public.coach_messages
FROM anon;

-- ---------------------------------------------------------------
-- 2. TABLES THAT ARE RPC-ONLY BY DESIGN: the app never writes to these
--    directly (confirmed in src/app/api — writes go exclusively through
--    the SECURITY DEFINER RPCs, which run as the function owner and are
--    therefore unaffected by revoking the underlying table grant), and
--    no RLS policy exists for the commands revoked here, so nothing
--    changes at the RLS layer either. SELECT is kept wherever a read
--    policy exists and the app reads the table directly.
-- ---------------------------------------------------------------

-- partner_links: writes only via create/accept/decline/revoke_partner_invite().
-- Direct reads (GET /api/partner) rely on "partner_links_owner_or_viewer_select".
REVOKE INSERT, UPDATE, DELETE ON TABLE public.partner_links FROM authenticated;

-- relationship_sessions: writes only via start_relationship_session(),
-- mark_session_ready(), reveal_session_together(). Direct reads rely on
-- "Participants can view session metadata while relationship activ[e]".
REVOKE INSERT, UPDATE, DELETE ON TABLE public.relationship_sessions FROM authenticated;

-- relationship_session_answers: writes only via submit_session_answer()
-- / get_session_answers(). No direct .from() usage in the app at all;
-- SELECT kept because "Answerer can view own session answers" exists.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.relationship_session_answers FROM authenticated;

-- relationship_memories: writes only via save_relationship_memory().
-- Direct reads (GET /api/relationship-memory) rely on
-- "Participants can view relationship memory while relationship ac[tive]".
REVOKE INSERT, UPDATE, DELETE ON TABLE public.relationship_memories FROM authenticated;

-- consent_events: append-only consent ledger. INSERT/SELECT are
-- policy-backed ("consent_owner_insert" / "consent_owner_read"); no
-- UPDATE/DELETE policy exists or should exist for an audit trail.
REVOKE UPDATE, DELETE ON TABLE public.consent_events FROM authenticated;

-- shared_replies: zero RLS policies of any kind (by design — access is
-- entirely mediated by add_reply()/get_replies(), which validate source
-- access via _has_reply_source_access()). App code and its tests already
-- expect direct access to be denied (see src/app/api/replies/route.ts
-- and route.test.ts). Full revoke closes both the "no policy" lint and
-- both GraphQL-exposure lints for this table with zero behavior change.
REVOKE ALL ON TABLE public.shared_replies FROM authenticated;

-- intimacy_cards: shared catalogue, read-only by design
-- ("cards_public_read", qual = true). No INSERT/UPDATE/DELETE policy
-- exists; catalogue content is seeded/managed via service_role, not by
-- end users. (The one route that attempted a direct client insert,
-- src/app/api/intimacy/route.ts, targets column names that don't exist
-- on this table — it is already non-functional against the live schema
-- and is not a live dependency; see report.)
REVOKE INSERT, UPDATE, DELETE ON TABLE public.intimacy_cards FROM authenticated;

-- ---------------------------------------------------------------
-- 3. TABLES WITH ZERO POLICIES THAT ARE LEGACY/BACKEND-ONLY, NOT
--    RPC-mediated catalogues. Confirmed via docs/COACH_CONVERSATION_
--    WORKSPACE.md ("do not build on ... ai_coach_messages") and
--    docs/MVP_AUDIT.md that ai_coach_messages and fantasy_entries_legacy
--    /intimacy_cards_legacy are superseded, parked tables; subscriptions
--    is Stripe/webhook-managed (service_role only, no direct .from()
--    call anywhere in the app). Full revoke; retiring these tables
--    outright is a separate follow-up (see report), not done here.
-- ---------------------------------------------------------------

REVOKE ALL ON TABLE public.ai_coach_messages FROM authenticated;
REVOKE ALL ON TABLE public.fantasy_entries_legacy FROM authenticated;
REVOKE ALL ON TABLE public.intimacy_cards_legacy FROM authenticated;
REVOKE ALL ON TABLE public.subscriptions FROM authenticated;

-- ---------------------------------------------------------------
-- 4. INTERNAL HELPER FUNCTION: public._has_reply_source_access(...)
--    Its p_caller argument is caller-supplied, not forced to auth.uid()
--    — the function trusts whatever uuid is passed in. Called
--    server-side by add_reply()/get_replies() (which pass auth.uid()
--    correctly), but as a directly-callable RPC it lets any
--    authenticated user use it as a yes/no oracle for "does this other
--    user id have access to this source id" — a relationship-graph leak,
--    not a content leak, but not an intended public entry point (leading
--    underscore = internal helper convention).
--    SECURITY DEFINER functions execute as their owner regardless of the
--    caller's own EXECUTE grants, and object owners always retain
--    implicit privileges on objects they own — so add_reply()/
--    get_replies() (also owned by postgres) keep working unchanged.
-- ---------------------------------------------------------------

REVOKE ALL ON FUNCTION public._has_reply_source_access(text, uuid, uuid)
  FROM PUBLIC, authenticated;

-- ---------------------------------------------------------------
-- 5. public.handle_new_auth_user(): RETURNS TRIGGER, so Postgres already
--    refuses any direct SELECT/RPC invocation of it ("trigger functions
--    can only be called as triggers") — this hardening is defense-in-
--    depth, not a fix for a reachable exploit. It closes the "public can
--    execute SECURITY DEFINER" lint and the mutable-search_path lint.
--    Revoking EXECUTE does not affect trigger firing: the trigger
--    mechanism invokes the function as its owner regardless of grants,
--    exactly like RLS bypass for table owners.
-- ---------------------------------------------------------------

ALTER FUNCTION public.handle_new_auth_user() SET search_path = pg_catalog, public;
REVOKE ALL ON FUNCTION public.handle_new_auth_user() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------
-- 6. public.update_updated_at_column(): SECURITY INVOKER trigger helper
--    with a mutable search_path (the only other function the advisor
--    flagged for this). Trivial body (NEW.updated_at = NOW()); fixing
--    the search_path is a zero-risk, zero-behavior-change hardening.
-- ---------------------------------------------------------------

ALTER FUNCTION public.update_updated_at_column() SET search_path = pg_catalog, public;

COMMIT;

-- ---------------------------------------------------------------
-- VERIFICATION (read-only, run manually after COMMIT — not part of the
-- migration itself)
-- ---------------------------------------------------------------
-- Confirm anon has nothing left on any public table:
--   select table_name, privilege_type from information_schema.role_table_grants
--   where table_schema = 'public' and grantee = 'anon';
--   -- expect: 0 rows
--
-- Confirm the trimmed authenticated grants:
--   select table_name, string_agg(privilege_type, ',' order by privilege_type)
--   from information_schema.role_table_grants
--   where table_schema = 'public' and grantee = 'authenticated'
--   group by table_name order by table_name;
--
-- Confirm function hardening:
--   select proname, prosecdef, proconfig,
--          has_function_privilege('anon', oid, 'EXECUTE') as anon_exec,
--          has_function_privilege('authenticated', oid, 'EXECUTE') as auth_exec
--   from pg_proc where pronamespace = 'public'::regnamespace
--     and proname in ('handle_new_auth_user','update_updated_at_column','_has_reply_source_access');
--
-- Regression check — run as an authenticated test user via the app,
-- not psql, since these are the actual code paths that matter:
--   1. Sign up a new account -> confirm a public.users row appears
--      (today via loadOrCreateUserProfile; the trigger gap in item 1
--      above is unchanged by this migration either way).
--   2. Existing partner flow: create/accept/decline/revoke invite,
--      GET /api/partner — unchanged (RPC + SELECT policy untouched).
--   3. Relationship sessions: start/answer/mark-ready/reveal, GET list
--      and GET [id] — unchanged (RPC + SELECT policy untouched).
--   4. Replies: GET/POST /api/replies on a partner_context/appreciation/
--      relationship_session — unchanged (RPC-only untouched).
--   5. Intimacy cards catalogue: GET /api/intimacy — unchanged (SELECT
--      kept); do not attempt the existing POST route as a regression
--      check, it was already broken against this schema before this
--      migration (see report).
