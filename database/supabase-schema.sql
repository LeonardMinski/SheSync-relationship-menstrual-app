-- =====================================================
-- SheSync+ Supabase Database Schema
-- =====================================================
-- This SQL creates the required tables for the signup flow
-- Run this in your Supabase SQL Editor after creating a project

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
-- Stores user profiles and preferences
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'vip', 'lifetime')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    partner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    privacy_settings JSONB NOT NULL DEFAULT '{
        "share_with_partner": false,
        "share_cycle_phase": true,
        "share_mood": true,
        "share_fantasy_vault": false,
        "share_intimacy_deck": false
    }'::jsonb
);

-- =====================================================
-- CYCLE DATA TABLE
-- =====================================================
-- Stores menstrual cycle tracking data
CREATE TABLE IF NOT EXISTS public.cycle_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    phase TEXT NOT NULL CHECK (phase IN ('menstrual', 'follicular', 'ovulation', 'luteal')),
    period_flow TEXT CHECK (period_flow IN ('light', 'medium', 'heavy')),
    mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 10),
    energy INTEGER NOT NULL CHECK (energy >= 1 AND energy <= 10),
    libido INTEGER NOT NULL CHECK (libido >= 1 AND libido <= 10),
    stress INTEGER NOT NULL CHECK (stress >= 1 AND stress <= 10),
    symptoms TEXT[] DEFAULT '{}',
    notes TEXT,
    temperature DECIMAL(4,2),
    weight DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- =====================================================
-- INTIMACY CARDS TABLE
-- =====================================================
-- Stores intimacy conversation cards and responses
CREATE TABLE IF NOT EXISTS public.intimacy_cards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('emotional', 'sensual', 'fantasy')),
    question TEXT NOT NULL,
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    is_answered BOOLEAN DEFAULT FALSE,
    user_answer TEXT,
    partner_answer TEXT,
    is_shared BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- FANTASY ENTRIES TABLE
-- =====================================================
-- Stores user fantasy vault entries
CREATE TABLE IF NOT EXISTS public.fantasy_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('text', 'moodboard', 'audio')),
    tags TEXT[] DEFAULT '{}',
    is_shared_with_partner BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    mood INTEGER CHECK (mood >= 1 AND mood <= 10),
    phase TEXT CHECK (phase IN ('menstrual', 'follicular', 'ovulation', 'luteal'))
);

-- =====================================================
-- AI COACH MESSAGES TABLE
-- =====================================================
-- Stores AI coaching conversations
CREATE TABLE IF NOT EXISTS public.ai_coach_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    question TEXT NOT NULL,
    response TEXT NOT NULL,
    phase TEXT NOT NULL CHECK (phase IN ('menstrual', 'follicular', 'ovulation', 'luteal')),
    relevant_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SUBSCRIPTIONS TABLE (for Stripe integration)
-- =====================================================
-- Stores subscription information
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    stripe_customer_id TEXT UNIQUE NOT NULL,
    stripe_subscription_id TEXT UNIQUE,
    plan TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycle_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intimacy_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fantasy_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_coach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Users can only see and modify their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Cycle data policies
CREATE POLICY "Users can view own cycle data" ON public.cycle_data
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cycle data" ON public.cycle_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cycle data" ON public.cycle_data
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cycle data" ON public.cycle_data
    FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for other tables...
-- (Add more policies as needed for intimacy_cards, fantasy_entries, etc.)

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

-- Trigger for fantasy_entries updated_at
CREATE TRIGGER update_fantasy_entries_updated_at 
    BEFORE UPDATE ON public.fantasy_entries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for subscriptions updated_at
CREATE TRIGGER update_subscriptions_updated_at 
    BEFORE UPDATE ON public.subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_cycle_data_user_date ON public.cycle_data(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_fantasy_entries_user_created ON public.fantasy_entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_messages_user_timestamp ON public.ai_coach_messages(user_id, timestamp DESC);

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================
-- This would be inserted after a user signs up through the app

-- Example user profile (created automatically by signup API)
-- INSERT INTO public.users (id, email, name, subscription_tier, privacy_settings)
-- VALUES (
--     'sample-user-uuid',
--     'demo@shesync.app',
--     'Demo User',
--     'free',
--     '{"share_with_partner": false, "share_cycle_phase": true, "share_mood": true, "share_fantasy_vault": false, "share_intimacy_deck": false}'::jsonb
-- );

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the schema was created correctly

-- Check all tables exist
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name IN ('users', 'cycle_data', 'intimacy_cards', 'fantasy_entries', 'ai_coach_messages', 'subscriptions');

-- Check RLS is enabled
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' AND rowsecurity = true;

-- =====================================================
-- NOTES
-- =====================================================
-- 1. Run this schema in your Supabase SQL Editor
-- 2. Update your .env.local with real Supabase credentials
-- 3. Test signup with: POST /api/auth {"action":"signup",...}
-- 4. Verify user creation in Supabase Dashboard > Authentication
-- 5. Verify profile creation in Supabase Dashboard > Table Editor > users