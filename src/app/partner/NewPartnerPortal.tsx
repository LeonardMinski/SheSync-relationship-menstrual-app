'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { 
  Heart, 
  Users, 
  Calendar, 
  MessageCircle, 
  Eye, 
  EyeOff, 
  Settings, 
  RefreshCw,
  ArrowLeft,
  Sparkles,
  Brain,
  Zap,
  Lock,
  Share2
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getPartnerSharedData } from '@/features/partner/services'
import { formatDateShort, getPhaseDisplayName, getMoodEmoji } from '@/features/partner/selectors'
import { TopNavbar } from '@/components/ui/Navbar'
import { Navbar } from '@/components/ui/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { PartnerSharedData, PartnerLink } from '@/features/partner/types'

export default function NewPartnerPortal() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  
  const [partnerData, setPartnerData] = useState<PartnerSharedData | null>(null)
  const [partnerLink, setPartnerLink] = useState<PartnerLink | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (user && !authLoading) {
      loadPartnerData()
    }
  }, [user, authLoading])

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

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

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cta-start"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-bg pb-20">
      <TopNavbar 
        title="Partner Portal" 
        subtitle={partnerData ? `Connected with ${partnerData.partnerName}` : 'No partner connected'}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        }
        showNotifications={true}
        showThemeToggle={true}
      />

      <div className="container mx-auto px-4 py-6 space-y-6">
        {!partnerData ? (
          /* No Partner Connected */
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No Partner Connected
              </h3>
              <p className="text-muted-foreground mb-6">
                Connect with your partner to see their shared activities and support their wellness journey.
              </p>
              <Button
                variant="cta"
                onClick={() => router.push('/settings')}
              >
                <Settings className="h-4 w-4" />
                Connect Partner
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Today at a Glance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-cta-start" />
                  Today at a Glance
                </CardTitle>
                <CardDescription>
                  {format(new Date(), 'EEEE, MMMM d')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Cycle Phase */}
                  {partnerData.todayCycle && (
                    <div className="text-center p-4 bg-bg-elevated rounded-lg">
                      <div className="text-2xl mb-2">
                        {getMoodEmoji(partnerData.todayCycle.mood)}
                      </div>
                      <div className="text-sm text-muted-foreground">Cycle Phase</div>
                      <div className="font-semibold text-foreground">
                        {getPhaseDisplayName(partnerData.todayCycle.phase)}
                      </div>
                    </div>
                  )}

                  {/* Mood */}
                  {partnerData.todayCycle && (
                    <div className="text-center p-4 bg-bg-elevated rounded-lg">
                      <div className="text-2xl mb-2">😊</div>
                      <div className="text-sm text-muted-foreground">Mood</div>
                      <div className="font-semibold text-foreground">
                        {partnerData.todayCycle.mood}/10
                      </div>
                    </div>
                  )}

                  {/* Energy */}
                  {partnerData.todayCycle && (
                    <div className="text-center p-4 bg-bg-elevated rounded-lg">
                      <div className="text-2xl mb-2">⚡</div>
                      <div className="text-sm text-muted-foreground">Energy</div>
                      <div className="font-semibold text-foreground">
                        {partnerData.todayCycle.energy}/10
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Intimacy Card */}
            {partnerData.todayIntimacy && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-cta-start" />
                    Today's Intimacy Card
                  </CardTitle>
                  <CardDescription>
                    Shared by your partner
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-accent-rose/10 text-accent-rose rounded-full text-sm font-medium">
                            {partnerData.todayIntimacy.selected_card?.category}
                          </span>
                          <span className="px-2 py-1 bg-accent-purple/10 text-accent-purple rounded-full text-sm font-medium">
                            Difficulty: {partnerData.todayIntimacy.selected_card?.difficulty}/5
                          </span>
                        </div>
                        <p className="text-foreground text-lg leading-relaxed">
                          {partnerData.todayIntimacy.selected_card?.text}
                        </p>
                      </div>
                    </div>
                    
                    {partnerData.todayIntimacy.reflection && (
                      <div className="pt-4 border-t border-border">
                        <h4 className="text-sm font-medium text-foreground mb-2">Partner's Reflection</h4>
                        <p className="text-muted-foreground italic">
                          "{partnerData.todayIntimacy.reflection}"
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fantasy Teaser */}
            {partnerData.todayFantasy && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-cta-start" />
                    Fantasy Teaser
                  </CardTitle>
                  <CardDescription>
                    A glimpse into your partner's desires
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          {partnerData.todayFantasy.title}
                        </h3>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2 py-1 bg-accent-rose/10 text-accent-rose rounded-full text-sm font-medium">
                            {partnerData.todayFantasy.type}
                          </span>
                          {partnerData.todayFantasy.tags && partnerData.todayFantasy.tags.length > 0 && (
                            <span className="px-2 py-1 bg-accent-purple/10 text-accent-purple rounded-full text-sm font-medium">
                              {partnerData.todayFantasy.tags[0]}
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground">
                          {partnerData.todayFantasy.content.length > 100 
                            ? `${partnerData.todayFantasy.content.substring(0, 100)}...`
                            : partnerData.todayFantasy.content
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Teaser - Full content available with consent
                        </span>
                      </div>
                      <Button variant="secondary" size="sm">
                        Request Full Access
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            {partnerData.recentActivity && partnerData.recentActivity.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-cta-start" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>
                    Your partner's recent shared activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {partnerData.recentActivity.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-bg-elevated rounded-lg"
                      >
                        <div className="p-2 rounded-full bg-cta-start/10">
                          {activity.type === 'cycle' && <Calendar className="h-4 w-4 text-cta-start" />}
                          {activity.type === 'intimacy' && <Heart className="h-4 w-4 text-cta-start" />}
                          {activity.type === 'fantasy' && <Sparkles className="h-4 w-4 text-cta-start" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-foreground text-sm">
                            {activity.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateShort(activity.date)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Privacy Settings Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-cta-start" />
                  Privacy & Sharing
                </CardTitle>
                <CardDescription>
                  What your partner is sharing with you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground">Cycle Phase</span>
                    <div className="flex items-center gap-2">
                      {partnerData.privacySettings.shareCyclePhase ? (
                        <Eye className="h-4 w-4 text-success" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-foreground">Mood & Energy</span>
                    <div className="flex items-center gap-2">
                      {partnerData.privacySettings.shareMood ? (
                        <Eye className="h-4 w-4 text-success" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-foreground">Intimacy Deck</span>
                    <div className="flex items-center gap-2">
                      {partnerData.privacySettings.shareIntimacyDeck ? (
                        <Eye className="h-4 w-4 text-success" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-foreground">Fantasy Vault</span>
                    <div className="flex items-center gap-2">
                      {partnerData.privacySettings.shareFantasyVault ? (
                        <Eye className="h-4 w-4 text-success" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Navbar />
    </div>
  )
}
