-- =====================================================
-- SheSync+ Partner RPC — Explicit anon EXECUTE Revoke
-- =====================================================
-- Follow-up to database/partner-owner-viewer-migration.sql (executed).
-- Privilege-only migration: does not recreate, replace, or alter any
-- function body, the partner_links schema, RLS, policies, constraints, or
-- indexes. Nothing in this file has been run against a live database yet.
--
-- ---------------------------------------------------------------
-- WHY THIS MIGRATION EXISTS
-- ---------------------------------------------------------------
-- Post-migration verification found that all five partner SECURITY
-- DEFINER functions were still callable by the unauthenticated `anon`
-- role at the Postgres privilege level, even though
-- partner-owner-viewer-migration.sql already issued
-- `REVOKE ALL ON FUNCTION ... FROM PUBLIC` for each of them.
--
-- The likely cause: Supabase projects commonly run
-- `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS
-- TO anon, authenticated, service_role` once at project setup. That grants
-- `anon` its own direct, role-specific EXECUTE privilege on every new
-- function created afterward — separate from or a grant to the `PUBLIC`
-- pseudo-role. `REVOKE ... FROM PUBLIC` only removes what was granted to
-- `PUBLIC`; it does not touch a privilege granted directly to `anon`. So
-- `anon` most likely never lost execute access from the original
-- migration, independent of anything that migration did wrong.
--
-- This migration explicitly issues `REVOKE EXECUTE ... FROM anon` — a
-- direct, role-targeted revoke — for each of the five functions, so the
-- database's own grant state actually matches the documented
-- authenticated-only intent.
--
-- To be precise about severity: this was NOT a demonstrated data leak or
-- an active exploit. Every one of the five functions independently checks
-- `auth.uid() IS NULL` as its first action and raises an exception before
-- touching any data, so an anonymous caller holding only the public anon
-- key could not actually read or mutate anything through this gap — that
-- application-level guard is real defence in depth and remains unchanged
-- by this migration. What was wrong is narrower: the database's own GRANT
-- state did not match the "authenticated only" property the original
-- migration's comments claimed. This migration closes that specific gap.
-- =====================================================

BEGIN;

-- ---------------------------------------------------
-- get_partner_shared_data()
-- ---------------------------------------------------
REVOKE ALL ON FUNCTION public.get_partner_shared_data() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_partner_shared_data() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_partner_shared_data() TO authenticated;

-- ---------------------------------------------------
-- create_partner_invite(text, text, text)
-- ---------------------------------------------------
REVOKE ALL ON FUNCTION public.create_partner_invite(text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_partner_invite(text, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_partner_invite(text, text, text) TO authenticated;

-- ---------------------------------------------------
-- accept_partner_invite(uuid)
-- ---------------------------------------------------
REVOKE ALL ON FUNCTION public.accept_partner_invite(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.accept_partner_invite(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.accept_partner_invite(uuid) TO authenticated;

-- ---------------------------------------------------
-- decline_partner_invite(uuid)
-- ---------------------------------------------------
REVOKE ALL ON FUNCTION public.decline_partner_invite(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.decline_partner_invite(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.decline_partner_invite(uuid) TO authenticated;

-- ---------------------------------------------------
-- revoke_partner_link(uuid)
-- ---------------------------------------------------
REVOKE ALL ON FUNCTION public.revoke_partner_link(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.revoke_partner_link(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.revoke_partner_link(uuid) TO authenticated;

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES (commented — run manually in the Supabase SQL
-- Editor after applying this migration; not executed by this file)
-- =====================================================

-- ---------------------------------------------------
-- Function EXECUTE privilege per role. Expected: anon = false,
-- authenticated = true, for every row.
-- ---------------------------------------------------
-- SELECT 'get_partner_shared_data' AS fn, 'anon' AS role,
--        has_function_privilege('anon', 'public.get_partner_shared_data()', 'EXECUTE') AS can_execute
-- UNION ALL
-- SELECT 'get_partner_shared_data', 'authenticated',
--        has_function_privilege('authenticated', 'public.get_partner_shared_data()', 'EXECUTE')
-- UNION ALL
-- SELECT 'create_partner_invite', 'anon',
--        has_function_privilege('anon', 'public.create_partner_invite(text,text,text)', 'EXECUTE')
-- UNION ALL
-- SELECT 'create_partner_invite', 'authenticated',
--        has_function_privilege('authenticated', 'public.create_partner_invite(text,text,text)', 'EXECUTE')
-- UNION ALL
-- SELECT 'accept_partner_invite', 'anon',
--        has_function_privilege('anon', 'public.accept_partner_invite(uuid)', 'EXECUTE')
-- UNION ALL
-- SELECT 'accept_partner_invite', 'authenticated',
--        has_function_privilege('authenticated', 'public.accept_partner_invite(uuid)', 'EXECUTE')
-- UNION ALL
-- SELECT 'decline_partner_invite', 'anon',
--        has_function_privilege('anon', 'public.decline_partner_invite(uuid)', 'EXECUTE')
-- UNION ALL
-- SELECT 'decline_partner_invite', 'authenticated',
--        has_function_privilege('authenticated', 'public.decline_partner_invite(uuid)', 'EXECUTE')
-- UNION ALL
-- SELECT 'revoke_partner_link', 'anon',
--        has_function_privilege('anon', 'public.revoke_partner_link(uuid)', 'EXECUTE')
-- UNION ALL
-- SELECT 'revoke_partner_link', 'authenticated',
--        has_function_privilege('authenticated', 'public.revoke_partner_link(uuid)', 'EXECUTE')
-- ORDER BY 1, 2;

-- ---------------------------------------------------
-- RLS enabled on public.partner_links. Expected: relrowsecurity = true.
-- ---------------------------------------------------
-- SELECT relrowsecurity, relforcerowsecurity
-- FROM pg_class
-- WHERE oid = 'public.partner_links'::regclass;

-- ---------------------------------------------------
-- partner_links policies. Expected: exactly one row —
-- partner_links_owner_or_viewer_select, cmd = SELECT.
-- ---------------------------------------------------
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'partner_links';

-- ---------------------------------------------------
-- status column default. Expected: 'pending'::text (or equivalent).
-- ---------------------------------------------------
-- SELECT column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'partner_links' AND column_name = 'status';

-- ---------------------------------------------------
-- Status and self-link CHECK constraints. Expected: both present, with
-- definitions matching status IN ('pending','active','inactive','declined')
-- and owner_user_id <> viewer_user_id respectively.
-- ---------------------------------------------------
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'public.partner_links'::regclass
--   AND conname IN ('partner_links_status_check', 'partner_links_not_self_check');

-- ---------------------------------------------------
-- Partial cardinality indexes. Expected: both present.
-- ---------------------------------------------------
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public' AND tablename = 'partner_links'
--   AND indexname IN (
--     'partner_links_one_pending_or_active_per_owner',
--     'partner_links_one_pending_or_active_per_viewer'
--   );
