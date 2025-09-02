'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { auth, User, CreateUserData, LoginData } from '@/lib/db'
import { supabase } from '@/lib/supabaseClient'

interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: (data: CreateUserData) => Promise<{ success: boolean; error?: string }>
  signIn: (data: LoginData) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { user: currentUser, error } = await auth.getCurrentUser()
        if (error) {
          console.error('Session check error:', error)
        } else if (currentUser) {
          setUser(currentUser)
        }
      } catch (error) {
        console.error('Session check failed:', error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { user: userProfile } = await auth.getCurrentUser()
        setUser(userProfile)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (data: CreateUserData): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true)
      const { user: newUser, error } = await auth.signUp(data)

      if (error) {
        return { success: false, error }
      }

      if (newUser) {
        setUser(newUser)
        return { success: true }
      }

      return { success: false, error: 'Signup failed' }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (data: LoginData): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true)
      const { user: signedInUser, error } = await auth.signIn(data)

      if (error) {
        return { success: false, error }
      }

      if (signedInUser) {
        setUser(signedInUser)
        return { success: true }
      }

      return { success: false, error: 'Signin failed' }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true)
      const { error } = await auth.signOut()
      if (error) {
        console.error('Signout error:', error)
      }
      setUser(null)
    } catch (error) {
      console.error('Signout failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshUser = async (): Promise<void> => {
    try {
      const { user: currentUser, error } = await auth.getCurrentUser()
      if (error) {
        console.error('User refresh error:', error)
      } else if (currentUser) {
        setUser(currentUser)
      }
    } catch (error) {
      console.error('User refresh failed:', error)
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
