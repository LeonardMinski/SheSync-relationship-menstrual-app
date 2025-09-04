'use client'

import React from 'react'
import Link from 'next/link'

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-purple-50">
      <div className="max-w-md w-full space-y-8 p-8 text-center">
        <div className="space-y-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-rose-100">
            <svg
              className="h-6 w-6 text-rose-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-white">Check your email</h1>
          <p className="text-gray-600">
            We've sent you a verification link to confirm your email address.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-sm text-blue-700">
            <strong>Important:</strong> Please check your spam folder if you don't see the email in your inbox.
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Once you've verified your email, you can{' '}
            <Link href="/auth/login" className="font-medium text-rose-600 hover:text-rose-500">
              sign in to your account
            </Link>
            .
          </p>
          
          <p className="text-sm text-gray-600">
            Didn't receive the email?{' '}
            <Link href="/auth/resend-verification" className="font-medium text-rose-600 hover:text-rose-500">
              Click here to resend
            </Link>
            .
          </p>
        </div>

        <div className="pt-4">
          <Link
            href="/auth/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-rose-700 bg-rose-100 hover:bg-rose-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
