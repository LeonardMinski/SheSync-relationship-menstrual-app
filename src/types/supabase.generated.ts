// Generated from the live Supabase project (wuvjrpgoqrpaogpewlyj) schema via
// mcp__supabase__generate_typescript_types on 2026-09-08. This is a snapshot,
// not a live connection — regenerate after any migration that changes table
// shape, and keep src/services/auth/profileSchemaContract.test.ts's
// LIVE_USERS_COLUMNS list in sync with the `users` table below.
//
// Do not hand-edit. Do not add a column here to "fix" a type error — that
// means the column doesn't exist live; fix the code writing it instead (see
// the profile_image_url incident this file's contract test guards against).

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_coach_messages: {
        Row: {
          created_at: string | null
          id: string
          phase: string
          question: string
          relevant_data: Json | null
          response: string
          timestamp: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          phase: string
          question: string
          relevant_data?: Json | null
          response: string
          timestamp?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          phase?: string
          question?: string
          relevant_data?: Json | null
          response?: string
          timestamp?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cycle_data: {
        Row: {
          created_at: string | null
          date: string
          energy: number
          id: string
          libido: number
          mood: number
          notes: string | null
          period_flow: string | null
          phase: string
          sleep: number
          stress: number
          symptoms: string[] | null
          temperature: number | null
          user_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          date: string
          energy: number
          id?: string
          libido: number
          mood: number
          notes?: string | null
          period_flow?: string | null
          phase: string
          sleep: number
          stress: number
          symptoms?: string[] | null
          temperature?: number | null
          user_id: string
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          date?: string
          energy?: number
          id?: string
          libido?: number
          mood?: number
          notes?: string | null
          period_flow?: string | null
          phase?: string
          sleep?: number
          stress?: number
          symptoms?: string[] | null
          temperature?: number | null
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      partner_links: {
        Row: {
          created_at: string
          id: string
          owner_email: string | null
          owner_name: string | null
          owner_user_id: string
          status: string
          viewer_email: string | null
          viewer_user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          owner_email?: string | null
          owner_name?: string | null
          owner_user_id: string
          status?: string
          viewer_email?: string | null
          viewer_user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          owner_email?: string | null
          owner_name?: string | null
          owner_user_id?: string
          status?: string
          viewer_email?: string | null
          viewer_user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          onboarding_completed_at: string | null
          partner_id: string | null
          privacy_settings: Json
          subscription_tier: string
          tracking_enabled: boolean
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          name: string
          onboarding_completed_at?: string | null
          partner_id?: string | null
          privacy_settings?: Json
          subscription_tier?: string
          tracking_enabled?: boolean
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          onboarding_completed_at?: string | null
          partner_id?: string | null
          privacy_settings?: Json
          subscription_tier?: string
          tracking_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "users_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_sparks: {
        Row: {
          archived_at: string | null
          content: string
          created_at: string
          deck_id: string | null
          deck_interest_level: string | null
          deck_prompt_id: string | null
          heat_level: string
          id: string
          owner_reaction: string | null
          owner_ready_at: string | null
          partner_reaction: string | null
          partner_ready_at: string | null
          partner_tease_response: string | null
          revealed_at: string | null
          revealed_by: string | null
          status: string
          tease_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          content: string
          created_at?: string
          deck_id?: string | null
          deck_interest_level?: string | null
          deck_prompt_id?: string | null
          heat_level: string
          id?: string
          owner_reaction?: string | null
          owner_ready_at?: string | null
          partner_reaction?: string | null
          partner_ready_at?: string | null
          partner_tease_response?: string | null
          revealed_at?: string | null
          revealed_by?: string | null
          status?: string
          tease_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          content?: string
          created_at?: string
          deck_id?: string | null
          deck_interest_level?: string | null
          deck_prompt_id?: string | null
          heat_level?: string
          id?: string
          owner_reaction?: string | null
          owner_ready_at?: string | null
          partner_reaction?: string | null
          partner_ready_at?: string | null
          partner_tease_response?: string | null
          revealed_at?: string | null
          revealed_by?: string | null
          status?: string
          tease_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Trimmed to the tables this repo's schema-contract tests currently check
// (users, plus a few referenced elsewhere) rather than the full live schema
// dump — see the MCP tool output this was generated from for every table if
// a future contract test needs another one added here.
