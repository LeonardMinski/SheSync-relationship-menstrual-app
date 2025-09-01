import { supabase } from './supabaseClient'
import type { Database } from './supabaseClient'

// Types for our database operations
export interface User {
  id: string
  email: string
  name?: string
  created_at: string
  updated_at?: string
}

export interface CreateUserData {
  email: string
  password: string
  name?: string
}

export interface LoginData {
  email: string
  password: string
}

export interface CycleEntry {
  id?: string
  user_id: string
  phase: string
  mood: number
  symptoms: string[]
  created_at?: string
}

export interface FantasyEntry {
  id?: string
  user_id: string
  type: 'fantasy' | 'note' | 'moodboard'
  content: string
  created_at?: string
}

export interface PartnerEntry {
  id?: string
  user_id: string
  partner_email: string
  status: 'pending' | 'accepted' | 'declined'
  created_at?: string
}

export interface SubscriptionEntry {
  id?: string
  user_id: string
  stripe_customer_id: string
  plan: string
  status: 'active' | 'inactive' | 'cancelled'
  created_at?: string
}

// Authentication functions
export const auth = {
  // Sign up a new user
  async signUp(data: CreateUserData): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
          },
        },
      })

      if (error) {
        return { user: null, error: error.message }
      }

      if (!authData.user) {
        return { user: null, error: 'No user data returned' }
      }

      // Create user profile in our users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email!,
          name: data.name || 'User',
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        // Don't fail the signup if profile creation fails
      }

      const user: User = {
        id: authData.user.id,
        email: authData.user.email!,
        name: data.name || 'User',
        created_at: authData.user.created_at,
      }

      return { user, error: null }
    } catch (error) {
      return { user: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  // Sign in existing user
  async signIn(data: LoginData): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        return { user: null, error: error.message }
      }

      if (!authData.user) {
        return { user: null, error: 'No user data returned' }
      }

      // Get user profile from our users table
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
        // Return basic user data if profile fetch fails
        const user: User = {
          id: authData.user.id,
          email: authData.user.email!,
          created_at: authData.user.created_at,
        }
        return { user, error: null }
      }

      const user: User = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      }

      return { user, error: null }
    } catch (error) {
      return { user: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  // Sign out user
  async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut()
      return { error: error?.message || null }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  // Get current user
  async getCurrentUser(): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        return { user: null, error: error?.message || 'No user found' }
      }

      // Get user profile from our users table
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
        // Return basic user data if profile fetch fails
        const basicUser: User = {
          id: user.id,
          email: user.email!,
          created_at: user.created_at,
        }
        return { user: basicUser, error: null }
      }

      const userProfile: User = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      }

      return { user: userProfile, error: null }
    } catch (error) {
      return { user: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  // Get user session
  async getSession(): Promise<{ session: any | null; error: string | null }> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      return { session, error: error?.message || null }
    } catch (error) {
      return { session: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },
}

// User management functions
export const users = {
  // Get user by ID
  async getById(id: string): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        return { user: null, error: error.message }
      }

      return { user: data, error: null }
    } catch (error) {
      return { user: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  // Update user profile
  async update(id: string, updates: Partial<User>): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return { user: null, error: error.message }
      }

      return { user: data, error: null }
    } catch (error) {
      return { user: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  // Delete user
  async delete(id: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id)

      if (error) {
        return { error: error.message }
      }

      return { error: null }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },
}

// Cycle tracking functions
export const cycles = {
  // Create new cycle entry
  async create(data: CycleEntry): Promise<{ cycle: CycleEntry | null; error: string | null }> {
    try {
      const { data: cycle, error } = await supabase
        .from('cycles')
        .insert(data)
        .select()
        .single()

      if (error) {
        return { cycle: null, error: error.message }
      }

      return { cycle, error: null }
    } catch (error) {
      return { cycle: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  // Get cycles for user
  async getByUserId(userId: string): Promise<{ cycles: CycleEntry[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('cycles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        return { cycles: null, error: error.message }
      }

      return { cycles: data, error: null }
    } catch (error) {
      return { cycles: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  // Update cycle entry
  async update(id: string, updates: Partial<CycleEntry>): Promise<{ cycle: CycleEntry | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('cycles')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return { cycle: null, error: error.message }
      }

      return { cycle: data, error: null }
    } catch (error) {
      return { cycle: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  // Delete cycle entry
  async delete(id: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('cycles')
        .delete()
        .eq('id', id)

      if (error) {
        return { error: error.message }
      }

      return { error: null }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },
}

// Fantasy entries functions
export const fantasies = {
  // Create new fantasy entry
  async create(data: FantasyEntry): Promise<{ fantasy: FantasyEntry | null; error: string | null }> {
    try {
      const { data: fantasy, error } = await supabase
        .from('entries')
        .insert(data)
        .select()
        .single()

      if (error) {
        return { fantasy: null, error: error.message }
      }

      return { fantasy, error: null }
    } catch (error) {
      return { fantasy: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  // Get fantasies for user
  async getByUserId(userId: string): Promise<{ fantasies: FantasyEntry[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        return { fantasies: null, error: error.message }
      }

      return { fantasies: data, error: null }
    } catch (error) {
      return { fantasies: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },
}

// Partner management functions
export const partners = {
  // Create partner relationship
  async create(data: PartnerEntry): Promise<{ partner: PartnerEntry | null; error: string | null }> {
    try {
      const { data: partner, error } = await supabase
        .from('partners')
        .insert(data)
        .select()
        .single()

      if (error) {
        return { partner: null, error: error.message }
      }

      return { partner, error: null }
    } catch (error) {
      return { partner: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  // Get partner relationships for user
  async getByUserId(userId: string): Promise<{ partners: PartnerEntry[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        return { partners: null, error: error.message }
      }

      return { partners: data, error: null }
    } catch (error) {
      return { partners: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },
}

// Subscription management functions
export const subscriptions = {
  // Create subscription
  async create(data: SubscriptionEntry): Promise<{ subscription: SubscriptionEntry | null; error: string | null }> {
    try {
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .insert(data)
        .select()
        .single()

      if (error) {
        return { subscription: null, error: error.message }
      }

      return { subscription, error: null }
    } catch (error) {
      return { subscription: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  // Get subscription for user
  async getByUserId(userId: string): Promise<{ subscription: SubscriptionEntry | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (error) {
        return { subscription: null, error: error.message }
      }

      return { subscription: data, error: null }
    } catch (error) {
      return { subscription: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },
}
