-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  subscription_tier VARCHAR(50) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'vip', 'lifetime')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  partner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  privacy_settings JSONB DEFAULT '{
    "share_with_partner": false,
    "share_cycle_phase": true,
    "share_mood": true,
    "share_fantasy_vault": false,
    "share_intimacy_deck": false
  }'::jsonb
);

-- Cycle data table
CREATE TABLE IF NOT EXISTS cycle_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  phase VARCHAR(50) NOT NULL CHECK (phase IN ('menstrual', 'follicular', 'ovulation', 'luteal')),
  period_flow VARCHAR(50) CHECK (period_flow IN ('light', 'medium', 'heavy')),
  mood INTEGER CHECK (mood >= 1 AND mood <= 10),
  energy INTEGER CHECK (energy >= 1 AND energy <= 10),
  libido INTEGER CHECK (libido >= 1 AND libido <= 10),
  stress INTEGER CHECK (stress >= 1 AND stress <= 10),
  symptoms TEXT[] DEFAULT '{}',
  notes TEXT,
  temperature DECIMAL(4,1),
  weight DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Intimacy cards table
CREATE TABLE IF NOT EXISTS intimacy_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL CHECK (category IN ('emotional', 'sensual', 'fantasy')),
  question TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  is_answered BOOLEAN DEFAULT FALSE,
  user_answer TEXT,
  partner_answer TEXT,
  is_shared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fantasy entries table
CREATE TABLE IF NOT EXISTS fantasy_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('text', 'moodboard', 'audio')),
  tags TEXT[] DEFAULT '{}',
  is_shared_with_partner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  mood INTEGER CHECK (mood >= 1 AND mood <= 10),
  phase VARCHAR(50) CHECK (phase IN ('menstrual', 'follicular', 'ovulation', 'luteal'))
);

-- AI coach messages table
CREATE TABLE IF NOT EXISTS ai_coach_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  question TEXT NOT NULL,
  response TEXT NOT NULL,
  phase VARCHAR(50) CHECK (phase IN ('menstrual', 'follicular', 'ovulation', 'luteal')),
  relevant_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cycle_data_user_date ON cycle_data(user_id, date);
CREATE INDEX IF NOT EXISTS idx_cycle_data_phase ON cycle_data(phase);
CREATE INDEX IF NOT EXISTS idx_intimacy_cards_user_category ON intimacy_cards(user_id, category);
CREATE INDEX IF NOT EXISTS idx_fantasy_entries_user_type ON fantasy_entries(user_id, type);
CREATE INDEX IF NOT EXISTS idx_ai_coach_messages_user_phase ON ai_coach_messages(user_id, phase);
CREATE INDEX IF NOT EXISTS idx_users_partner_id ON users(partner_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cycle_data_updated_at BEFORE UPDATE ON cycle_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intimacy_cards_updated_at BEFORE UPDATE ON intimacy_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fantasy_entries_updated_at BEFORE UPDATE ON fantasy_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycle_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE intimacy_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE fantasy_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coach_messages ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile" ON users
  FOR DELETE USING (auth.uid() = id);

-- Cycle data policies
CREATE POLICY "Users can view own cycle data" ON cycle_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cycle data" ON cycle_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cycle data" ON cycle_data
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cycle data" ON cycle_data
  FOR DELETE USING (auth.uid() = user_id);

-- Intimacy cards policies
CREATE POLICY "Users can view own intimacy cards" ON intimacy_cards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own intimacy cards" ON intimacy_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own intimacy cards" ON intimacy_cards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own intimacy cards" ON intimacy_cards
  FOR DELETE USING (auth.uid() = user_id);

-- Fantasy entries policies
CREATE POLICY "Users can view own fantasy entries" ON fantasy_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fantasy entries" ON fantasy_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fantasy entries" ON fantasy_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fantasy entries" ON fantasy_entries
  FOR DELETE USING (auth.uid() = user_id);

-- AI coach messages policies
CREATE POLICY "Users can view own AI messages" ON ai_coach_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI messages" ON ai_coach_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own AI messages" ON ai_coach_messages
  FOR DELETE USING (auth.uid() = user_id);

-- Insert sample data for testing
INSERT INTO users (email, name, subscription_tier) VALUES
  ('demo@example.com', 'Demo User', 'premium')
ON CONFLICT (email) DO NOTHING;
