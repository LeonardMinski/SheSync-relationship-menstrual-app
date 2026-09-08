-- =====================================================
-- SheSync+ Premium Vault V1
-- =====================================================
-- Nothing in this file has been run against a live database yet.
--
-- Product model: a "Spark" is a private, owner-authored piece of intimate
-- content. It may optionally be teased (a separate, explicitly-authored
-- preview), then mutually revealed to a connected partner via the same
-- explicit two-sided ceremony shape already proven in
-- relationship-experience-v1-migration.sql's mark_session_ready /
-- reveal_session_together (ready timestamps per party, reveal only once
-- both are ready, re-checks the relationship is still active). That table
-- shape is NOT reused directly -- a Spark's content is asymmetric
-- (authored by one party, not both independently answering the same
-- prompt), so it gets its own table -- but the RPC security shape is
-- deliberately a close mirror of the proven pattern, not a new design.
--
-- Desire Decks are NOT a separate entity: a deck-originated Spark is just
-- a vault_sparks row with deck_id/deck_prompt_id set, flowing through the
-- exact same private -> tease -> reveal pipeline as any other Spark.
--
-- PRIVACY, non-negotiable (see src/types/vault.ts for the full contract):
--   - A Spark's `content` is owner-only. No RLS policy or RPC in this file
--     ever returns it to anyone but the owner, except get_revealed_spark()
--     once revealed_at is set AND the relationship is still active.
--   - Tease text is a separate field, never derived from content.
--   - A partner reading their view of another user's Vault goes through
--     RPCs only (mirrors shared_replies' zero-direct-policy pattern) --
--     there is no direct SELECT policy that could accidentally expose
--     content to a partner, structurally, regardless of Spark status.
--   - Nothing here is referenced by get_partner_shared_data() or any other
--     partner-facing function from earlier migrations.
-- =====================================================

BEGIN;

-- ---------------------------------------------------
-- 1. vault_sparks
-- ---------------------------------------------------
CREATE TABLE public.vault_sparks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    heat_level text NOT NULL CHECK (heat_level IN ('warm', 'hot', 'bold')),
    status text NOT NULL DEFAULT 'private'
        CHECK (status IN ('private', 'teased', 'waiting', 'ready_to_reveal', 'revealed', 'archived')),

    -- The private, full content. Owner-only at every status -- see RLS and
    -- get_revealed_spark() below for the one narrow exception.
    content text NOT NULL CHECK (length(trim(content)) > 0),

    -- Separate, explicitly-authored preview. Never derived from `content`.
    tease_text text NULL,

    -- Desire Deck origin, optional. A deck-originated Spark is still just a
    -- Spark -- see header comment.
    deck_id text NULL
        CHECK (deck_id IS NULL OR deck_id IN ('closer', 'desire', 'curiosity', 'slow_burn', 'give_receive', 'after_dark')),
    deck_prompt_id text NULL,
    deck_interest_level text NULL
        CHECK (deck_interest_level IS NULL OR deck_interest_level IN ('into_this', 'curious', 'maybe_someday', 'not_for_me')),

    partner_tease_response text NULL
        CHECK (partner_tease_response IS NULL OR partner_tease_response IN ('curious', 'maybe_later', 'not_tonight', 'not_for_me')),

    -- Reveal ceremony -- mirrors relationship_sessions' ready/reveal shape.
    owner_ready_at timestamptz NULL,
    partner_ready_at timestamptz NULL,
    revealed_at timestamptz NULL,
    revealed_by uuid NULL REFERENCES auth.users(id),

    owner_reaction text NULL
        CHECK (owner_reaction IS NULL OR owner_reaction IN ('love_this', 'curious', 'lets_talk_first', 'not_tonight', 'not_for_me')),
    partner_reaction text NULL
        CHECK (partner_reaction IS NULL OR partner_reaction IN ('love_this', 'curious', 'lets_talk_first', 'not_tonight', 'not_for_me')),

    archived_at timestamptz NULL,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    -- A tease can only exist once tease_text is authored; reveal can only
    -- happen after a tease OR via the direct-share path (see
    -- share_spark_directly) -- enforced in the RPCs below, not by a CHECK,
    -- since "direct share" legitimately skips straight to revealed.
    CONSTRAINT vault_sparks_teased_needs_text
        CHECK (status = 'private' OR status = 'archived' OR tease_text IS NOT NULL OR status = 'revealed')
);

CREATE INDEX vault_sparks_user_status_idx ON public.vault_sparks (user_id, status, created_at DESC);

CREATE TRIGGER vault_sparks_set_updated_at
    BEFORE UPDATE ON public.vault_sparks
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------
-- 2. vault_afterglow_reflections
-- ---------------------------------------------------
-- A revealed Spark may get up to one reflection per participant -- not a
-- single-row-per-spark shape, so this is its own table. Always private to
-- its author; a "mutual" Afterglow (both authored a positive reflection)
-- is derived at read time by the API, never stored as its own row.
CREATE TABLE public.vault_afterglow_reflections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    spark_id uuid NOT NULL REFERENCES public.vault_sparks(id) ON DELETE CASCADE,
    author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction text NOT NULL CHECK (reaction IN ('loved_it', 'liked_it', 'not_sure', 'not_for_me')),
    note text NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT vault_afterglow_one_per_author UNIQUE (spark_id, author_id)
);

-- ---------------------------------------------------
-- 3. Cross-table invariant: reflections may only be authored by a
-- participant (owner or the currently-active partner) of an already
-- REVEALED spark. Deliberately not SECURITY DEFINER -- runs as the
-- inserting role, so RLS on vault_sparks already hides unowned rows from
-- the owner-only path; the partner path is validated explicitly below
-- since partners have no direct RLS access to vault_sparks at all.
-- ---------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_vault_afterglow_reflection()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_spark record;
    v_is_partner boolean;
BEGIN
    SELECT user_id, revealed_at INTO v_spark FROM public.vault_sparks WHERE id = NEW.spark_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'vault_afterglow_reflections.spark_id does not reference an existing spark';
    END IF;

    IF v_spark.revealed_at IS NULL THEN
        RAISE EXCEPTION 'cannot reflect on a Spark before it has been revealed';
    END IF;

    IF NEW.author_id = v_spark.user_id THEN
        RETURN NEW;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.partner_links pl
        WHERE pl.status = 'active'
          AND ((pl.owner_user_id = v_spark.user_id AND pl.viewer_user_id = NEW.author_id)
            OR (pl.owner_user_id = NEW.author_id AND pl.viewer_user_id = v_spark.user_id))
    ) INTO v_is_partner;

    IF NOT v_is_partner THEN
        RAISE EXCEPTION 'author_id is not the Spark owner or an active partner';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER vault_afterglow_reflections_validate
    BEFORE INSERT OR UPDATE ON public.vault_afterglow_reflections
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_vault_afterglow_reflection();

-- ---------------------------------------------------
-- 4. RLS
-- ---------------------------------------------------
ALTER TABLE public.vault_sparks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_afterglow_reflections ENABLE ROW LEVEL SECURITY;

-- Owner-only, matching the periods/period_day_logs precedent exactly. No
-- partner SELECT policy exists here at all, on purpose -- every partner
-- read goes through the narrow RPCs below instead, so there is no direct
-- table path that could ever accidentally return `content` to a partner.
CREATE POLICY "Owner can view own sparks" ON public.vault_sparks
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owner can insert own sparks" ON public.vault_sparks
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner can update own sparks" ON public.vault_sparks
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owner can delete own sparks" ON public.vault_sparks
    FOR DELETE USING (auth.uid() = user_id);

-- Reflections: each author can read/write their own row directly. Reading
-- the OTHER participant's reflection (to know whether Afterglow was
-- mutual) requires get_afterglow_reflections() below, never a direct
-- query -- same shape as relationship_session_answers.
CREATE POLICY "Author can view own reflection" ON public.vault_afterglow_reflections
    FOR SELECT USING (auth.uid() = author_id);
CREATE POLICY "Author can insert own reflection" ON public.vault_afterglow_reflections
    FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Author can update own reflection" ON public.vault_afterglow_reflections
    FOR UPDATE USING (auth.uid() = author_id);

-- ---------------------------------------------------
-- 5. RPCs -- helper to resolve "my current active partner" (identical
-- lookup used throughout relationship-experience-v1-migration.sql).
-- ---------------------------------------------------
CREATE OR REPLACE FUNCTION public._active_partner_of(p_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public
AS $$
    SELECT CASE WHEN pl.owner_user_id = p_user_id THEN pl.viewer_user_id ELSE pl.owner_user_id END
    FROM public.partner_links pl
    WHERE pl.status = 'active' AND (pl.owner_user_id = p_user_id OR pl.viewer_user_id = p_user_id)
    LIMIT 1;
$$;

-- Owner authors a tease. private -> teased.
CREATE OR REPLACE FUNCTION public.create_vault_tease(p_spark_id uuid, p_tease_text text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_caller uuid := auth.uid();
    v_spark public.vault_sparks;
BEGIN
    IF v_caller IS NULL THEN
        RAISE EXCEPTION 'not authenticated';
    END IF;
    IF trim(coalesce(p_tease_text, '')) = '' THEN
        RAISE EXCEPTION 'tease text is required';
    END IF;

    SELECT * INTO v_spark FROM public.vault_sparks WHERE id = p_spark_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'spark not found';
    END IF;
    IF v_spark.user_id <> v_caller THEN
        RAISE EXCEPTION 'not the owner of this spark';
    END IF;
    IF v_spark.status <> 'private' THEN
        RAISE EXCEPTION 'a tease can only be created from a private spark';
    END IF;

    UPDATE public.vault_sparks
    SET tease_text = p_tease_text, status = 'teased'
    WHERE id = p_spark_id;
END;
$$;

-- Owner skips the tease/ceremony entirely and reveals immediately. Still
-- requires a currently active partner -- there is nowhere to reveal to
-- otherwise.
CREATE OR REPLACE FUNCTION public.share_vault_spark_directly(p_spark_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_caller uuid := auth.uid();
    v_spark public.vault_sparks;
BEGIN
    IF v_caller IS NULL THEN
        RAISE EXCEPTION 'not authenticated';
    END IF;

    SELECT * INTO v_spark FROM public.vault_sparks WHERE id = p_spark_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'spark not found';
    END IF;
    IF v_spark.user_id <> v_caller THEN
        RAISE EXCEPTION 'not the owner of this spark';
    END IF;
    IF v_spark.status NOT IN ('private', 'teased', 'waiting') THEN
        RAISE EXCEPTION 'this spark cannot be shared directly from its current status';
    END IF;
    IF public._active_partner_of(v_caller) IS NULL THEN
        RAISE EXCEPTION 'no active partner relationship to share with';
    END IF;

    UPDATE public.vault_sparks
    SET status = 'revealed', revealed_at = now(), revealed_by = v_caller
    WHERE id = p_spark_id;
END;
$$;

-- Partner responds to a received tease. Only the active partner of the
-- spark's owner may call this.
CREATE OR REPLACE FUNCTION public.respond_to_vault_tease(p_spark_id uuid, p_response text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_caller uuid := auth.uid();
    v_spark public.vault_sparks;
BEGIN
    IF v_caller IS NULL THEN
        RAISE EXCEPTION 'not authenticated';
    END IF;
    IF p_response NOT IN ('curious', 'maybe_later', 'not_tonight', 'not_for_me') THEN
        RAISE EXCEPTION 'invalid response';
    END IF;

    SELECT * INTO v_spark FROM public.vault_sparks WHERE id = p_spark_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'spark not found';
    END IF;
    IF v_spark.status <> 'teased' THEN
        RAISE EXCEPTION 'this spark is not awaiting a tease response';
    END IF;
    IF public._active_partner_of(v_spark.user_id) <> v_caller THEN
        RAISE EXCEPTION 'not the active partner of this spark''s owner';
    END IF;

    UPDATE public.vault_sparks
    SET partner_tease_response = p_response,
        status = CASE WHEN p_response = 'curious' THEN 'waiting' ELSE status END
    WHERE id = p_spark_id;
END;
$$;

-- Owner or partner marks themselves ready for the reveal ceremony. Never
-- sets revealed_at itself -- mirrors mark_session_ready exactly.
CREATE OR REPLACE FUNCTION public.mark_vault_spark_ready(p_spark_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_caller uuid := auth.uid();
    v_spark public.vault_sparks;
BEGIN
    IF v_caller IS NULL THEN
        RAISE EXCEPTION 'not authenticated';
    END IF;

    SELECT * INTO v_spark FROM public.vault_sparks WHERE id = p_spark_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'spark not found';
    END IF;
    IF v_spark.status NOT IN ('waiting', 'ready_to_reveal') THEN
        RAISE EXCEPTION 'this spark is not in the reveal ceremony';
    END IF;

    IF v_caller = v_spark.user_id THEN
        UPDATE public.vault_sparks SET owner_ready_at = now(), status = 'ready_to_reveal' WHERE id = p_spark_id;
    ELSIF public._active_partner_of(v_spark.user_id) = v_caller THEN
        UPDATE public.vault_sparks SET partner_ready_at = now(), status = 'ready_to_reveal' WHERE id = p_spark_id;
    ELSE
        RAISE EXCEPTION 'not a participant in this spark''s reveal';
    END IF;
END;
$$;

-- The ONLY function that may set revealed_at via the ceremony path.
-- Idempotent, requires both ready and a currently active relationship --
-- mirrors reveal_session_together exactly.
CREATE OR REPLACE FUNCTION public.reveal_vault_spark_together(p_spark_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_caller uuid := auth.uid();
    v_spark public.vault_sparks;
BEGIN
    IF v_caller IS NULL THEN
        RAISE EXCEPTION 'not authenticated';
    END IF;

    SELECT * INTO v_spark FROM public.vault_sparks WHERE id = p_spark_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'spark not found';
    END IF;
    IF v_caller <> v_spark.user_id AND public._active_partner_of(v_spark.user_id) <> v_caller THEN
        RAISE EXCEPTION 'not a participant in this spark''s reveal';
    END IF;

    IF v_spark.status = 'revealed' THEN
        RETURN;
    END IF;

    IF v_spark.owner_ready_at IS NULL OR v_spark.partner_ready_at IS NULL THEN
        RAISE EXCEPTION 'both participants must be ready before revealing';
    END IF;
    IF public._active_partner_of(v_spark.user_id) IS NULL THEN
        RAISE EXCEPTION 'relationship is no longer active';
    END IF;

    UPDATE public.vault_sparks
    SET status = 'revealed', revealed_at = now(), revealed_by = v_caller
    WHERE id = p_spark_id;
END;
$$;

-- Either participant reacts to an already-revealed spark.
CREATE OR REPLACE FUNCTION public.react_to_revealed_vault_spark(p_spark_id uuid, p_reaction text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_caller uuid := auth.uid();
    v_spark public.vault_sparks;
BEGIN
    IF v_caller IS NULL THEN
        RAISE EXCEPTION 'not authenticated';
    END IF;
    IF p_reaction NOT IN ('love_this', 'curious', 'lets_talk_first', 'not_tonight', 'not_for_me') THEN
        RAISE EXCEPTION 'invalid reaction';
    END IF;

    SELECT * INTO v_spark FROM public.vault_sparks WHERE id = p_spark_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'spark not found';
    END IF;
    IF v_spark.status <> 'revealed' THEN
        RAISE EXCEPTION 'this spark has not been revealed yet';
    END IF;

    IF v_caller = v_spark.user_id THEN
        UPDATE public.vault_sparks SET owner_reaction = p_reaction WHERE id = p_spark_id;
    ELSIF public._active_partner_of(v_spark.user_id) = v_caller THEN
        UPDATE public.vault_sparks SET partner_reaction = p_reaction WHERE id = p_spark_id;
    ELSE
        RAISE EXCEPTION 'not a participant in this spark';
    END IF;
END;
$$;

-- The ONLY way for a partner to read a revealed spark's full content.
-- Requires revealed_at IS NOT NULL and a currently active relationship --
-- mirrors get_session_answers exactly. The owner may also call this (it
-- simply returns their own row), so the API has one uniform read path for
-- both sides of a revealed spark.
CREATE OR REPLACE FUNCTION public.get_revealed_vault_spark(p_spark_id uuid)
RETURNS TABLE (
    id uuid, heat_level text, content text, revealed_at timestamptz,
    owner_reaction text, partner_reaction text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_caller uuid := auth.uid();
    v_spark public.vault_sparks;
BEGIN
    IF v_caller IS NULL THEN
        RAISE EXCEPTION 'not authenticated';
    END IF;

    SELECT * INTO v_spark FROM public.vault_sparks WHERE id = p_spark_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'spark not found';
    END IF;
    IF v_spark.revealed_at IS NULL THEN
        RAISE EXCEPTION 'this spark has not been revealed';
    END IF;

    IF v_caller <> v_spark.user_id THEN
        IF public._active_partner_of(v_spark.user_id) <> v_caller THEN
            RAISE EXCEPTION 'not a participant in this spark';
        END IF;
    END IF;

    RETURN QUERY
    SELECT v_spark.id, v_spark.heat_level, v_spark.content, v_spark.revealed_at,
           v_spark.owner_reaction, v_spark.partner_reaction;
END;
$$;

-- Narrow, partner-facing summary of the caller's active partner's Vault --
-- structurally cannot return `content`: that column is never referenced
-- anywhere in this function. Excludes 'private' and 'archived' sparks
-- entirely, since there is nothing shareable about either.
CREATE OR REPLACE FUNCTION public.get_partner_vault_summary()
RETURNS TABLE (
    id uuid, heat_level text, status text, tease_text text,
    owner_ready_at timestamptz, partner_ready_at timestamptz,
    revealed_at timestamptz, created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_caller uuid := auth.uid();
    v_owner_id uuid;
BEGIN
    IF v_caller IS NULL THEN
        RAISE EXCEPTION 'not authenticated';
    END IF;

    v_owner_id := public._active_partner_of(v_caller);
    IF v_owner_id IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT s.id, s.heat_level, s.status, s.tease_text,
           s.owner_ready_at, s.partner_ready_at, s.revealed_at, s.created_at
    FROM public.vault_sparks s
    WHERE s.user_id = v_owner_id
      AND s.status NOT IN ('private', 'archived')
    ORDER BY s.created_at DESC;
END;
$$;

-- Both participants' Afterglow reflections for one spark, once at least
-- one exists -- mirrors get_session_answers' "read the other side, but
-- only through this function" shape.
CREATE OR REPLACE FUNCTION public.get_vault_afterglow_reflections(p_spark_id uuid)
RETURNS TABLE (author_id uuid, reaction text, note text, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_caller uuid := auth.uid();
    v_spark public.vault_sparks;
BEGIN
    IF v_caller IS NULL THEN
        RAISE EXCEPTION 'not authenticated';
    END IF;

    SELECT * INTO v_spark FROM public.vault_sparks WHERE id = p_spark_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'spark not found';
    END IF;
    IF v_caller <> v_spark.user_id AND public._active_partner_of(v_spark.user_id) <> v_caller THEN
        RAISE EXCEPTION 'not a participant in this spark';
    END IF;

    RETURN QUERY
    SELECT r.author_id, r.reaction, r.note, r.created_at
    FROM public.vault_afterglow_reflections r
    WHERE r.spark_id = p_spark_id;
END;
$$;

-- ---------------------------------------------------
-- 6. Extend the existing source-scoped reply system (see
-- relationship-experience-v1-migration.sql) with a new source type for
-- Vault's focused conversation, rather than building parallel messaging
-- infrastructure. A caller may read/reply on a spark's conversation only
-- once it has been revealed, and only as the owner or the active partner
-- -- identical shape to the 'relationship_session' branch this mirrors.
-- ---------------------------------------------------
CREATE OR REPLACE FUNCTION public._has_reply_source_access(p_source_type text, p_source_id uuid, p_caller uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_partner_id uuid;
BEGIN
    IF p_source_type = 'partner_context' THEN
        SELECT CASE WHEN pl.owner_user_id = p_caller THEN pl.viewer_user_id ELSE pl.owner_user_id END
        INTO v_partner_id
        FROM public.partner_links pl
        WHERE pl.status = 'active' AND (pl.owner_user_id = p_caller OR pl.viewer_user_id = p_caller)
        LIMIT 1;

        RETURN EXISTS (
            SELECT 1 FROM public.partner_contexts pc
            WHERE pc.id = p_source_id
              AND (pc.owner_user_id = p_caller
                OR (pc.owner_user_id = v_partner_id AND pc.status = 'shared'))
        );
    ELSIF p_source_type = 'appreciation' THEN
        RETURN EXISTS (
            SELECT 1 FROM public.relationship_appreciations ra
            WHERE ra.id = p_source_id AND p_caller IN (ra.sender_id, ra.recipient_id)
        );
    ELSIF p_source_type = 'relationship_session' THEN
        RETURN EXISTS (
            SELECT 1 FROM public.relationship_sessions s
            WHERE s.id = p_source_id
              AND p_caller IN (s.initiator_id, s.partner_id)
              AND s.revealed_at IS NOT NULL
        );
    ELSIF p_source_type = 'vault_spark' THEN
        RETURN EXISTS (
            SELECT 1 FROM public.vault_sparks vs
            WHERE vs.id = p_source_id
              AND vs.revealed_at IS NOT NULL
              AND (vs.user_id = p_caller OR public._active_partner_of(vs.user_id) = p_caller)
        );
    END IF;

    RETURN false;
END;
$$;

-- ---------------------------------------------------
-- 7. PRIVILEGES -- identical hardening to every existing RPC in this
-- codebase: explicit REVOKE from PUBLIC and anon, GRANT only to
-- authenticated.
-- ---------------------------------------------------
REVOKE ALL ON FUNCTION public._active_partner_of(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public._active_partner_of(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public._active_partner_of(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.create_vault_tease(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_vault_tease(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_vault_tease(uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.share_vault_spark_directly(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.share_vault_spark_directly(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.share_vault_spark_directly(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.respond_to_vault_tease(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.respond_to_vault_tease(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.respond_to_vault_tease(uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.mark_vault_spark_ready(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.mark_vault_spark_ready(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.mark_vault_spark_ready(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.reveal_vault_spark_together(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reveal_vault_spark_together(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.reveal_vault_spark_together(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.react_to_revealed_vault_spark(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.react_to_revealed_vault_spark(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.react_to_revealed_vault_spark(uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.get_revealed_vault_spark(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_revealed_vault_spark(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_revealed_vault_spark(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.get_partner_vault_summary() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_partner_vault_summary() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_partner_vault_summary() TO authenticated;

REVOKE ALL ON FUNCTION public.get_vault_afterglow_reflections(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_vault_afterglow_reflections(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_vault_afterglow_reflections(uuid) TO authenticated;

-- _has_reply_source_access / get_replies / add_reply privileges were
-- already granted in relationship-experience-v1-migration.sql; replacing
-- the function body here (CREATE OR REPLACE) does not change those grants.

-- Explicit table-level anon lockout, matching the standard this codebase
-- holds itself to since the Coach Security Closure pass (see
-- coach-security-hardening-migration.sql) -- RLS already blocks anon via
-- auth.uid() IS NULL, this is defense-in-depth on top of that.
REVOKE ALL ON public.vault_sparks FROM PUBLIC, anon;
REVOKE ALL ON public.vault_afterglow_reflections FROM PUBLIC, anon;

COMMIT;
