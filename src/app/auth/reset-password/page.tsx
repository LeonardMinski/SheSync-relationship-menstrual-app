'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabaseClient'

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    let isMounted = true

    const checkRecoverySession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!isMounted) return

      if (data.session) {
        setSessionReady(true)
      } else {
        setError('This reset link is invalid or expired. Request a new one.')
      }
    }

    checkRecoverySession()

    return () => {
      isMounted = false
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (loading) return

    setError('')
    setSuccess('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setLoading(true)

    try {
      const result = await updatePassword(password)
      if (!result.success) {
        setError(result.error || 'Unable to update password')
        return
      }

      setSuccess('Password updated. Redirecting to sign in...')
      setTimeout(() => {
        router.replace('/auth/login')
      }, 1200)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Choose a new password</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Set a new password for your account.</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
              {success}
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              New Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 transition-all duration-200"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)'
              }}
              placeholder="New password"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 transition-all duration-200"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)'
              }}
              placeholder="Confirm new password"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !sessionReady}
            className="btn-primary group relative w-full flex justify-center py-2 px-4 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating password...' : 'Update password'}
          </button>

          <div className="text-center">
            <Link href="/auth/login" className="font-medium text-rose-600 hover:text-rose-500">
              Back to sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
