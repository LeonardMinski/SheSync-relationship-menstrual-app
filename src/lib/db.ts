import { supabase } from './supabaseClient'

// Types
export interface User {
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

export interface CreateUserData {
  email: string
  password: string
  name: string
  privacy_settings?: {
    share_with_partner: boolean
    share_cycle_phase: boolean
    share_mood: boolean
    share_fantasy_vault: boolean
    share_intimacy_deck: boolean
  }
}

export interface LoginData {
  email: string
  password: string
}

// Auth functions
export const auth = {
  async getCurrentUser(): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        return { user: null, error: sessionError.message }
      }

      if (!session?.user) {
        return { user: null, error: 'Auth session missing!' }
      }

      // Get user profile from our users table
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileError) {
        // If user doesn't exist in our users table, create a basic profile
        const newUser: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          subscription_tier: 'free',
          created_at: new Date().toISOString(),
          privacy_settings: {
            share_with_partner: false,
            share_cycle_phase: false,
            share_mood: false,
            share_fantasy_vault: false,
            share_intimacy_deck: false,
          }
        }

        // Try to insert the user profile
        const { error: insertError } = await supabase
          .from('users')
          .insert(newUser)

        if (insertError) {
          console.error('Error creating user profile:', insertError)
          // Return the basic user data even if we can't save it
          return { user: newUser, error: null }
        }

        return { user: newUser, error: null }
      }

      return { user: userProfile, error: null }
    } catch (error) {
      console.error('Error getting current user:', error)
      return { user: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  async signUp(data: CreateUserData): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name
          }
        }
      })

      if (authError) {
        return { user: null, error: authError.message }
      }

      if (!authData.user) {
        return { user: null, error: 'Signup failed' }
      }

      // Create user profile
      const newUser: User = {
        id: authData.user.id,
        email: data.email,
        name: data.name,
        subscription_tier: 'free',
        created_at: new Date().toISOString(),
        privacy_settings: data.privacy_settings || {
          share_with_partner: false,
          share_cycle_phase: false,
          share_mood: false,
          share_fantasy_vault: false,
          share_intimacy_deck: false,
        }
      }

      const { error: profileError } = await supabase
        .from('users')
        .insert(newUser)

      if (profileError) {
        console.error('Error creating user profile:', profileError)
        // Still return the user data even if profile creation fails
        return { user: newUser, error: null }
      }

      return { user: newUser, error: null }
    } catch (error) {
      console.error('Error signing up:', error)
      return { user: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  async signIn(data: LoginData): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })

      if (authError) {
        return { user: null, error: authError.message }
      }

      if (!authData.user) {
        return { user: null, error: 'Signin failed' }
      }

      // Get user profile
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (profileError) {
        console.error('Error getting user profile:', profileError)
        return { user: null, error: 'User profile not found' }
      }

      return { user: userProfile, error: null }
    } catch (error) {
      console.error('Error signing in:', error)
      return { user: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut()
      return { error: error?.message || null }
    } catch (error) {
      console.error('Error signing out:', error)
      return { error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}