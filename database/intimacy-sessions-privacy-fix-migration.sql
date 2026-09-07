-- =====================================================
-- SheSync+ Intimacy Sessions Privacy Fix
-- =====================================================
-- Found during the pre-beta hardening pass, in intimacy-schema.sql:
--
-- 1. "sessions_owner_read" (intimacy-schema.sql) lets a partner read a
--    shared intimacy_sessions row whenever ANY partner_links row exists
--    between the two users with shared_with_partner = true — it never
--    checks that the link's status is 'active'. Concretely: an invite
--    that hasn't been accepted yet (status = 'pending') already grants
--    read access, and a revoked/ended connection (status = 'inactive' or
--    'declined') never loses it. This contradicts the access model the
--    rest of the app enforces everywhere else (see
--    relationship-experience-v1-migration.sql and
--    partner-owner-viewer-migration.sql, both of which correctly require
--    status = 'active' on every partner-facing read) — this table was
--    simply never updated when that model landed.
--
-- 2. "cards_authenticated_update"/"cards_authenticated_delete"
--    (fix-intimacy-rls.sql) let ANY authenticated user modify or delete
--    rows in the shared intimacy_cards catalogue that every user reads
--    from — the comment says "for admin purposes" but the check
--    (auth.uid() IS NOT NULL) is not an admin check, it's "any logged-in
--    user". No admin/role mechanism exists anywhere else in this schema,
--    and nothing in the live application ever writes to intimacy_cards
--    (grep-confirmed against src/), so the correct fix is to remove
--    write access entirely rather than invent a role system nobody asked
--    for. cards_authenticated_insert has the identical problem and is
--    removed for the same reason.
--
-- This migration only tightens existing policies (drop + recreate with a
-- narrower USING/WITH CHECK clause, or drop with no replacement) — it
-- grants nothing new. Wrapped in existence checks so it is a safe no-op
-- if these specific legacy tables were never created in this project.
-- Assumes partner_links has already been through
-- partner-owner-viewer-migration.sql's owner_user_id/viewer_user_id
-- rename, which every other current partner-facing policy in this
-- codebase also assumes.
-- =====================================================

BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'intimacy_sessions'
    ) THEN
        DROP POLICY IF EXISTS "sessions_owner_read" ON public.intimacy_sessions;

        CREATE POLICY "sessions_owner_read"
            ON public.intimacy_sessions FOR SELECT USING (
                auth.uid() = user_id
                OR (EXISTS (
                    SELECT 1 FROM public.partner_links pl
                    WHERE pl.owner_user_id = user_id
                    AND pl.viewer_user_id = auth.uid()
                    AND pl.status = 'active'
                    AND shared_with_partner = true
                ))
            );
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'intimacy_cards'
    ) THEN
        DROP POLICY IF EXISTS "cards_authenticated_insert" ON public.intimacy_cards;
        DROP POLICY IF EXISTS "cards_authenticated_update" ON public.intimacy_cards;
        DROP POLICY IF EXISTS "cards_authenticated_delete" ON public.intimacy_cards;
    END IF;
END $$;

COMMIT;
