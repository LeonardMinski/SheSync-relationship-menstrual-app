-- ============================================================================
-- SheSync+ Coach Conversation Workspace V1 — persistence migration
-- ============================================================================
--
-- Adds durable, private, owner-only Coach conversations. A conversation is
-- never visible to a partner and is never fed into any relationship RPC —
-- there is no SECURITY DEFINER cross-user access function anywhere in this
-- file, on purpose. Simple owner-scoped RLS is sufficient because nothing
-- here is ever shared; "turning something into partner context" is a
-- separate, explicit, already-existing Partner Translation action that a
-- user performs deliberately — Coach never writes into that table itself.
--
-- Run this entire file once in the Supabase SQL editor. Idempotent via
-- IF NOT EXISTS / DROP POLICY IF EXISTS, safe to re-run.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.coach_conversations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    -- Deterministic title from the first user message (client-trimmed,
    -- ~40-60 chars) — null until the first message is sent.
    title text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coach_conversations_owner_updated_idx
    ON public.coach_conversations (owner_user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.coach_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id uuid REFERENCES public.coach_conversations(id) ON DELETE CASCADE NOT NULL,
    -- Denormalised from the parent conversation so RLS on this table never
    -- needs a join/subquery — same pattern as relationship_session_answers.
    owner_user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    role text NOT NULL CHECK (role IN ('user', 'assistant')),
    content text NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 8000),
    -- Structured analytical fields — only ever populated on 'assistant'
    -- messages, and only when the model actually has something for that
    -- section (see features/coach/systemPrompt.ts). A plain conversational
    -- reply leaves all four null; `content` is always the fallback text.
    from_logs text,
    general_context text,
    question_to_consider text,
    optional_next_step text,
    partner_translation_available boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT coach_messages_structured_fields_assistant_only CHECK (
        role = 'assistant'
        OR (
            from_logs IS NULL
            AND general_context IS NULL
            AND question_to_consider IS NULL
            AND optional_next_step IS NULL
            AND partner_translation_available = false
        )
    )
);

CREATE INDEX IF NOT EXISTS coach_messages_conversation_created_idx
    ON public.coach_messages (conversation_id, created_at ASC);

-- ----------------------------------------------------------------------------
-- Row Level Security — owner-only on both tables, no exceptions.
-- ----------------------------------------------------------------------------

ALTER TABLE public.coach_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner can view own coach conversations" ON public.coach_conversations;
CREATE POLICY "Owner can view own coach conversations" ON public.coach_conversations
    FOR SELECT USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Owner can insert own coach conversations" ON public.coach_conversations;
CREATE POLICY "Owner can insert own coach conversations" ON public.coach_conversations
    FOR INSERT WITH CHECK (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Owner can update own coach conversations" ON public.coach_conversations;
CREATE POLICY "Owner can update own coach conversations" ON public.coach_conversations
    FOR UPDATE USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Owner can delete own coach conversations" ON public.coach_conversations;
CREATE POLICY "Owner can delete own coach conversations" ON public.coach_conversations
    FOR DELETE USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Owner can view own coach messages" ON public.coach_messages;
CREATE POLICY "Owner can view own coach messages" ON public.coach_messages
    FOR SELECT USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Owner can insert own coach messages" ON public.coach_messages;
CREATE POLICY "Owner can insert own coach messages" ON public.coach_messages
    FOR INSERT WITH CHECK (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Owner can delete own coach messages" ON public.coach_messages;
CREATE POLICY "Owner can delete own coach messages" ON public.coach_messages
    FOR DELETE USING (auth.uid() = owner_user_id);

-- No UPDATE policy on coach_messages — messages are immutable once written
-- (matches the product model: a conversation transcript is not editable
-- after the fact, only deletable as a whole via the parent conversation).

-- ----------------------------------------------------------------------------
-- updated_at maintenance on coach_conversations (touched whenever a message
-- is added, via the API layer's explicit update — no trigger needed since
-- every write path already goes through the authenticated API route).
-- ----------------------------------------------------------------------------

-- Explicit REVOKE FROM anon (not just PUBLIC): this project's schema
-- appears to grant new public-schema tables to anon/authenticated by
-- default (e.g. via ALTER DEFAULT PRIVILEGES), which REVOKE ... FROM
-- PUBLIC alone does not undo. RLS already returns zero rows for anon
-- either way (no row has owner_user_id = null), so this is defense in
-- depth, not a fix for a live data exposure.
REVOKE ALL ON public.coach_conversations FROM PUBLIC, anon;
REVOKE ALL ON public.coach_messages FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_conversations TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.coach_messages TO authenticated;
