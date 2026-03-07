import { supabase } from './supabaseClient'

// Types
export interface User {
  id: string
  email: string
  name: string
  subscription_tier: 'free' | 'premium' | 'vip' | 'lifetime'
  subscription_status?: 'active' | 'canceled' | 'past_due' | null
  stripe_subscription_id?: string | null
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
  rememberMe?: boolean
}

const defaultPrivacySettings = {
  share_with_partner: false,
  share_cycle_phase: false,
  share_mood: false,
  share_fantasy_vault: false,
  share_intimacy_deck: false,
}

const normalizeEmail = (email: string) => email.trim().toLowerCase()

const withTimeout = async <T>(promise: Promise<T>, label: string, timeoutMs: number = 15000): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out. Check Supabase Auth settings and try again.`))
    }, timeoutMs)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

const buildFallbackUser = (user: {
  id: string
  email?: string | null
  user_metadata?: { name?: string | null }
}): User => ({
  id: user.id,
  email: user.email || '',
  name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
  subscription_tier: 'free',
  created_at: new Date().toISOString(),
  privacy_settings: defaultPrivacySettings,
})

// Auth functions
export const auth = {
  async getCurrentUser(): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data: { session }, error: sessionError } = await withTimeout(
        supabase.auth.getSession(),
        'Session lookup'
      )
      
      if (sessionError) {
        return { user: null, error: sessionError.message }
      }

      if (!session?.user) {
        return { user: null, error: null } // No session is normal, not an error
      }

      // Get user profile from our users table
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileError) {
        const newUser = buildFallbackUser(session.user)

        // Try to create the profile, but don't block auth if it fails.
        const { error: insertError } = await supabase
          .from('users')
          .upsert(newUser, { onConflict: 'id' })

        if (insertError) {
          console.error('Error creating user profile:', insertError)
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

  async signUp(data: CreateUserData): Promise<{ user: User | null; error: string | null; requiresEmailVerification: boolean }> {
    try {
      // Check if Supabase is properly configured
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        return { user: null, error: 'Supabase not configured. Please check your environment variables.', requiresEmailVerification: false }
      }

      const normalizedEmail = normalizeEmail(data.email)
      const { data: authData, error: authError } = await withTimeout(
        supabase.auth.signUp({
          email: normalizedEmail,
          password: data.password,
          options: {
            data: {
              name: data.name
            }
          }
        }),
        'Sign up'
      )

      if (authError) {
        console.error('Supabase signup error:', authError)
        if (authError.code === 'over_email_send_rate_limit') {
          return {
            user: null,
            error: 'Email rate limit exceeded in Supabase. For development, disable email confirmation or wait before retrying.',
            requiresEmailVerification: false,
          }
        }
        if (
          authError.code === 'user_already_exists' ||
          authError.message.toLowerCase().includes('already registered') ||
          authError.message.toLowerCase().includes('user already registered')
        ) {
          return {
            user: null,
            error: 'An account with this email already exists. Sign in instead or reset your password.',
            requiresEmailVerification: false,
          }
        }
        return { user: null, error: authError.message, requiresEmailVerification: false }
      }

      if (!authData.user) {
        return { user: null, error: 'Signup failed', requiresEmailVerification: false }
      }

      // Create user profile
      const newUser: User = {
        id: authData.user.id,
        email: authData.user.email || normalizedEmail,
        name: data.name,
        subscription_tier: 'free',
        created_at: new Date().toISOString(),
        privacy_settings: data.privacy_settings || defaultPrivacySettings
      }

      const { error: profileError } = await supabase
        .from('users')
        .upsert(newUser, { onConflict: 'id' })

      if (profileError && Object.keys(profileError).length > 0) {
        console.error('Error creating user profile:', profileError)
        return { user: newUser, error: null, requiresEmailVerification: !authData.session }
      }

      return { user: newUser, error: null, requiresEmailVerification: !authData.session }
    } catch (error) {
      console.error('Error signing up:', error)
      return { user: null, error: error instanceof Error ? error.message : 'Unknown error', requiresEmailVerification: false }
    }
  },

  async signIn(data: LoginData): Promise<{ user: User | null; error: string | null }> {
    try {
      const normalizedEmail = normalizeEmail(data.email)
      // Set remember me flag before authentication
      if (typeof window !== 'undefined') {
        if (data.rememberMe) {
          window.localStorage.setItem('supabase-remember-me', 'true')
        } else {
          window.localStorage.removeItem('supabase-remember-me')
        }
      }
      
      const { data: authData, error: authError } = await withTimeout(
        supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: data.password
        }),
        'Sign in'
      )

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
        const fallbackUser = buildFallbackUser(authData.user)
        const { error: insertError } = await supabase
          .from('users')
          .upsert(fallbackUser, { onConflict: 'id' })

        if (insertError) {
          console.error('Error creating missing user profile during sign in:', insertError)
        }

        return { user: fallbackUser, error: null }
      }

      return { user: userProfile, error: null }
    } catch (error) {
      console.error('Error signing in:', error)
      return { user: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  async signOut(): Promise<{ error: string | null }> {
    try {
      // Clear remember me flag on sign out
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('supabase-remember-me')
      }
      
      const { error } = await supabase.auth.signOut()
      return { error: error?.message || null }
    } catch (error) {
      console.error('Error signing out:', error)
      return { error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  async requestPasswordReset(email: string, redirectTo?: string): Promise<{ error: string | null }> {
    try {
      const normalizedEmail = normalizeEmail(email)
      const { error } = await withTimeout(
        supabase.auth.resetPasswordForEmail(normalizedEmail, redirectTo ? { redirectTo } : undefined),
        'Password reset request'
      )

      if (error) {
        return { error: error.message }
      }

      return { error: null }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  async updatePassword(password: string): Promise<{ error: string | null }> {
    try {
      const { error } = await withTimeout(
        supabase.auth.updateUser({ password }),
        'Password update'
      )

      if (error) {
        return { error: error.message }
      }

      return { error: null }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}

// Cycles database operations
export const cycles = {
  async create(data: {
    user_id: string
    phase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal'
    mood: number
    symptoms: string[]
  }): Promise<{ cycle: any | null; error: string | null }> {
    try {
      const { data: cycle, error } = await supabase
        .from('cycle_data')
        .insert({
          user_id: data.user_id,
          date: new Date().toISOString().split('T')[0], // Current date
          phase: data.phase,
          mood: data.mood,
          energy: 5, // Default values
          libido: 5,
          stress: 5,
          symptoms: data.symptoms
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating cycle entry:', error)
        return { cycle: null, error: error.message }
      }

      return { cycle, error: null }
    } catch (error) {
      console.error('Error creating cycle entry:', error)
      return { cycle: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  async getByUserId(userId: string): Promise<{ cycles: any[] | null; error: string | null }> {
    try {
      const { data: cycles, error } = await supabase
        .from('cycle_data')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })

      if (error) {
        console.error('Error fetching cycles:', error)
        return { cycles: null, error: error.message }
      }

      return { cycles, error: null }
    } catch (error) {
      console.error('Error fetching cycles:', error)
      return { cycles: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}
