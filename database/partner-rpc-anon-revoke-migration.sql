-- Backfills an explicit `REVOKE EXECUTE ... FROM anon` onto the partner RPCs
-- for this already-migrated database. partner-owner-viewer-migration.sql now
-- does this itself for any future run — this file exists only because that
-- fix landed after this database's migration had already executed.
-- Not a demonstrated leak: every function already guards on auth.uid().

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

