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
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
        }
      }
      cycles: {
        Row: {
          id: string
          user_id: string
          phase: string
          mood: number
          symptoms: string[]
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          phase: string
          mood: number
          symptoms?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          phase?: string
          mood?: number
          symptoms?: string[]
          created_at?: string
        }
      }
      entries: {
        Row: {
          id: string
          user_id: string
          type: 'fantasy' | 'note' | 'moodboard'
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'fantasy' | 'note' | 'moodboard'
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'fantasy' | 'note' | 'moodboard'
          content?: string
          created_at?: string
        }
      }
      partners: {
        Row: {
          id: string
          user_id: string
          partner_email: string
          status: 'pending' | 'accepted' | 'declined'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          partner_email: string
          status?: 'pending' | 'accepted' | 'declined'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          partner_email?: string
          status?: 'pending' | 'accepted' | 'declined'
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string
          plan: string
          status: 'active' | 'inactive' | 'cancelled'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id: string
          plan: string
          status?: 'active' | 'inactive' | 'cancelled'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_customer_id?: string
          plan?: string
          status?: 'active' | 'inactive' | 'cancelled'
          created_at?: string
        }
      }
    }
  }
}

export type SupabaseClient = ReturnType<typeof createClient<Database>>
