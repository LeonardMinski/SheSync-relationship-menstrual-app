-- =====================================================
-- SheSync+ Partner Domain Correction Migration (Revised)
-- =====================================================
-- Fixes the partner_links relationship direction and access model.
--
-- Product model:
--   OWNER  = the SheSync+ user whose wellness/cycle data may be shared.
--   VIEWER = the invited partner who may read explicitly shared fields
--            once OWNER has invited them and VIEWER has accepted.
--
-- This revision responds to a security review of the first version of this
-- migration, and a subsequent hardening pass that made the whole migration
-- transactional and its data-safety checks automated (see sections 1 and
-- 1a below). Nothing in this file has been run against a live database.
--
-- ---------------------------------------------------------------
-- SHARING TRUTH TABLE (authoritative — implemented in
-- get_partner_shared_data() below, for BOTH the "today" fields and
-- recent_activity; the two must never disagree)
-- ---------------------------------------------------------------
-- MASTER | PHASE | MOOD | Result
-- OFF    | any   | any  | no private cycle values (name/summary only)
-- ON     | OFF   | OFF  | no private cycle values
-- ON     | ON    | OFF  | phase only
-- ON     | OFF   | ON   | mood + energy only
-- ON     | ON    | ON   | phase + mood + energy
--
-- A viewer calling get_partner_shared_data() directly (e.g. via the
-- Supabase REST/RPC endpoint, bypassing the Next.js app entirely) must
-- never be able to observe a value prohibited by this table. The fix is
-- entirely inside this function — nothing upstream of the database is
-- trusted to repair an unsafe row.
-- =====================================================

-- ---------------------------------------------------------------
-- LEGACY ROW-DIRECTION WARNING — read before running, do not skip.
-- ---------------------------------------------------------------
-- The previous partner implementation had historically confused
-- relationship direction (see the security-review note in section 7).
-- Section 1 below renames user_id -> owner_user_id and partner_user_id ->
-- viewer_user_id. That rename is purely a column-name change: it does NOT
-- inspect or alter which identity is stored in which column. If
-- public.partner_links already contains rows, the operator MUST manually
-- verify, before running this migration, that for every existing row:
--   * user_id genuinely identifies the intended OWNER (the person whose
--     wellness/cycle data may be shared), and
--   * partner_user_id genuinely identifies the intended VIEWER (the
--     invited partner).
-- This migration does not — and cannot safely — guess or swap existing
-- rows to correct a mismatched direction. If any row's direction is
-- wrong, fix it manually (or delete the row and have the connection
-- re-created through the app) before proceeding; running this migration
-- over a misdirected row will simply carry the same mistake forward under
-- the new column names.
--
-- As of this review, the live development database has zero rows in
-- public.partner_links (total_partner_links = 0), so this particular risk
-- does not currently apply there. It remains documented here because this
-- migration is idempotent-by-design (see section 1) and may be run again
-- later, or against another environment, after real rows exist.
-- ---------------------------------------------------------------

-- ---------------------------------------------------------------
-- OPTIONAL PRE-FLIGHT AWARENESS QUERIES (informational only, current
-- CURRENT schema — run these manually, if you want an early look, using
-- today's pre-rename column names BEFORE starting the transaction below).
-- These are not authoritative and not required: section 1a inside the
-- transaction below re-runs the equivalent checks automatically, under
-- the canonical post-rename names, and will abort the whole migration if
-- any of them fail. Nothing here blocks or replaces that automated check.
--
--   -- current-schema status sanity check:
--   SELECT status, count(*) FROM public.partner_links
--   WHERE status NOT IN ('pending','active','inactive','declined')
--   GROUP BY status;
--
--   -- current-schema self-link sanity check:
--   SELECT count(*) FROM public.partner_links WHERE user_id = partner_user_id;
--
--   -- current-schema cardinality sanity check:
--   SELECT user_id, count(*) FROM public.partner_links
--   WHERE status IN ('pending','active') GROUP BY user_id HAVING count(*) > 1;
--   SELECT partner_user_id, count(*) FROM public.partner_links
--   WHERE status IN ('pending','active') GROUP BY partner_user_id HAVING count(*) > 1;
-- ---------------------------------------------------------------

-- ---------------------------------------------------------------
-- Everything below runs as one atomic transaction: if any statement
-- fails — including the automated validation in section 1a — the entire
-- migration rolls back and the database is left exactly as it was found.
-- ---------------------------------------------------------------
BEGIN;

-- ---------------------------------------------------
-- 1. Rename columns (idempotent — safe to run once or many times)
-- ---------------------------------------------------
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'partner_links' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.partner_links RENAME COLUMN user_id TO owner_user_id;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'partner_links' AND column_name = 'partner_user_id'
    ) THEN
        ALTER TABLE public.partner_links RENAME COLUMN partner_user_id TO viewer_user_id;
    END IF;
END $$;

-- ---------------------------------------------------
-- 1a. Automated data-safety validation (runs after the rename above, so
-- it can use the canonical owner_user_id/viewer_user_id names; runs
-- before any constraint, index, policy, or function is touched below).
-- ---------------------------------------------------
-- Every check here fails loudly (RAISE EXCEPTION) and does nothing else —
-- no automatic delete, deactivate, or coercion of any row. A failure here
-- aborts this entire transaction, including the rename in section 1, so
-- the database is left untouched. Resolve the flagged rows manually, then
-- re-run this whole file from the top.
DO $$
DECLARE
    v_bad_status_count integer;
    v_self_link_count integer;
    v_null_identity_count integer;
    v_owner_duplicate_count integer;
    v_viewer_duplicate_count integer;
BEGIN
    -- 1. status must be one of the four values this migration's CHECK
    -- constraint (section 3) is about to enforce.
    SELECT count(*) INTO v_bad_status_count
    FROM public.partner_links
    WHERE status NOT IN ('pending', 'active', 'inactive', 'declined');

    IF v_bad_status_count > 0 THEN
        RAISE EXCEPTION
            'partner-owner-viewer-migration aborted: % row(s) in partner_links have a status outside pending/active/inactive/declined. Resolve manually — this migration will not coerce them — then re-run.',
            v_bad_status_count;
    END IF;

    -- 2. owner_user_id must never equal viewer_user_id, matching the
    -- self-link CHECK constraint this migration is about to add (3b).
    SELECT count(*) INTO v_self_link_count
    FROM public.partner_links
    WHERE owner_user_id = viewer_user_id;

    IF v_self_link_count > 0 THEN
        RAISE EXCEPTION
            'partner-owner-viewer-migration aborted: % row(s) in partner_links have owner_user_id = viewer_user_id. Resolve manually, then re-run.',
            v_self_link_count;
    END IF;

    -- 3. Both identities are expected to always be present on every row —
    -- a partner_links row that is missing either side is not a valid
    -- relationship and every function below assumes both are non-NULL.
    SELECT count(*) INTO v_null_identity_count
    FROM public.partner_links
    WHERE owner_user_id IS NULL OR viewer_user_id IS NULL;

    IF v_null_identity_count > 0 THEN
        RAISE EXCEPTION
            'partner-owner-viewer-migration aborted: % row(s) in partner_links have a NULL owner_user_id or viewer_user_id. This migration assumes both identities are always present. Resolve manually, then re-run.',
            v_null_identity_count;
    END IF;

    -- 4. At most one pending/active row per owner, matching the partial
    -- unique index this migration is about to add (3c).
    SELECT count(*) INTO v_owner_duplicate_count
    FROM (
        SELECT owner_user_id
        FROM public.partner_links
        WHERE status IN ('pending', 'active')
        GROUP BY owner_user_id
        HAVING count(*) > 1
    ) dupes;

    IF v_owner_duplicate_count > 0 THEN
        RAISE EXCEPTION
            'partner-owner-viewer-migration aborted: % owner(s) have more than one pending/active partner_links row. Resolve manually — this migration will not deactivate "extra" rows for you — then re-run.',
            v_owner_duplicate_count;
    END IF;

    -- 5. At most one pending/active row per viewer, matching the partial
    -- unique index this migration is about to add (3c).
    SELECT count(*) INTO v_viewer_duplicate_count
    FROM (
        SELECT viewer_user_id
        FROM public.partner_links
        WHERE status IN ('pending', 'active')
        GROUP BY viewer_user_id
        HAVING count(*) > 1
    ) dupes;

    IF v_viewer_duplicate_count > 0 THEN
        RAISE EXCEPTION
            'partner-owner-viewer-migration aborted: % viewer(s) have more than one pending/active partner_links row. Resolve manually — this migration will not deactivate "extra" rows for you — then re-run.',
            v_viewer_duplicate_count;
    END IF;
END $$;

-- ---------------------------------------------------
-- 1b. Denormalized identity snapshot, captured once at invite time.
-- ---------------------------------------------------
-- users.email/name cannot be read cross-user under the owner-only RLS
-- policy on public.users, so the display name/email each side needs is
-- captured once when the invite is created, rather than requiring a
-- cross-user table read later. owner_name/owner_email are the inviting
-- owner's own canonical public.users row, loaded server-side inside
-- create_partner_invite() via auth.uid() — never the caller-supplied
-- p_owner_name/p_owner_email arguments (see section 7, trust-boundary
-- hardening note). viewer_email is the matched viewer account's own
-- canonical public.users.email, not necessarily the exact string the
-- caller typed (see the case-insensitive match in section 7).
ALTER TABLE public.partner_links ADD COLUMN IF NOT EXISTS owner_name text;
ALTER TABLE public.partner_links ADD COLUMN IF NOT EXISTS owner_email text;
ALTER TABLE public.partner_links ADD COLUMN IF NOT EXISTS viewer_email text;

-- ---------------------------------------------------
-- 2. Fix unsafe default: new links must start pending, not active
-- ---------------------------------------------------
ALTER TABLE public.partner_links ALTER COLUMN status SET DEFAULT 'pending';

-- ---------------------------------------------------
-- 3. Status CHECK constraint
-- ---------------------------------------------------
-- Data safety for this constraint was already verified automatically in
-- section 1a above (check 1) — if any existing row violated this, the
-- transaction already aborted before reaching this line.
ALTER TABLE public.partner_links DROP CONSTRAINT IF EXISTS partner_links_status_check;
ALTER TABLE public.partner_links
    ADD CONSTRAINT partner_links_status_check
    CHECK (status IN ('pending', 'active', 'inactive', 'declined'));

-- ---------------------------------------------------
-- 3b. Self-relationship prevention (database-enforced, not just API-checked)
-- ---------------------------------------------------
-- Data safety for this constraint was already verified automatically in
-- section 1a above (check 2).
ALTER TABLE public.partner_links DROP CONSTRAINT IF EXISTS partner_links_not_self_check;
ALTER TABLE public.partner_links
    ADD CONSTRAINT partner_links_not_self_check
    CHECK (owner_user_id <> viewer_user_id);

-- ---------------------------------------------------
-- 3c. Relationship cardinality — V1 is single-partner per side.
-- ---------------------------------------------------
-- The existing UNIQUE(owner_user_id, viewer_user_id) constraint (carried
-- over, under its renamed columns, from intimacy-schema.sql) only prevents
-- duplicate rows for the exact same pair. It does NOT prevent one owner
-- from having pending/active connections with two DIFFERENT viewers at
-- once, which is what made get_partner_shared_data()'s "pick one active
-- row" behavior arbitrary rather than provably safe.
--
-- Data safety for these two indexes was already verified automatically in
-- section 1a above (checks 4 and 5).
--
-- Phase 2 note: multi-partner support can be reintroduced later simply by
-- dropping these two indexes — no data migration is required either way.
CREATE UNIQUE INDEX IF NOT EXISTS partner_links_one_pending_or_active_per_owner
    ON public.partner_links (owner_user_id)
    WHERE status IN ('pending', 'active');

CREATE UNIQUE INDEX IF NOT EXISTS partner_links_one_pending_or_active_per_viewer
    ON public.partner_links (viewer_user_id)
    WHERE status IN ('pending', 'active');

-- ---------------------------------------------------
-- 4. RLS — reads only. Writes are NOT permitted via generic table access.
-- ---------------------------------------------------
-- Mutation hardening decision: rather than trying to prove that a generic
-- RLS-gated UPDATE cannot also smuggle a change to owner_user_id/
-- viewer_user_id alongside an allowed status change (which would require
-- reasoning about column-level GRANTs layered under RLS — more moving
-- parts, harder to audit, easier to misconfigure), every mutation on this
-- table is moved into a narrow SECURITY DEFINER function (section 5) that
-- performs exactly one hand-written UPDATE/INSERT statement with a fixed
-- SET list. The browser (and our own API route, which uses the same
-- RLS-scoped, non-privileged client) has NO INSERT or UPDATE policy on
-- this table at all — every write must go through
-- create_partner_invite() / accept_partner_invite() /
-- decline_partner_invite() / revoke_partner_link(). This is the simpler
-- property to audit: "can this role INSERT/UPDATE this table directly?"
-- is now just "no," full stop, rather than "only in these specific ways we
-- hope the policy expresses correctly."
DROP POLICY IF EXISTS "partner_links_owner_or_partner" ON public.partner_links;
DROP POLICY IF EXISTS "partner_links_owner_insert" ON public.partner_links;
DROP POLICY IF EXISTS "partner_links_owner_or_viewer_select" ON public.partner_links;
DROP POLICY IF EXISTS "partner_links_owner_insert_v2" ON public.partner_links;
DROP POLICY IF EXISTS "partner_links_viewer_respond" ON public.partner_links;
DROP POLICY IF EXISTS "partner_links_owner_revoke" ON public.partner_links;

-- Either side of the relationship can see the link row. Reads were never
-- the concern here — both parties are already allowed to know a
-- relationship between them exists and its status.
CREATE POLICY "partner_links_owner_or_viewer_select"
    ON public.partner_links FOR SELECT
    USING (auth.uid() IN (owner_user_id, viewer_user_id));

-- Deliberately no INSERT policy, no UPDATE policy, no DELETE policy.
-- All writes go through the SECURITY DEFINER functions in section 5,
-- which bypass RLS as the function owner and enforce their own narrow
-- authorization instead.

-- ---------------------------------------------------
-- 5. Privileged, filtered read: get_partner_shared_data()
-- ---------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_partner_shared_data()
RETURNS TABLE (
    owner_name text,
    share_with_partner boolean,
    share_cycle_phase boolean,
    share_mood boolean,
    today_phase text,
    today_mood integer,
    today_energy integer,
    recent_activity jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_viewer uuid := auth.uid();
    v_owner uuid;
    v_privacy jsonb;
    v_share_with_partner boolean;
    v_share_cycle_phase boolean;
    v_share_mood boolean;
    v_today date := CURRENT_DATE;
    v_phase text;
    v_mood integer;
    v_energy integer;
BEGIN
    IF v_viewer IS NULL THEN
        RAISE EXCEPTION 'not authenticated';
    END IF;

    -- Cardinality is now guaranteed by the partial unique indexes in 3c:
    -- at most one pending-or-active row can exist per viewer, so this
    -- LIMIT 1 is a defensive backstop, not the actual safety mechanism.
    SELECT pl.owner_user_id INTO v_owner
    FROM public.partner_links pl
    WHERE pl.viewer_user_id = v_viewer AND pl.status = 'active'
    LIMIT 1;

    IF v_owner IS NULL THEN
        RETURN; -- no active connection: zero rows, caller treats as "not connected"
    END IF;

    SELECT u.name, u.privacy_settings INTO owner_name, v_privacy
    FROM public.users u
    WHERE u.id = v_owner;

    v_share_with_partner := COALESCE((v_privacy ->> 'share_with_partner')::boolean, false);
    v_share_cycle_phase := v_share_with_partner AND COALESCE((v_privacy ->> 'share_cycle_phase')::boolean, false);
    v_share_mood := v_share_with_partner AND COALESCE((v_privacy ->> 'share_mood')::boolean, false);

    share_with_partner := v_share_with_partner;
    share_cycle_phase := v_share_cycle_phase;
    share_mood := v_share_mood;
    today_phase := NULL;
    today_mood := NULL;
    today_energy := NULL;
    recent_activity := '[]'::jsonb;

    IF NOT v_share_with_partner THEN
        RETURN NEXT;
        RETURN;
    END IF;

    IF v_share_cycle_phase OR v_share_mood THEN
        SELECT cd.phase, cd.mood, cd.energy INTO v_phase, v_mood, v_energy
        FROM public.cycle_data cd
        WHERE cd.user_id = v_owner AND cd.date = v_today;

        -- "Today" fields: always present as columns (RETURNS TABLE shape),
        -- so NULL is how "not shared" is represented here — the real value
        -- is never assigned to the column when not permitted.
        today_phase := CASE WHEN v_share_cycle_phase THEN v_phase ELSE NULL END;
        today_mood := CASE WHEN v_share_mood THEN v_mood ELSE NULL END;
        today_energy := CASE WHEN v_share_mood THEN v_energy ELSE NULL END;

        -- recent_activity: a flexible jsonb array, so here we OMIT
        -- prohibited keys entirely rather than nulling them — this is the
        -- fix for the reviewed bug, where 'phase' was previously included
        -- unconditionally regardless of share_cycle_phase. Each key is
        -- only merged into the object when its corresponding flag is true.
        SELECT COALESCE(
            jsonb_agg(
                jsonb_build_object('date', recent.date)
                || CASE WHEN v_share_cycle_phase THEN jsonb_build_object('phase', recent.phase) ELSE '{}'::jsonb END
                || CASE WHEN v_share_mood THEN jsonb_build_object('mood', recent.mood) ELSE '{}'::jsonb END
                ORDER BY recent.date DESC
            ),
            '[]'::jsonb
        )
        INTO recent_activity
        FROM (
            SELECT date, phase, mood
            FROM public.cycle_data
            WHERE user_id = v_owner AND date >= (v_today - 7)
            ORDER BY date DESC
            LIMIT 3
        ) recent;
    END IF;

    RETURN NEXT;
    RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.get_partner_shared_data() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_partner_shared_data() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_partner_shared_data() TO authenticated;

-- ---------------------------------------------------
-- 6. Partner link mutations — narrow, single-purpose RPCs only.
-- ---------------------------------------------------
-- Each function: authenticates via auth.uid(), verifies the caller holds
-- the correct role (owner or viewer) on that specific row, verifies the
-- current status before transitioning it, writes ONLY the status column
-- (never owner_user_id/viewer_user_id — those are never part of any SET
-- list below, so there is no code path in this file that can change who a
-- relationship is between once created), and returns just enough of the
-- row for the UI, never more.

CREATE OR REPLACE FUNCTION public.accept_partner_invite(p_link_id uuid)
RETURNS public.partner_links
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_caller uuid := auth.uid();
    v_row public.partner_links;
BEGIN
    IF v_caller IS NULL THEN
        RAISE EXCEPTION 'not authenticated';
    END IF;

    UPDATE public.partner_links
    SET status = 'active'
    WHERE id = p_link_id
      AND viewer_user_id = v_caller
      AND status = 'pending'
    RETURNING * INTO v_row;

    IF v_row.id IS NULL THEN
        RAISE EXCEPTION 'invitation not found or not eligible to accept';
    END IF;

    RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.decline_partner_invite(p_link_id uuid)
RETURNS public.partner_links
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_caller uuid := auth.uid();
    v_row public.partner_links;
BEGIN
    IF v_caller IS NULL THEN
        RAISE EXCEPTION 'not authenticated';
    END IF;

    UPDATE public.partner_links
    SET status = 'declined'
    WHERE id = p_link_id
      AND viewer_user_id = v_caller
      AND status = 'pending'
    RETURNING * INTO v_row;

    IF v_row.id IS NULL THEN
        RAISE EXCEPTION 'invitation not found or not eligible to decline';
    END IF;

    RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_partner_link(p_link_id uuid)
RETURNS public.partner_links
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_caller uuid := auth.uid();
    v_row public.partner_links;
BEGIN
    IF v_caller IS NULL THEN
        RAISE EXCEPTION 'not authenticated';
    END IF;

    UPDATE public.partner_links
    SET status = 'inactive'
    WHERE id = p_link_id
      AND owner_user_id = v_caller
      AND status IN ('pending', 'active')
    RETURNING * INTO v_row;

    IF v_row.id IS NULL THEN
        RAISE EXCEPTION 'connection not found or not eligible to revoke';
    END IF;

    RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_partner_invite(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.decline_partner_invite(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.revoke_partner_link(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.accept_partner_invite(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.decline_partner_invite(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.revoke_partner_link(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.accept_partner_invite(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_partner_invite(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_partner_link(uuid) TO authenticated;


DROP FUNCTION IF EXISTS public.find_user_id_by_email(text);

CREATE OR REPLACE FUNCTION public.create_partner_invite(
    p_owner_name text,
    p_owner_email text,
    p_viewer_email text
)
RETURNS TABLE (
    id uuid,
    status text,
    viewer_email text,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_owner uuid := auth.uid();
    v_owner_name text;
    v_owner_email text;
    v_viewer_email_input text;
    v_viewer_id uuid;
    v_viewer_email_canonical text;
BEGIN
    IF v_owner IS NULL THEN
        RAISE EXCEPTION 'not authenticated';
    END IF;

    IF p_viewer_email IS NULL OR length(trim(p_viewer_email)) = 0 THEN
        RAISE EXCEPTION 'an email address is required';
    END IF;

    v_viewer_email_input := lower(trim(p_viewer_email));

    -- Canonical owner identity only — p_owner_name/p_owner_email are never
    -- read past this point in the function.
    SELECT u.name, u.email INTO v_owner_name, v_owner_email
    FROM public.users u
    WHERE u.id = v_owner;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'owner profile not found for the authenticated user';
    END IF;

    -- Case-insensitive, whitespace-trimmed match, so a typo in casing or
    -- spacing doesn't produce a false "no account found" — but the value
    -- actually persisted below is always the matched row's own canonical
    -- email, never the caller's original spelling.
    SELECT u.id, u.email INTO v_viewer_id, v_viewer_email_canonical
    FROM public.users u
    WHERE lower(trim(u.email)) = v_viewer_email_input
    LIMIT 1;

    IF v_viewer_id IS NULL THEN
        RAISE EXCEPTION 'no account found for that email';
    END IF;

    -- Authoritative self-invite check: resolved uuids only. Caller-
    -- supplied owner/viewer email strings are never compared for this
    -- security decision.
    IF v_viewer_id = v_owner THEN
        RAISE EXCEPTION 'cannot invite yourself';
    END IF;

    RETURN QUERY
    INSERT INTO public.partner_links (
        owner_user_id, viewer_user_id, status, owner_name, owner_email, viewer_email
    )
    VALUES (v_owner, v_viewer_id, 'pending', v_owner_name, v_owner_email, v_viewer_email_canonical)
    RETURNING partner_links.id, partner_links.status, partner_links.viewer_email, partner_links.created_at;
EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'a connection already exists with that person, or you already have an active or pending connection';
END;
$$;

REVOKE ALL ON FUNCTION public.create_partner_invite(text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_partner_invite(text, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_partner_invite(text, text, text) TO authenticated;

COMMIT;
