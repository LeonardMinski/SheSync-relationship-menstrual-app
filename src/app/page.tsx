'use client'

import Link from 'next/link'
import { Heart, Calendar, Brain, Users, Sparkles, ArrowRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-rose-500" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">SheSync+</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link
              href="/auth/login"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
            >
              Login
            </Link>
            <Link
              href="/auth/signup"
              className="bg-gradient-to-r from-rose-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-rose-600 hover:to-purple-700 transition-all duration-200"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Your Complete
            <span className="bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text text-transparent"> Wellness </span>
            & Intimacy Companion
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
            Track your menstrual cycle, enhance intimacy with your partner, explore fantasies safely, 
            and get AI-powered coaching - all in one beautiful, private app.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/auth/signup"
              className="bg-gradient-to-r from-rose-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-rose-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center"
            >
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            
            <Link
              href="/auth/login"
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-8 py-4 rounded-xl font-semibold text-lg border-2 border-gray-200 dark:border-gray-600 hover:border-rose-300 dark:hover:border-rose-400 transition-all duration-200 transform hover:scale-105"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-rose-200 dark:border-gray-700 text-center">
            <div className="bg-rose-100 dark:bg-rose-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-rose-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Cycle Tracking</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Intelligent menstrual cycle tracking with mood, symptoms, and phase insights.
            </p>
          </div>

          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-rose-200 dark:border-gray-700 text-center">
            <div className="bg-purple-100 dark:bg-purple-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-purple-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Intimacy Cards</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Curated conversation starters and activities to deepen your connection.
            </p>
          </div>

          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-rose-200 dark:border-gray-700 text-center">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-indigo-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Fantasy Vault</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Private space to explore and share your desires in a safe environment.
            </p>
          </div>

          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-rose-200 dark:border-gray-700 text-center">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">AI Coach</h3>
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
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
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
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t border-gray-200 dark:border-gray-700 mt-20">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2024 SheSync+. Empowering women through technology.</p>
        </div>
      </footer>
    </div>
  )
}
