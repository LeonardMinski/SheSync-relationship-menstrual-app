-- Rename existing intimacy_cards table if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'intimacy_cards') THEN
        ALTER TABLE public.intimacy_cards RENAME TO intimacy_cards_legacy;
    END IF;
END $$;

-- =====================================================
-- PARTNER LINKS TABLE
-- =====================================================
-- Links two users as partners (one row per direction for simplicity)
CREATE TABLE IF NOT EXISTS public.partner_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    partner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, partner_user_id)
);

-- =====================================================
-- BOUNDARY ITEMS TABLE
-- =====================================================
-- Per-user yes/maybe/no boundary list
CREATE TABLE IF NOT EXISTS public.boundary_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('yes','maybe','no')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_boundary_items_user ON public.boundary_items(user_id);

-- =====================================================
-- INTIMACY CARDS TABLE (Catalogue)
-- =====================================================
-- Deck of connection prompts
CREATE TABLE IF NOT EXISTS public.intimacy_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL CHECK (category IN ('talk','affection','quality_time','desire_exploration','acts')),
    difficulty INT NOT NULL CHECK (difficulty BETWEEN 1 AND 3),
    text TEXT NOT NULL,
    phase_tags TEXT[] NOT NULL DEFAULT '{}',
    active BOOLEAN NOT NULL DEFAULT true
);

-- =====================================================
-- INTIMACY SESSIONS TABLE
-- =====================================================
-- Daily pick + optional share + reflection
CREATE TABLE IF NOT EXISTS public.intimacy_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    selected_card_id UUID NOT NULL REFERENCES public.intimacy_cards(id),
    shared_with_partner BOOLEAN NOT NULL DEFAULT false,
    reflection TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON public.intimacy_sessions(user_id, date);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
-- Enable RLS on all tables
ALTER TABLE public.partner_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boundary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intimacy_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intimacy_sessions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Partner links policies
CREATE POLICY "partner_links_owner_or_partner"
    ON public.partner_links FOR SELECT USING (auth.uid() IN (user_id, partner_user_id));

CREATE POLICY "partner_links_owner_insert"
    ON public.partner_links FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Boundary items policies
CREATE POLICY "boundaries_owner_all"
    ON public.boundary_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Intimacy cards policies (public catalogue)
CREATE POLICY "cards_public_read"
    ON public.intimacy_cards FOR SELECT USING (true);

-- Intimacy sessions policies
CREATE POLICY "sessions_owner_read"
    ON public.intimacy_sessions FOR SELECT USING (
        auth.uid() = user_id
        OR (EXISTS (
            SELECT 1 FROM public.partner_links pl
            WHERE pl.user_id = user_id 
            AND pl.partner_user_id = auth.uid() 
            AND shared_with_partner = true
        ))
    );

CREATE POLICY "sessions_owner_write"
    ON public.intimacy_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for boundary_items updated_at
CREATE TRIGGER update_boundary_items_updated_at 
    BEFORE UPDATE ON public.boundary_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_partner_links_user ON public.partner_links(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_links_partner ON public.partner_links(partner_user_id);
CREATE INDEX IF NOT EXISTS idx_intimacy_cards_category ON public.intimacy_cards(category);
CREATE INDEX IF NOT EXISTS idx_intimacy_cards_difficulty ON public.intimacy_cards(difficulty);
CREATE INDEX IF NOT EXISTS idx_intimacy_cards_active ON public.intimacy_cards(active);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the schema was created correctly

-- Check all tables exist
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name IN ('partner_links', 'boundary_items', 'intimacy_cards', 'intimacy_sessions');

-- Check RLS is enabled
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' AND rowsecurity = true;
