/**
 * Intimacy Page - Main intimacy feature page for couples
 * 
 * Features:
 * - Needs & Boundaries management
 * - Daily intimacy card selection
 * - Reflection form for session feedback
 * - Share toggle for partner visibility
 * - Partner connection status
 * - Back to dashboard navigation
 * 
 * Route: /intimacy
 */
'use client'

import { useEffect, useState } from 'react'
import { Heart, Plus, Share2, Edit3, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { 
  listBoundaries, 
  getTodayCard, 
  getTodaySession,
  getPartnerId 
} from '@/features/intimacy/services'
import { 
  getCategoryDisplayName, 
  getDifficultyDisplayName,
  getBoundaryStatusDisplay,
  hasConsentRequirement,
  getTodayDate
} from '@/features/intimacy/selectors'
import NewIntimacyPage from './NewIntimacyPage'
import type { BoundaryItemRecord, IntimacyCard, IntimacySession } from '@/features/intimacy/schemas'

export default function IntimacyPage() {
  return <NewIntimacyPage />
}

// Old intimacy page implementation - kept for reference
function OldIntimacyPage() {
  const { user, loading } = useAuth()
  const [boundaries, setBoundaries] = useState<BoundaryItemRecord[]>([])
  const [todaySession, setTodaySession] = useState<IntimacySession | null>(null)
  const [suggestedCard, setSuggestedCard] = useState<IntimacyCard | null>(null)
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (user && !loading) {
      loadIntimacyData()
    }
  }, [user, loading])

  const loadIntimacyData = async () => {
    if (!user) return

    try {
      const today = getTodayDate()
      
      const [boundariesData, sessionData, cardData, partnerData] = await Promise.all([
        listBoundaries(user.id),
        getTodaySession(user.id, today),
        getTodayCard(user.id, { difficulty: 1 }),
        getPartnerId(user.id),
      ])

      setBoundaries(boundariesData)
      setTodaySession(sessionData)
      setSuggestedCard(cardData)
      setPartnerId(partnerData)
    } catch (error) {
      console.error('Error loading intimacy data:', error)
    } finally {
      setDataLoading(false)
    }
  }

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Access Required</h1>
          <p className="text-muted">Please sign in to access intimacy features.</p>
        </div>
      </div>
    )
  }

  const hasPartner = !!partnerId
  const today = getTodayDate()

  return (
    <div className="min-h-screen pb-20 bg-gradient-to-br from-rose-50 via-white to-purple-50 dark:bg-[#0F0A1A]">
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Back to Dashboard Button */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-sm text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{background: 'var(--cta-gradient)'}}>
              <Heart className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Intimacy</h1>
          <p className="text-muted">Nurture connection and deepen your relationship</p>
        </div>

        {/* Needs & Boundaries Section */}
        <section className="mb-8">
          <div className="card dark:card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Needs & Boundaries</h2>
              <button className="flex items-center space-x-2 text-sm text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300">
                <Plus size={16} />
                <span>Add</span>
              </button>
            </div>
            <p className="text-muted text-sm mb-4">
              Set your boundaries and communicate your needs for today.
            </p>
            <BoundaryManager boundaries={boundaries} />
          </div>
        </section>

        {/* Today's Card Section */}
        <section className="mb-8">
          <div className="card dark:card p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Today's Connection</h2>
            
            {todaySession ? (
              <div className="space-y-4">
                {/* Selected Card Display */}
                <div className="elevated p-4 rounded-xl">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-foreground">
                        {getCategoryDisplayName(todaySession.selected_card?.category || '')}
                      </span>
                      <span className="text-xs text-muted">
                        {getDifficultyDisplayName(todaySession.selected_card?.difficulty || 1)}
                      </span>
                    </div>
                    {hasConsentRequirement(todaySession.selected_card!) && (
                      <span className="text-xs text-help bg-help/10 px-2 py-1 rounded-full">
                        Ask first; stop on no/neutral.
                      </span>
                    )}
                  </div>
                  <p className="text-foreground mb-3">{todaySession.selected_card?.text}</p>
                  
                  {/* Share Toggle */}
                  {hasPartner && (
                    <ShareToggle 
                      date={today}
                      shared={todaySession.shared_with_partner}
                    />
                  )}
                </div>

                {/* Reflection Form */}
                <ReflectionForm 
                  date={today}
                  initialReflection={todaySession.reflection || ''}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-muted text-sm">
                  Choose a connection card to start your day with intention.
                </p>
                <TodayCardSelector suggestedCard={suggestedCard} />
              </div>
            )}
          </div>
        </section>

        {/* Partner Connection Section */}
        {hasPartner && (
          <section className="mb-8">
            <div className="card dark:card p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Partner Connection</h2>
              <p className="text-muted text-sm mb-4">
                Your partner can see shared activities and support you throughout the day.
              </p>
              <div className="flex items-center space-x-2 text-sm text-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Connected with your partner</span>
              </div>
            </div>
          </section>
        )}

        {/* Tips Section */}
        <section>
          <div className="card dark:card p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Connection Tips</h2>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Heart size={12} className="text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <p className="text-sm text-foreground font-medium">Start with gentle connection</p>
                  <p className="text-xs text-muted">Begin with level 1 cards to build comfort and trust.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Edit3 size={12} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-foreground font-medium">Reflect on your experience</p>
                  <p className="text-xs text-muted">Take time to process and share your feelings.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Share2 size={12} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-foreground font-medium">Share with intention</p>
                  <p className="text-xs text-muted">Only share what feels safe and comfortable for you.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}