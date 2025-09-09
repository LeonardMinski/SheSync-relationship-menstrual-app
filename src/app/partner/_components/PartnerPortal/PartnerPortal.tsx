/**
 * Partner Portal - Main component for viewing shared partner data
 * 
 * Features:
 * - Today at a glance with shared cycle phase, mood, intimacy card
 * - Fantasy teasers/reveals based on privacy settings
 * - Respects privacy_settings and RLS
 * - Partner linking status and management
 * - Real-time updates when partner shares/unshares data
 */
'use client'

import { useEffect, useState } from 'react'
import { Heart, Users, Calendar, MessageCircle, Eye, EyeOff, Settings, RefreshCw } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getPartnerSharedData } from '@/features/partner/services'
import { formatDateShort, getPhaseDisplayName, getMoodEmoji } from '@/features/partner/selectors'
import LoadingSpinner from '@/components/LoadingSpinner'
import type { PartnerSharedData, PartnerLink } from '@/features/partner/types'

export default function PartnerPortal() {
  const { user, loading } = useAuth()
  const [partnerData, setPartnerData] = useState<PartnerSharedData | null>(null)
  const [partnerLink, setPartnerLink] = useState<PartnerLink | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (user && !loading) {
      loadPartnerData()
    }
  }, [user, loading])

  const loadPartnerData = async () => {
    if (!user) return

    try {
      setDataLoading(true)
      const data = await getPartnerSharedData(user.id)
      setPartnerData(data.sharedData)
      setPartnerLink(data.partnerLink)
    } catch (error) {
      console.error('Error loading partner data:', error)
    } finally {
      setDataLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadPartnerData()
    setRefreshing(false)
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
          <p className="text-muted">Please sign in to access partner features.</p>
        </div>
      </div>
    )
  }

  if (!partnerLink) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4" data-testid="no-partner">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-6">
            <Users size={32} className="text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-4">No Partner Connected</h1>
          <p className="text-muted mb-6">
            Connect with your partner to start sharing your journey together.
          </p>
          <button className="btn-primary" data-testid="connect-partner-button">
            <Users size={16} className="mr-2" />
            Connect Partner
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20 bg-gradient-to-br from-rose-50 via-white to-purple-50 dark:bg-[#0F0A1A]">
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{background: 'var(--cta-gradient)'}}>
                <Heart className="h-6 w-6 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Partner Portal</h1>
            <p className="text-muted">Supporting {partnerData?.partnerName || 'your partner'}'s journey</p>
          </div>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary p-2"
            data-testid="refresh-button"
          >
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Today at a Glance */}
        <section className="mb-8">
          <div className="card dark:card p-6" data-testid="today-at-glance">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
              <Calendar className="mr-2" size={20} />
              Today at a Glance
            </h2>
            
            {partnerData ? (
              <div className="space-y-6">
                {/* Cycle Phase & Mood */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {partnerData.privacySettings.shareCyclePhase && partnerData.todayCycle && (
                    <div className="elevated p-4 rounded-xl" data-testid="cycle-phase">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-muted">Cycle Phase</h3>
                        <Eye size={16} className="text-green-500" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{getMoodEmoji(partnerData.todayCycle.phase)}</span>
                        <span className="text-lg font-semibold text-foreground">
                          {getPhaseDisplayName(partnerData.todayCycle.phase)}
                        </span>
                      </div>
                    </div>
                  )}

                  {partnerData.privacySettings.shareMood && partnerData.todayCycle && (
                    <div className="elevated p-4 rounded-xl" data-testid="mood">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-muted">Today's Mood</h3>
                        <Eye size={16} className="text-green-500" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{getMoodEmoji(partnerData.todayCycle.mood)}</span>
                        <span className="text-lg font-semibold text-foreground">
                          {partnerData.todayCycle.mood}/10
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Intimacy Card */}
                {partnerData.privacySettings.shareIntimacyDeck && partnerData.todayIntimacy && (
                  <div className="elevated p-4 rounded-xl" data-testid="intimacy-card">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-muted">Today's Connection Card</h3>
                      <Eye size={16} className="text-green-500" />
                    </div>
                    <div className="bg-rose-50 dark:bg-rose-900/20 rounded-lg p-4">
                      <p className="text-foreground font-medium mb-2">
                        {partnerData.todayIntimacy.selected_card?.text}
                      </p>
                      <div className="flex items-center justify-between text-sm text-muted">
                        <span>{partnerData.todayIntimacy.selected_card?.category}</span>
                        <span>Level {partnerData.todayIntimacy.selected_card?.difficulty}</span>
                      </div>
                    </div>
                    {partnerData.todayIntimacy.reflection && (
                      <div className="mt-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <MessageCircle size={14} className="text-muted" />
                          <span className="text-xs text-muted font-medium">Reflection</span>
                        </div>
                        <p className="text-foreground text-sm">{partnerData.todayIntimacy.reflection}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Fantasy Teaser */}
                {partnerData.privacySettings.shareFantasyVault && partnerData.todayFantasy && (
                  <div className="elevated p-4 rounded-xl" data-testid="fantasy-teaser">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-muted">Fantasy Vault</h3>
                      <Eye size={16} className="text-green-500" />
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                      <p className="text-foreground font-medium mb-2">
                        {partnerData.todayFantasy.title}
                      </p>
                      <p className="text-muted text-sm line-clamp-2">
                        {partnerData.todayFantasy.content}
                      </p>
                      <div className="flex items-center justify-between mt-2 text-xs text-muted">
                        <span>{partnerData.todayFantasy.type}</span>
                        <span>{formatDateShort(partnerData.todayFantasy.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Privacy Notice */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4" data-testid="privacy-notice">
                  <div className="flex items-start space-x-2">
                    <Settings size={16} className="text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-blue-700 dark:text-blue-300 text-sm font-medium mb-1">
                        Privacy Settings
                      </p>
                      <p className="text-blue-600 dark:text-blue-400 text-xs">
                        Only data your partner has chosen to share is visible here. 
                        {!partnerData.privacySettings.shareWithPartner && ' Your partner has disabled sharing.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8" data-testid="no-shared-data">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                  <EyeOff size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No Shared Data Yet</h3>
                <p className="text-muted text-sm">
                  Your partner hasn't shared any data yet or has disabled sharing.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Recent Activity */}
        {partnerData && partnerData.recentActivity.length > 0 && (
          <section className="mb-8">
            <div className="card dark:card p-6" data-testid="recent-activity">
              <h2 className="text-xl font-semibold text-foreground mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {partnerData.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50" data-testid="activity-item">
                    <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0">
                      <Heart size={14} className="text-rose-600 dark:text-rose-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{activity.description}</p>
                      <p className="text-xs text-muted">{formatDateShort(activity.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Supportive Actions */}
        <section>
          <div className="card dark:card p-6" data-testid="supportive-actions">
            <h2 className="text-xl font-semibold text-foreground mb-4">Supportive Actions</h2>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Heart size={12} className="text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <p className="text-sm text-foreground font-medium">Be present and attentive</p>
                  <p className="text-xs text-muted">Listen actively when your partner shares their experiences.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MessageCircle size={12} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-foreground font-medium">Ask thoughtful questions</p>
                  <p className="text-xs text-muted">Show interest in their reflections and feelings.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Users size={12} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-foreground font-medium">Respect boundaries</p>
                  <p className="text-xs text-muted">Honour their comfort levels and consent preferences.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
