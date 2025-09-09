-- Intimacy Feature Database Migration
-- Production-grade schema with proper RLS and indexes

-- First, check if an older intimacy_cards table exists and rename it to avoid conflicts
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'intimacy_cards' AND table_schema = 'public') THEN
        -- Check if it's the old structure by looking for expected columns
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'intimacy_cards' AND column_name = 'phase_tags' AND table_schema = 'public') THEN
            -- This is the old table, rename it
            ALTER TABLE public.intimacy_cards RENAME TO intimacy_cards_legacy;
        END IF;
    END IF;
END $$;

-- Partner Links Table
-- Links two users together as partners
CREATE TABLE IF NOT EXISTS partner_links (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    partner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'inactive')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, partner_user_id)
);

-- Boundary Items Table
-- User's personal boundaries and preferences
CREATE TABLE IF NOT EXISTS boundary_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    label text NOT NULL CHECK (length(label) > 0 AND length(label) <= 255),
    status text NOT NULL CHECK (status IN ('yes', 'maybe', 'no')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Intimacy Cards Table (Catalogue)
-- Collection of intimacy prompts and activities
CREATE TABLE IF NOT EXISTS intimacy_cards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category text NOT NULL CHECK (category IN ('talk', 'affection', 'quality_time', 'desire_exploration', 'acts')),
    difficulty int NOT NULL CHECK (difficulty BETWEEN 1 AND 3),
    text text NOT NULL CHECK (length(text) > 0 AND length(text) <= 1000),
    phase_tags text[] NOT NULL DEFAULT '{}',
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Intimacy Sessions Table
-- Daily card selections and reflections
CREATE TABLE IF NOT EXISTS intimacy_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date date NOT NULL,
    selected_card_id uuid NOT NULL REFERENCES intimacy_cards(id) ON DELETE CASCADE,
    shared_with_partner boolean NOT NULL DEFAULT false,
    reflection text CHECK (reflection IS NULL OR length(reflection) <= 2000),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id, date)
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_partner_links_user_id ON partner_links(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_links_partner_user_id ON partner_links(partner_user_id);
CREATE INDEX IF NOT EXISTS idx_partner_links_status ON partner_links(status);

CREATE INDEX IF NOT EXISTS idx_boundary_items_user_id ON boundary_items(user_id);
CREATE INDEX IF NOT EXISTS idx_boundary_items_status ON boundary_items(status);

CREATE INDEX IF NOT EXISTS idx_intimacy_cards_category ON intimacy_cards(category);
CREATE INDEX IF NOT EXISTS idx_intimacy_cards_difficulty ON intimacy_cards(difficulty);
CREATE INDEX IF NOT EXISTS idx_intimacy_cards_active ON intimacy_cards(active);
CREATE INDEX IF NOT EXISTS idx_intimacy_cards_phase_tags ON intimacy_cards USING GIN(phase_tags);

CREATE INDEX IF NOT EXISTS idx_intimacy_sessions_user_id ON intimacy_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_intimacy_sessions_date ON intimacy_sessions(date);
CREATE INDEX IF NOT EXISTS idx_intimacy_sessions_user_date ON intimacy_sessions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_intimacy_sessions_shared ON intimacy_sessions(shared_with_partner);

-- Enable Row Level Security
ALTER TABLE partner_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE boundary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE intimacy_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE intimacy_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "partner_links_owner_or_partner" ON partner_links;
DROP POLICY IF EXISTS "partner_links_owner_insert" ON partner_links;
DROP POLICY IF EXISTS "partner_links_owner_update" ON partner_links;

DROP POLICY IF EXISTS "boundaries_owner_all" ON boundary_items;

DROP POLICY IF EXISTS "cards_public_read" ON intimacy_cards;
DROP POLICY IF EXISTS "cards_admin_all" ON intimacy_cards;

DROP POLICY IF EXISTS "sessions_owner_read" ON intimacy_sessions;
DROP POLICY IF EXISTS "sessions_partner_read_shared" ON intimacy_sessions;
DROP POLICY IF EXISTS "sessions_owner_write" ON intimacy_sessions;

-- RLS Policies

-- Partner Links Policies
CREATE POLICY "partner_links_owner_or_partner"
    ON partner_links FOR SELECT
    USING (auth.uid() IN (user_id, partner_user_id));

CREATE POLICY "partner_links_owner_insert"
    ON partner_links FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "partner_links_owner_update"
    ON partner_links FOR UPDATE
    USING (auth.uid() IN (user_id, partner_user_id))
    WITH CHECK (auth.uid() IN (user_id, partner_user_id));

-- Boundary Items Policies
CREATE POLICY "boundaries_owner_all"
    ON boundary_items FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Intimacy Cards Policies
CREATE POLICY "cards_public_read"
    ON intimacy_cards FOR SELECT
    USING (active = true); -- Cards are public catalogue (no PII)

-- Admin policy for managing cards (optional - for future admin interface)
CREATE POLICY "cards_admin_all"
    ON intimacy_cards FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email LIKE '%@admin.shesync.com'
        )
    );

-- Intimacy Sessions Policies
CREATE POLICY "sessions_owner_read"
    ON intimacy_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "sessions_partner_read_shared"
    ON intimacy_sessions FOR SELECT
    USING (
        shared_with_partner = true 
        AND EXISTS (
            SELECT 1 FROM partner_links pl
            WHERE pl.user_id = intimacy_sessions.user_id 
            AND pl.partner_user_id = auth.uid() 
            AND pl.status = 'active'
        )
    );

CREATE POLICY "sessions_owner_write"
    ON intimacy_sessions FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Update triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
DROP TRIGGER IF EXISTS update_partner_links_updated_at ON partner_links;
CREATE TRIGGER update_partner_links_updated_at
    BEFORE UPDATE ON partner_links
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_boundary_items_updated_at ON boundary_items;
CREATE TRIGGER update_boundary_items_updated_at
    BEFORE UPDATE ON boundary_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_intimacy_cards_updated_at ON intimacy_cards;
CREATE TRIGGER update_intimacy_cards_updated_at
    BEFORE UPDATE ON intimacy_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_intimacy_sessions_updated_at ON intimacy_sessions;
CREATE TRIGGER update_intimacy_sessions_updated_at
    BEFORE UPDATE ON intimacy_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE partner_links IS 'Links between users who are partners, enabling sharing of intimacy data';
COMMENT ON TABLE boundary_items IS 'User-defined boundaries and preferences for intimacy activities';
COMMENT ON TABLE intimacy_cards IS 'Catalogue of intimacy prompts and connection activities';
COMMENT ON TABLE intimacy_sessions IS 'Daily card selections, reflections, and sharing preferences';

COMMENT ON COLUMN intimacy_cards.phase_tags IS 'Menstrual cycle phases this card is suitable for (menstrual, follicular, ovulation, luteal, any)';
COMMENT ON COLUMN intimacy_sessions.shared_with_partner IS 'Whether this session is visible to the user''s partner';
COMMENT ON COLUMN boundary_items.status IS 'User''s preference: yes (enthusiastic), maybe (ask first), no (not today)';

-- Grant necessary permissions
GRANT SELECT ON intimacy_cards TO authenticated;
GRANT ALL ON partner_links TO authenticated;
GRANT ALL ON boundary_items TO authenticated;
GRANT ALL ON intimacy_sessions TO authenticated;

