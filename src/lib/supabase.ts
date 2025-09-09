import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

// Only throw error in production if variables are missing
if (process.env.NODE_ENV === 'production' && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
  throw new Error('Missing Supabase environment variables in production')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types based on your schema
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          subscription_tier: 'free' | 'premium' | 'vip' | 'lifetime'
          created_at: string
          partner_id?: string
          privacy_settings: {
            share_with_partner: boolean
            share_cycle_phase: boolean
            share_mood: boolean
            share_fantasy_vault: boolean
            share_intimacy_deck: boolean
          }
        }
        Insert: {
          id?: string
          email: string
          name: string
          subscription_tier?: 'free' | 'premium' | 'vip' | 'lifetime'
          created_at?: string
          partner_id?: string
          privacy_settings?: {
            share_with_partner: boolean
            share_cycle_phase: boolean
            share_mood: boolean
            share_fantasy_vault: boolean
            share_intimacy_deck: boolean
          }
        }
        Update: {
          id?: string
          email?: string
          name?: string
          subscription_tier?: 'free' | 'premium' | 'vip' | 'lifetime'
          created_at?: string
          partner_id?: string
          privacy_settings?: {
            share_with_partner: boolean
            share_cycle_phase: boolean
            share_mood: boolean
            share_fantasy_vault: boolean
            share_intimacy_deck: boolean
          }
        }
      }
      cycle_data: {
        Row: {
          id: string
          user_id: string
          date: string
          phase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal'
          period_flow?: 'light' | 'medium' | 'heavy'
          mood: number
          energy: number
          libido: number
          stress: number
          symptoms: string[]
          notes?: string
          temperature?: number
          weight?: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          phase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal'
          period_flow?: 'light' | 'medium' | 'heavy'
          mood: number
          energy: number
          libido: number
          stress: number
          symptoms?: string[]
          notes?: string
          temperature?: number
          weight?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          phase?: 'menstrual' | 'follicular' | 'ovulation' | 'luteal'
          period_flow?: 'light' | 'medium' | 'heavy'
          mood?: number
          energy?: number
          libido?: number
          stress?: number
          symptoms?: string[]
          notes?: string
          temperature?: number
          weight?: number
          created_at?: string
        }
      }
      intimacy_cards: {
        Row: {
          id: string
          user_id: string
          category: 'emotional' | 'sensual' | 'fantasy'
          question: string
          description?: string
          tags: string[]
          is_answered: boolean
          user_answer?: string
          partner_answer?: string
          is_shared: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: 'emotional' | 'sensual' | 'fantasy'
          question: string
          description?: string
          tags?: string[]
          is_answered?: boolean
          user_answer?: string
          partner_answer?: string
          is_shared?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: 'emotional' | 'sensual' | 'fantasy'
          question?: string
          description?: string
          tags?: string[]
          is_answered?: boolean
          user_answer?: string
          partner_answer?: string
          is_shared?: boolean
          created_at?: string
        }
      }
      fantasy_entries: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          type: 'text' | 'moodboard' | 'audio'
          tags: string[]
          is_shared_with_partner: boolean
          created_at: string
          updated_at: string
          mood?: number
          phase?: 'menstrual' | 'follicular' | 'ovulation' | 'luteal'
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          type: 'text' | 'moodboard' | 'audio'
          tags?: string[]
          is_shared_with_partner?: boolean
          created_at?: string
          updated_at?: string
          mood?: number
          phase?: 'menstrual' | 'follicular' | 'ovulation' | 'luteal'
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          type?: 'text' | 'moodboard' | 'audio'
          tags?: string[]
          is_shared_with_partner?: boolean
          created_at?: string
          updated_at?: string
          mood?: number
          phase?: 'menstrual' | 'follicular' | 'ovulation' | 'luteal'
        }
      }
      ai_coach_messages: {
        Row: {
          id: string
          user_id: string
          timestamp: string
          question: string
          response: string
          phase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal'
          relevant_data: any
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          timestamp?: string
          question: string
          response: string
          phase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal'
          relevant_data?: any
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          timestamp?: string
          question?: string
          response?: string
          phase?: 'menstrual' | 'follicular' | 'ovulation' | 'luteal'
          relevant_data?: any
          created_at?: string
        }
      }
    }
  }
}

export type SupabaseClient = ReturnType<typeof createClient<Database>>
