import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if environment variables are properly loaded
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing')
  
  // In development, create a mock client that throws helpful errors
  if (process.env.NODE_ENV === 'development') {
    console.warn('Creating mock Supabase client for development. Please set up your .env.local file.')
  }
  
  // Only throw error in production
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Missing Supabase environment variables in production')
  }
}

// Create Supabase client with proper error handling
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)

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
