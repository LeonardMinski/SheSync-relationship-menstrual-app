'use client'

import Link from 'next/link'
import { Heart, Calendar, Brain, Users, Sparkles, ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getTheme } from '@/lib/storage'

export default function LandingPage() {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Ensure theme is applied immediately to prevent flickering
    const theme = getTheme()
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    setIsInitialized(true)
  }, [])

  // Prevent flash by not rendering until theme is set
  if (!isInitialized) {
    return null
  }
  return (
    <div className="min-h-screen" style={{backgroundColor: 'var(--bg-primary)'}}>
      {/* Header */}
      <header className="backdrop-blur-2xl border-b sticky top-0 z-50 shadow-lg" style={{
        backgroundColor: 'var(--bg-glass)',
        borderColor: 'var(--border-subtle)',
        boxShadow: 'var(--shadow-soft)'
      }}>
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg" style={{background: 'var(--accent-gradient)'}}>
              <Heart className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">SheSync+</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link
              href="/auth/login"
              className="font-medium transition-colors duration-300 hover:opacity-80"
              style={{color: 'var(--text-secondary)'}}
            >
              Login
            </Link>
            <Link
              href="/auth/signup"
              className="btn-primary px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95 text-white"
            >
              Get Started
            </Link>
          </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight text-gray-900 dark:text-white">
            Your Complete
            <span className="gradient-text"> Wellness </span>
            & Intimacy Companion
          </h1>
          
          <div className="flex justify-center mb-12">
            <p 
              className="text-xl max-w-2xl leading-relaxed text-gray-600 dark:text-gray-300"
              style={{ textAlign: 'center' }}
            >
              Track your menstrual cycle, enhance intimacy with your partner, explore fantasies safely, 
              and get AI-powered coaching - all in one beautiful, private app.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <Link
              href="/auth/signup"
              className="group btn-primary px-10 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-xl hover:shadow-2xl flex items-center justify-center relative overflow-hidden text-white"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative">Start Your Journey</span>
              <ArrowRight className="ml-2 h-5 w-5 relative group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            
            <Link
              href="/auth/login"
              className="backdrop-blur-xl px-10 py-4 rounded-2xl font-semibold text-lg border transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-xl"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          <div className="glass-effect rounded-2xl p-6 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-gradient-to-br from-rose-500 to-purple-600">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Cycle Tracking</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Intelligent menstrual cycle tracking with mood, symptoms, and phase insights.
            </p>
          </div>

          <div className="glass-effect rounded-2xl p-6 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Intimacy Cards</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Curated conversation starters and activities to deepen your connection.
            </p>
          </div>

          <div className="glass-effect rounded-2xl p-6 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-600">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Fantasy Vault</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Private space to explore and share your desires in a safe environment.
            </p>
          </div>

          <div className="glass-effect rounded-2xl p-6 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-gradient-to-br from-emerald-500 to-teal-600">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">AI Coach</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Personalized guidance for wellness, relationships, and intimate health.
            </p>
          </div>
        </div>

        {/* Partner Features */}
        <div className="bg-gradient-to-r from-rose-500/10 to-purple-600/10 dark:from-rose-900/20 dark:to-purple-900/20 rounded-3xl p-8 md:p-12 text-center mb-20">
          <Users className="h-16 w-16 text-rose-500 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Better Together
          </h2>
          <p 
            className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed"
            style={{ textAlign: 'center' }}
          >
            Connect with your partner to share cycle insights, explore intimacy cards together, 
            and build deeper understanding through synchronized wellness tracking.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600 dark:text-gray-300">
            <span className="bg-white/50 dark:bg-gray-800/50 px-4 py-2 rounded-full">🔒 Private & Secure</span>
            <span className="bg-white/50 dark:bg-gray-800/50 px-4 py-2 rounded-full">💕 Couple Syncing</span>
            <span className="bg-white/50 dark:bg-gray-800/50 px-4 py-2 rounded-full">🎯 Personalized Insights</span>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Ready to Transform Your Wellness Journey?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Join thousands of women who've discovered a more connected, informed approach to their health and relationships.
          </p>
          
          <Link
            href="/auth/signup"
            className="inline-flex items-center bg-gradient-to-r from-rose-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-rose-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <span className="text-white">Get Started Free</span>
            <ArrowRight className="ml-2 h-5 w-5 text-white" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t border-gray-200 dark:border-gray-700 mt-20">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2025 SheSync+. Empowering women through technology.</p>
        </div>
      </footer>
    </div>
  )
}
