import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const isBrowser = typeof window !== 'undefined'

type StorageLike = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
  clear: () => void
  key: (index: number) => string | null
  readonly length: number
}

const createMemoryStorage = (): StorageLike => {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size
    }
  }
}

const ensureServerStorageShape = () => {
  if (isBrowser) return
  const globalScope = globalThis as unknown as {
    localStorage?: Partial<StorageLike>
    sessionStorage?: Partial<StorageLike>
  }

  if (typeof globalScope.localStorage?.getItem !== 'function') {
    globalScope.localStorage = createMemoryStorage()
  }

  if (typeof globalScope.sessionStorage?.getItem !== 'function') {
    globalScope.sessionStorage = createMemoryStorage()
  }
}

ensureServerStorageShape()

const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// Check if environment variables are properly loaded
if (!isSupabaseConfigured) {
  // Only throw error in production
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Missing Supabase environment variables in production')
  }

  // Avoid noisy client runtime overlays in dev; warn once on the server.
  if (!isBrowser) {
    console.warn('Missing Supabase environment variables.')
    console.warn('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
    console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing')
    console.warn('Using placeholder Supabase config in development. Create .env.local to enable auth/data.')
  }
}

// Custom storage that uses localStorage for persistent sessions and sessionStorage for temporary ones
const createCustomStorage = () => {
  if (!isBrowser) return undefined
  if (typeof window.localStorage?.getItem !== 'function') return undefined
  if (typeof window.sessionStorage?.getItem !== 'function') return undefined
  
  return {
    getItem: (key: string) => {
      // Check localStorage first (for remember me sessions)
      const localValue = window.localStorage.getItem(key)
      if (localValue) return localValue
      
      // Fall back to sessionStorage (for temporary sessions)
      return window.sessionStorage.getItem(key)
    },
    setItem: (key: string, value: string) => {
      // Check if this is a remember me session by looking for a flag
      const rememberMe = window.localStorage.getItem('supabase-remember-me') === 'true'
      
      if (rememberMe) {
        window.localStorage.setItem(key, value)
      } else {
        window.sessionStorage.setItem(key, value)
      }
    },
    removeItem: (key: string) => {
      window.localStorage.removeItem(key)
      window.sessionStorage.removeItem(key)
    }
  }
}

// Create Supabase client with proper error handling
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      // Never persist/refresh sessions on the server to avoid non-browser storage access.
      persistSession: isBrowser,
      autoRefreshToken: isBrowser,
      detectSessionInUrl: isBrowser,
      storage: createCustomStorage(),
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
