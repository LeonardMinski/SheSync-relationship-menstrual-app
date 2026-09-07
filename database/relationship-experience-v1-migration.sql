-- RELATIONSHIP EXPERIENCE V1
--
-- Adds the domain for: Support Preferences, Partner Translation, Weekly Us,
-- Mutual Reveal, Repair Space, Appreciations, Relationship Memory, and
-- source-scoped Replies.
--
-- ARCHITECTURE
--
-- public.partner_links (owner_user_id, viewer_user_id, status) remains the
-- SINGLE source of truth for "is there an active relationship." No table
-- below stores its own copy of relationship membership. Every cross-party
-- read re-checks partner_links.status = 'active' live, at query time. This
-- means a disconnect (status leaving 'active') automatically revokes access
-- to everything below, for both former partners, immediately -- with no
-- separate per-table revocation step required. See RULE (Phase 27).
--
-- Two access patterns are used, matching which of these is true for each
-- table:
--
-- (a) SIMPLE OWNED CONTENT (support_preferences, partner_contexts,
--     relationship_appreciations, relationship_memories): the owner
--     writes their own row directly (plain RLS, no RPC needed -- only the
--     owner can ever write their own row, so there is no cross-party trust
--     boundary at write time). A second party may SELECT it only when the
--     row is marked shared/sent AND there is currently an active
--     relationship between the two. This mirrors the plain owner-only RLS
--     already used on cycle_data/periods.
--
-- (b) TWO-PARTY REVEAL SESSIONS (relationship_sessions +
--     relationship_session_answers, backing Weekly Us / Mutual Reveal /
--     Repair): a genuine cross-party trust boundary exists at the moment
--     of reveal -- a naive UPDATE would let either party set revealed_at
--     early, or read the other's answer before both are ready. Answers
--     table therefore carries NO cross-party SELECT policy at all (you can
--     only ever directly select your own answer rows); all state
--     transitions (start/answer/ready/reveal) and all cross-party reads go
--     through narrow SECURITY DEFINER RPCs, exactly like the existing
--     create_partner_invite/accept_partner_invite/revoke_partner_link
--     pattern in partner-owner-viewer-migration.sql.
--
-- Replies inherit access from their source record rather than duplicating
-- authorization logic: reading/writing a reply requires the caller to
-- currently have legitimate read access to the source row, re-derived at
-- call time via the same SECURITY DEFINER RPC pattern.
--
-- Every SECURITY DEFINER function below: sets search_path explicitly,
-- checks auth.uid() for null, verifies the caller is an authorized
-- participant via a WHERE clause (never trusts a caller-supplied identity),
-- and is REVOKEd from PUBLIC/anon then GRANTed only to authenticated --
-- identical hardening to the existing partner RPCs.

BEGIN;

-- ==================================================================
-- 1. SUPPORT PREFERENCES
-- ==================================================================
-- One row per (owner, context). V1 contexts are fixed: overwhelmed, upset,
-- difficult_period_day. Everything starts private (is_shared = false).
-- Owner edits/shares/unshares via plain owner-only RLS -- no RPC needed,
-- since only the owner ever writes their own row.

CREATE TABLE IF NOT EXISTS public.support_preferences (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    context text NOT NULL CHECK (context IN ('overwhelmed', 'upset', 'difficult_period_day')),
    preferred_supports text[] NOT NULL DEFAULT '{}',
    what_does_not_help text[] NOT NULL DEFAULT '{}',
    additional_context text,
    is_shared boolean NOT NULL DEFAULT false,
    shared_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (owner_user_id, context)
);

-- Structured chip vocabulary is enforced at the API/Zod layer (like
-- cycle_data's symptoms text[]), not a DB CHECK -- keeps the column
-- flexible if the chip set is refined without a migration.

ALTER TABLE public.support_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view own support preferences" ON public.support_preferences
    FOR SELECT USING (auth.uid() = owner_user_id);

CREATE POLICY "Partner can view shared support preferences" ON public.support_preferences
    FOR SELECT USING (
        is_shared = true
        AND EXISTS (
            SELECT 1 FROM public.partner_links pl
            WHERE pl.status = 'active'
              AND pl.owner_user_id = support_preferences.owner_user_id
              AND pl.viewer_user_id = auth.uid()
        )
    );

CREATE POLICY "Owner can insert own support preferences" ON public.support_preferences
    FOR INSERT WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Owner can update own support preferences" ON public.support_preferences
    FOR UPDATE USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);

CREATE TRIGGER support_preferences_set_updated_at
    BEFORE UPDATE ON public.support_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================================================================
-- 2. PARTNER TRANSLATION (partner_contexts)
-- ==================================================================
-- One draft-or-shared translation per owner at a time (V1: single current
-- translation, matching the composer design's single-card model). Revoke
-- moves status back to 'draft' -- partner loses access immediately since
-- read access requires status = 'shared'.

CREATE TABLE IF NOT EXISTS public.partner_contexts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    what_they_should_know text NOT NULL DEFAULT '',
    might_help text[] NOT NULL DEFAULT '{}',
    dont_need text[] NOT NULL DEFAULT '{}',
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'shared', 'revoked')),
    shared_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (owner_user_id)
);

ALTER TABLE public.partner_contexts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view own partner context" ON public.partner_contexts
    FOR SELECT USING (auth.uid() = owner_user_id);

CREATE POLICY "Partner can view shared partner context" ON public.partner_contexts
    FOR SELECT USING (
        status = 'shared'
        AND EXISTS (
            SELECT 1 FROM public.partner_links pl
            WHERE pl.status = 'active'
              AND pl.owner_user_id = partner_contexts.owner_user_id
              AND pl.viewer_user_id = auth.uid()
        )
    );

CREATE POLICY "Owner can insert own partner context" ON public.partner_contexts
    FOR INSERT WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Owner can update own partner context" ON public.partner_contexts
    FOR UPDATE USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);

CREATE TRIGGER partner_contexts_set_updated_at
    BEFORE UPDATE ON public.partner_contexts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================================================================
-- 3. APPRECIATIONS
-- ==================================================================
-- Sender always keeps their own sent history (their own authored content).
-- Recipient can read it only while the relationship is currently active --
-- consistent with every other domain below.

CREATE TABLE IF NOT EXISTS public.relationship_appreciations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    recipient_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    content text NOT NULL,
    sent_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT relationship_appreciations_not_self CHECK (sender_id <> recipient_id)
);

ALTER TABLE public.relationship_appreciations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sender can view own sent appreciations" ON public.relationship_appreciations
    FOR SELECT USING (auth.uid() = sender_id);

CREATE POLICY "Recipient can view appreciations while relationship is active" ON public.relationship_appreciations
    FOR SELECT USING (
        auth.uid() = recipient_id
        AND EXISTS (
            SELECT 1 FROM public.partner_links pl
            WHERE pl.status = 'active'
              AND ((pl.owner_user_id = sender_id AND pl.viewer_user_id = recipient_id)
                OR (pl.owner_user_id = recipient_id AND pl.viewer_user_id = sender_id))
        )
    );

CREATE POLICY "Sender can send appreciation to a currently active partner" ON public.relationship_appreciations
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT 1 FROM public.partner_links pl
            WHERE pl.status = 'active'
              AND ((pl.owner_user_id = sender_id AND pl.viewer_user_id = recipient_id)
                OR (pl.owner_user_id = recipient_id AND pl.viewer_user_id = sender_id))
        )
    );

-- ==================================================================
-- 4. TWO-PARTY REVEAL SESSIONS (Weekly Us / Mutual Reveal / Repair)
-- ==================================================================
-- Shared foundation for all three -- same privacy lifecycle:
--   start -> each participant answers privately -> each marks ready
--   -> both ready -> EXPLICIT reveal_session_together() -> revealed
--
-- relationship_sessions row is visible to both participants (metadata
-- only: type, category, prompts, ready flags, revealed_at -- never answer
-- content), gated on a currently active relationship. All content access
-- and all state transitions go through RPCs below; there is deliberately
-- NO direct INSERT/UPDATE policy on either table.

CREATE TABLE IF NOT EXISTS public.relationship_sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    session_type text NOT NULL CHECK (session_type IN ('weekly_us', 'mutual_reveal', 'repair')),
    category text CHECK (
        category IS NULL
        OR category IN ('affection', 'future', 'communication', 'quality_time', 'intimacy', 'support')
    ),
    prompts jsonb NOT NULL,
    initiator_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    partner_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    initiator_ready_at timestamptz,
    partner_ready_at timestamptz,
    revealed_at timestamptz,
    revealed_by uuid REFERENCES public.users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT relationship_sessions_not_self CHECK (initiator_id <> partner_id),
    -- category is required for mutual_reveal (one prompt per category) and
    -- must be absent for weekly_us/repair (fixed curated prompt sets).
    CONSTRAINT relationship_sessions_category_matches_type CHECK (
        (session_type = 'mutual_reveal' AND category IS NOT NULL)
        OR (session_type <> 'mutual_reveal' AND category IS NULL)
    )
);

CREATE TABLE IF NOT EXISTS public.relationship_session_answers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id uuid REFERENCES public.relationship_sessions(id) ON DELETE CASCADE NOT NULL,
    answerer_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    prompt_key text NOT NULL,
    answer_text text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (session_id, answerer_id, prompt_key)
);

ALTER TABLE public.relationship_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationship_session_answers ENABLE ROW LEVEL SECURITY;

-- Session metadata: both participants, only while relationship is active.
-- No INSERT/UPDATE policy -- start_session()/mark_session_ready()/
-- reveal_session_together() are the only way to write this table.
CREATE POLICY "Participants can view session metadata while relationship active" ON public.relationship_sessions
    FOR SELECT USING (
        auth.uid() IN (initiator_id, partner_id)
        AND EXISTS (
            SELECT 1 FROM public.partner_links pl
            WHERE pl.status = 'active'
              AND ((pl.owner_user_id = initiator_id AND pl.viewer_user_id = partner_id)
                OR (pl.owner_user_id = partner_id AND pl.viewer_user_id = initiator_id))
        )
    );

-- Answers: you may only ever directly SELECT your own answer rows. Reading
-- the other participant's (post-reveal) answers requires
-- get_session_answers() below -- never a direct table query. No
-- INSERT/UPDATE policy -- submit_session_answer() is the only writer.
CREATE POLICY "Answerer can view own session answers" ON public.relationship_session_answers
    FOR SELECT USING (auth.uid() = answerer_id);

-- ---- RPCs ----

CREATE OR REPLACE FUNCTION public.start_relationship_session(
    p_session_type text,
    p_category text,
    p_prompts jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_initiator uuid := auth.uid();
    v_partner_id uuid;
    v_session_id uuid;
BEGIN
    IF v_initiator IS NULL THEN
        RAISE EXCEPTION 'not authenticated';
    END IF;

    -- Resolve the caller's current active partner in either direction --
    -- the same "who is my partner right now" lookup used everywhere else,
    -- never a caller-supplied partner id.
    SELECT CASE WHEN pl.owner_user_id = v_initiator THEN pl.viewer_user_id ELSE pl.owner_user_id END
    INTO v_partner_id
    FROM public.partner_links pl
    WHERE pl.status = 'active'
      AND (pl.owner_user_id = v_initiator OR pl.viewer_user_id = v_initiator)
    LIMIT 1;

    IF v_partner_id IS NULL THEN
        RAISE EXCEPTION 'no active partner relationship to start a session with';
    END IF;

    INSERT INTO public.relationship_sessions (session_type, category, prompts, initiator_id, partner_id)
    VALUES (p_session_type, p_category, p_prompts, v_initiator, v_partner_id)
    RETURNING id INTO v_session_id;

    RETURN v_session_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_session_answer(
    p_session_id uuid,
    p_prompt_key text,
    p_answer_text text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_caller uuid := auth.uid();
    v_session public.relationship_sessions;
BEGIN
    IF v_caller IS NULL THEN
        RAISE EXCEPTION 'not authenticated';
    END IF;

    SELECT * INTO v_session FROM public.relationship_sessions WHERE id = p_session_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'session not found';
    END IF;

    IF v_caller NOT IN (v_session.initiator_id, v_session.partner_id) THEN
        RAISE EXCEPTION 'not a participant in this session';
    END IF;

    IF v_session.revealed_at IS NOT NULL THEN
        RAISE EXCEPTION 'cannot edit an answer after this session has been revealed';
    END IF;

    INSERT INTO public.relationship_session_answers (session_id, answerer_id, prompt_key, answer_text)
    VALUES (p_session_id, v_caller, p_prompt_key, p_answer_text)
    ON CONFLICT (session_id, answerer_id, prompt_key)
    DO UPDATE SET answer_text = EXCLUDED.answer_text, updated_at = now();
END;
$$;

-- Marks the caller ready. Never sets revealed_at, even when this call makes
-- both participants ready -- reveal is a separate, explicit action only.
CREATE OR REPLACE FUNCTION public.mark_session_ready(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_caller uuid := auth.uid();
    v_session public.relationship_sessions;
BEGIN
    IF v_caller IS NULL THEN
        RAISE EXCEPTION 'not authenticated';
    END IF;

    SELECT * INTO v_session FROM public.relationship_sessions WHERE id = p_session_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'session not found';
    END IF;

    IF v_caller NOT IN (v_session.initiator_id, v_session.partner_id) THEN
        RAISE EXCEPTION 'not a participant in this session';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.relationship_session_answers
        WHERE session_id = p_session_id AND answerer_id = v_caller
    ) THEN
        RAISE EXCEPTION 'answer at least one prompt before marking ready';
    END IF;

    IF v_caller = v_session.initiator_id THEN
        UPDATE public.relationship_sessions SET initiator_ready_at = now() WHERE id = p_session_id;
    ELSE
        UPDATE public.relationship_sessions SET partner_ready_at = now() WHERE id = p_session_id;
    END IF;
END;
$$;

-- The ONLY function that may set revealed_at. Requires both participants
-- ready and a currently active relationship. Idempotent: revealing an
-- already-revealed session is a no-op, not an error, so a double-click
-- can't fail loudly.
CREATE OR REPLACE FUNCTION public.reveal_session_together(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_caller uuid := auth.uid();
    v_session public.relationship_sessions;
BEGIN
    IF v_caller IS NULL THEN
        RAISE EXCEPTION 'not authenticated';
    END IF;

    SELECT * INTO v_session FROM public.relationship_sessions WHERE id = p_session_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'session not found';
    END IF;

    IF v_caller NOT IN (v_session.initiator_id, v_session.partner_id) THEN
        RAISE EXCEPTION 'not a participant in this session';
    END IF;

    IF v_session.revealed_at IS NOT NULL THEN
        RETURN;
    END IF;

    IF v_session.initiator_ready_at IS NULL OR v_session.partner_ready_at IS NULL THEN
        RAISE EXCEPTION 'both participants must be ready before revealing';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.partner_links pl
        WHERE pl.status = 'active'
          AND ((pl.owner_user_id = v_session.initiator_id AND pl.viewer_user_id = v_session.partner_id)
            OR (pl.owner_user_id = v_session.partner_id AND pl.viewer_user_id = v_session.initiator_id))
    ) THEN
        RAISE EXCEPTION 'relationship is no longer active';
    END IF;

    UPDATE public.relationship_sessions
    SET revealed_at = now(), revealed_by = v_caller
    WHERE id = p_session_id;
END;
$$;

-- The ONLY way to read the OTHER participant's answers. Always returns the
-- caller's own answers; returns the other participant's answers only once
-- revealed_at is set AND the relationship is still currently active (so a
-- disconnect hides even a previously revealed session from a former
-- partner, on both sides).
CREATE OR REPLACE FUNCTION public.get_session_answers(p_session_id uuid)
RETURNS TABLE (answerer_id uuid, prompt_key text, answer_text text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_caller uuid := auth.uid();
    v_session public.relationship_sessions;
    v_relationship_active boolean;
BEGIN
    IF v_caller IS NULL THEN
        RAISE EXCEPTION 'not authenticated';
    END IF;

    SELECT * INTO v_session FROM public.relationship_sessions WHERE id = p_session_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'session not found';
    END IF;

    IF v_caller NOT IN (v_session.initiator_id, v_session.partner_id) THEN
        RAISE EXCEPTION 'not a participant in this session';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.partner_links pl
        WHERE pl.status = 'active'
          AND ((pl.owner_user_id = v_session.initiator_id AND pl.viewer_user_id = v_session.partner_id)
            OR (pl.owner_user_id = v_session.partner_id AND pl.viewer_user_id = v_session.initiator_id))
    ) INTO v_relationship_active;

    IF v_session.revealed_at IS NOT NULL AND v_relationship_active THEN
        RETURN QUERY
        SELECT a.answerer_id, a.prompt_key, a.answer_text
        FROM public.relationship_session_answers a
        WHERE a.session_id = p_session_id;
    ELSE
        RETURN QUERY
        SELECT a.answerer_id, a.prompt_key, a.answer_text
        FROM public.relationship_session_answers a
        WHERE a.session_id = p_session_id AND a.answerer_id = v_caller;
    END IF;
END;
$$;

-- ==================================================================
-- 5. RELATIONSHIP MEMORY
-- ==================================================================
-- Explicit-save only. save_relationship_memory() verifies the caller has
-- real access to the cited source record before allowing the save --
-- prevents fabricating a memory that references content the caller never
-- actually had legitimate access to.

CREATE TABLE IF NOT EXISTS public.relationship_memories (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_a_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    partner_b_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_by uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    source_type text NOT NULL CHECK (
        source_type IN ('support_preference', 'weekly_us', 'mutual_reveal', 'repair', 'appreciation', 'partner_context')
    ),
    source_id uuid NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT relationship_memories_not_self CHECK (partner_a_id <> partner_b_id)
);

ALTER TABLE public.relationship_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view relationship memory while relationship active" ON public.relationship_memories
    FOR SELECT USING (
        auth.uid() IN (partner_a_id, partner_b_id)
        AND EXISTS (
            SELECT 1 FROM public.partner_links pl
            WHERE pl.status = 'active'
              AND ((pl.owner_user_id = partner_a_id AND pl.viewer_user_id = partner_b_id)
                OR (pl.owner_user_id = partner_b_id AND pl.viewer_user_id = partner_a_id))
        )
    );

-- No INSERT policy -- save_relationship_memory() is the only writer.

CREATE OR REPLACE FUNCTION public.save_relationship_memory(
    p_source_type text,
    p_source_id uuid,
    p_title text,
    p_content text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_caller uuid := auth.uid();
    v_partner_id uuid;
    v_verified boolean := false;
BEGIN
    IF v_caller IS NULL THEN
        RAISE EXCEPTION 'not authenticated';
    END IF;

    SELECT CASE WHEN pl.owner_user_id = v_caller THEN pl.viewer_user_id ELSE pl.owner_user_id END
    INTO v_partner_id
    FROM public.partner_links pl
    WHERE pl.status = 'active'
      AND (pl.owner_user_id = v_caller OR pl.viewer_user_id = v_caller)
    LIMIT 1;

    IF v_partner_id IS NULL THEN
        RAISE EXCEPTION 'no active partner relationship';
    END IF;

    -- Verify the caller genuinely has access to the cited source before
    -- allowing it to be memorialized.
    IF p_source_type = 'weekly_us' OR p_source_type = 'mutual_reveal' OR p_source_type = 'repair' THEN
        SELECT EXISTS (
            SELECT 1 FROM public.relationship_sessions s
            WHERE s.id = p_source_id
              AND s.session_type = p_source_type
              AND v_caller IN (s.initiator_id, s.partner_id)
              AND s.revealed_at IS NOT NULL
        ) INTO v_verified;
    ELSIF p_source_type = 'support_preference' THEN
        SELECT EXISTS (
            SELECT 1 FROM public.support_preferences sp
            WHERE sp.id = p_source_id
              AND (sp.owner_user_id = v_caller OR (sp.owner_user_id = v_partner_id AND sp.is_shared))
        ) INTO v_verified;
    ELSIF p_source_type = 'partner_context' THEN
        SELECT EXISTS (
            SELECT 1 FROM public.partner_contexts pc
            WHERE pc.id = p_source_id
              AND (pc.owner_user_id = v_caller OR (pc.owner_user_id = v_partner_id AND pc.status = 'shared'))
        ) INTO v_verified;
    ELSIF p_source_type = 'appreciation' THEN
        SELECT EXISTS (
            SELECT 1 FROM public.relationship_appreciations ra
            WHERE ra.id = p_source_id
              AND v_caller IN (ra.sender_id, ra.recipient_id)
        ) INTO v_verified;
    END IF;

    IF NOT v_verified THEN
        RAISE EXCEPTION 'source record not found or not accessible';
    END IF;

    RETURN (
        INSERT INTO public.relationship_memories
            (partner_a_id, partner_b_id, created_by, source_type, source_id, title, content)
        VALUES (v_caller, v_partner_id, v_caller, p_source_type, p_source_id, p_title, p_content)
        RETURNING id
    );
END;
$$;

-- ==================================================================
-- 6. SHARED REPLIES
-- ==================================================================
-- Flat, source-scoped replies. Access inherits from the source record --
-- get_replies()/add_reply() re-derive that source's own access rule rather
-- than duplicating it in a generic RLS predicate. No direct SELECT/INSERT
-- policy at all -- these two RPCs are the only access path.

CREATE TABLE IF NOT EXISTS public.shared_replies (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    source_type text NOT NULL CHECK (source_type IN ('partner_context', 'appreciation', 'relationship_session')),
    source_id uuid NOT NULL,
    author_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    content text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_replies ENABLE ROW LEVEL SECURITY;
-- Intentionally zero policies: RLS enabled with no policy denies all direct
-- table access, forcing every read/write through the RPCs below.

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
    END IF;

    RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_replies(p_source_type text, p_source_id uuid)
RETURNS TABLE (id uuid, author_id uuid, content text, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_caller uuid := auth.uid();
BEGIN
    IF v_caller IS NULL THEN
        RAISE EXCEPTION 'not authenticated';
    END IF;

    IF NOT public._has_reply_source_access(p_source_type, p_source_id, v_caller) THEN
        RAISE EXCEPTION 'source not found or not accessible';
    END IF;

    RETURN QUERY
    SELECT r.id, r.author_id, r.content, r.created_at
    FROM public.shared_replies r
    WHERE r.source_type = p_source_type AND r.source_id = p_source_id
    ORDER BY r.created_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_reply(p_source_type text, p_source_id uuid, p_content text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_caller uuid := auth.uid();
    v_reply_id uuid;
BEGIN
    IF v_caller IS NULL THEN
        RAISE EXCEPTION 'not authenticated';
    END IF;

    IF NOT public._has_reply_source_access(p_source_type, p_source_id, v_caller) THEN
        RAISE EXCEPTION 'source not found or not accessible';
    END IF;

    INSERT INTO public.shared_replies (source_type, source_id, author_id, content)
    VALUES (p_source_type, p_source_id, v_caller, p_content)
    RETURNING id INTO v_reply_id;

    RETURN v_reply_id;
END;
$$;

-- ==================================================================
-- PRIVILEGES -- identical hardening to every existing partner RPC:
-- explicit REVOKE from PUBLIC and anon, GRANT only to authenticated.
-- ==================================================================

REVOKE ALL ON FUNCTION public.start_relationship_session(text, text, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.start_relationship_session(text, text, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.start_relationship_session(text, text, jsonb) TO authenticated;

REVOKE ALL ON FUNCTION public.submit_session_answer(uuid, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.submit_session_answer(uuid, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.submit_session_answer(uuid, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.mark_session_ready(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.mark_session_ready(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.mark_session_ready(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.reveal_session_together(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reveal_session_together(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.reveal_session_together(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.get_session_answers(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_session_answers(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_session_answers(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.save_relationship_memory(text, uuid, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.save_relationship_memory(text, uuid, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.save_relationship_memory(text, uuid, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public._has_reply_source_access(text, uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public._has_reply_source_access(text, uuid, uuid) FROM anon;
-- Internal helper only -- not even granted to authenticated; only called
-- from within get_replies()/add_reply(), which run as their SECURITY
-- DEFINER owner regardless of caller grants.

REVOKE ALL ON FUNCTION public.get_replies(text, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_replies(text, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_replies(text, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.add_reply(text, uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.add_reply(text, uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.add_reply(text, uuid, text) TO authenticated;

-- ==================================================================
-- INDEXES
-- ==================================================================

CREATE INDEX IF NOT EXISTS idx_support_preferences_owner ON public.support_preferences(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_partner_contexts_owner ON public.partner_contexts(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_relationship_appreciations_sender ON public.relationship_appreciations(sender_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_relationship_appreciations_recipient ON public.relationship_appreciations(recipient_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_relationship_sessions_initiator ON public.relationship_sessions(initiator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_relationship_sessions_partner ON public.relationship_sessions(partner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_relationship_session_answers_session ON public.relationship_session_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_relationship_memories_partner_a ON public.relationship_memories(partner_a_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_relationship_memories_partner_b ON public.relationship_memories(partner_b_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shared_replies_source ON public.shared_replies(source_type, source_id, created_at ASC);

COMMIT;

-- ---------------------------------------------------------------
-- VERIFICATION (read-only, run manually after COMMIT -- not part of the
-- migration itself)
-- ---------------------------------------------------------------
-- Confirm every table exists with RLS enabled:
--   select relname, relrowsecurity from pg_class
--   where relname in ('support_preferences','partner_contexts',
--     'relationship_appreciations','relationship_sessions',
--     'relationship_session_answers','relationship_memories','shared_replies');
--
-- Confirm shared_replies genuinely has zero policies (RPC-only access):
--   select count(*) from pg_policies where tablename = 'shared_replies';
--   -- expect: 0
--
-- Confirm anon has no execute grant on any new function:
--   select proname, has_function_privilege('anon', oid, 'EXECUTE') as anon_can_execute
--   from pg_proc where proname in ('start_relationship_session','submit_session_answer',
--     'mark_session_ready','reveal_session_together','get_session_answers',
--     'save_relationship_memory','get_replies','add_reply');
--   -- expect: anon_can_execute = false for every row
