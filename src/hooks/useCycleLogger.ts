import { useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'

export interface CycleEntry {
  id?: string
  user_id: string
  phase: string
  mood: number
  symptoms: string[]
  created_at?: string
}

export interface LogCycleData {
  phase: string
  mood: number
  symptoms: string[]
}

export const useCycleLogger = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cycles, setCycles] = useState<CycleEntry[]>([])
  const { user } = useAuth()

  const logCycle = useCallback(async (data: LogCycleData): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/log-cycle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}` // In production, use actual JWT token
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to log cycle')
      }

      // Refresh the cycles list after successful logging
      await fetchCycles()
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to log cycle'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [user])

  const fetchCycles = useCallback(async (): Promise<void> => {
    if (!user) {
      setError('User not authenticated')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/log-cycle', {
        headers: {
          'Authorization': `Bearer ${user.id}` // In production, use actual JWT token
        }
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch cycles')
      }

      setCycles(result.data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch cycles'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [user])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    logCycle,
    fetchCycles,
    cycles,
    loading,
    error,
    clearError
  }
}
