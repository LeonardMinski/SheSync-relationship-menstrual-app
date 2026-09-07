-- ============================================================================
-- SheSync+ Coach — table grant hardening (security closure)
-- ============================================================================
--
-- database/coach-conversations-v1-migration.sql (already applied live) grants
-- authenticated access and revokes PUBLIC, but this project's schema grants
-- new public-schema tables to anon/authenticated by default (e.g. via
-- ALTER DEFAULT PRIVILEGES), which REVOKE ... FROM PUBLIC alone does not
-- undo for a role granted directly. A live anon-key probe after that
-- migration confirmed anon could still reach these tables at the grant
-- level — RLS already returned zero rows either way (no row has
-- owner_user_id = null), so this was never a live data exposure, but the
-- grant itself should not exist.
--
-- This file does not edit or re-run the original migration — it only adds
-- the missing explicit revoke. Idempotent, safe to re-run.
-- ============================================================================

REVOKE ALL ON public.coach_conversations, public.coach_messages
FROM PUBLIC, anon;

-- authenticated is intentionally left untouched — owner-only RLS on both
-- tables (see the original migration) is what actually governs access for
-- that role; this file only removes the over-broad anon/PUBLIC grants.
