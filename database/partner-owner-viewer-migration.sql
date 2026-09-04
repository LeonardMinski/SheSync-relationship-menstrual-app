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
-- migration. Nothing in this file has been run against a live database.
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
-- 1b. Denormalized identity snapshot, captured once at invite time.
-- ---------------------------------------------------
-- users.email/name cannot be read cross-user under the owner-only RLS
-- policy on public.users, so the display name/email each side needs is
-- captured once when the invite is created (from data the inviter already
-- legitimately has: their own identity, and the email they typed in) rather
-- than requiring a cross-user table read later.
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
-- PRE-FLIGHT CHECK (run manually before applying, do not skip):
--   SELECT status, count(*) FROM public.partner_links
--   WHERE status NOT IN ('pending','active','inactive','declined')
--   GROUP BY status;
-- If this returns any rows, ADD CONSTRAINT below will fail loudly rather
-- than silently discarding or coercing data — resolve those rows manually
-- first (this migration deliberately does not auto-correct existing rows).
ALTER TABLE public.partner_links DROP CONSTRAINT IF EXISTS partner_links_status_check;
ALTER TABLE public.partner_links
    ADD CONSTRAINT partner_links_status_check
    CHECK (status IN ('pending', 'active', 'inactive', 'declined'));

-- ---------------------------------------------------
-- 3b. Self-relationship prevention (database-enforced, not just API-checked)
-- ---------------------------------------------------
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
-- PRE-FLIGHT CHECK (run manually before applying, do not skip):
--   SELECT owner_user_id, count(*) FROM public.partner_links
--   WHERE status IN ('pending','active') GROUP BY owner_user_id HAVING count(*) > 1;
--   SELECT viewer_user_id, count(*) FROM public.partner_links
--   WHERE status IN ('pending','active') GROUP BY viewer_user_id HAVING count(*) > 1;
-- If either returns rows, CREATE UNIQUE INDEX below will fail rather than
-- silently deactivating "extra" rows — resolve manually first. This
-- migration does not delete or deactivate any existing row.
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
GRANT EXECUTE ON FUNCTION public.accept_partner_invite(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_partner_invite(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_partner_link(uuid) TO authenticated;

-- ---------------------------------------------------
-- 7. Invite creation — atomic, and never returns the resolved viewer's id.
-- ---------------------------------------------------
-- Email-enumeration review: the previous version of this migration
-- exposed find_user_id_by_email(text) directly to every authenticated
-- client (GRANT EXECUTE ... TO authenticated). That is a genuine
-- account-existence-and-UUID lookup primitive: ANY authenticated Supabase
-- session — not just requests that happen to go through our Next.js
-- route — could call it directly against the Supabase REST/RPC endpoint
-- and enumerate arbitrary emails to real user ids and names. Routing the
-- call through our own API route does not fix this, because our route
-- uses the same RLS-scoped, non-privileged client as the browser; the
-- exposure is at the GRANT, not at our app's routing.
--
-- Fix: find_user_id_by_email() is removed. The lookup now happens INSIDE
-- a single SECURITY DEFINER function, create_partner_invite(), which
-- performs the lookup and the insert atomically and returns only the
-- fields the inviting owner's own UI needs (id/status/created_at/the
-- email they themselves typed in) — it never returns the matched
-- account's real uuid. A caller who successfully sends an invite still
-- learns "an account exists at this email" from a successful call (and
-- "no account found" from the error case below) — that narrower,
-- account-existence-only oracle is a known residual exposure, documented
-- here rather than silently left unaddressed; removing it fully would
-- require changing the product behavior (e.g. always returning success
-- and emailing non-users a signup prompt instead), which is a product
-- decision, not a migration-safety fix, and is out of scope for this
-- revision.
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
    v_viewer_id uuid;
BEGIN
    IF v_owner IS NULL THEN
        RAISE EXCEPTION 'not authenticated';
    END IF;

    IF p_viewer_email IS NULL OR length(trim(p_viewer_email)) = 0 THEN
        RAISE EXCEPTION 'an email address is required';
    END IF;

    IF lower(p_viewer_email) = lower(COALESCE(p_owner_email, '')) THEN
        RAISE EXCEPTION 'cannot invite yourself';
    END IF;

    SELECT u.id INTO v_viewer_id
    FROM public.users u
    WHERE u.email = p_viewer_email
    LIMIT 1;

    IF v_viewer_id IS NULL THEN
        RAISE EXCEPTION 'no account found for that email';
    END IF;

    IF v_viewer_id = v_owner THEN
        RAISE EXCEPTION 'cannot invite yourself';
    END IF;

    RETURN QUERY
    INSERT INTO public.partner_links (
        owner_user_id, viewer_user_id, status, owner_name, owner_email, viewer_email
    )
    VALUES (v_owner, v_viewer_id, 'pending', p_owner_name, p_owner_email, p_viewer_email)
    RETURNING partner_links.id, partner_links.status, partner_links.viewer_email, partner_links.created_at;
EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'a connection already exists with that person, or you already have an active or pending connection';
END;
$$;

REVOKE ALL ON FUNCTION public.create_partner_invite(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_partner_invite(text, text, text) TO authenticated;
