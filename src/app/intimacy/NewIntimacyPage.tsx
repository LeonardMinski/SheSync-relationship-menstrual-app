'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Heart, 
  Plus, 
  Share2, 
  Edit3, 
  ArrowLeft,
  CheckCircle,
  XCircle,
  HelpCircle,
  Star,
  MessageCircle
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { TopNavbar } from '@/components/ui/Navbar'
import { Navbar } from '@/components/ui/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'
import { Textarea } from '@/components/ui/Input'
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
import type { BoundaryItemRecord, IntimacyCard, IntimacySession } from '@/features/intimacy/schemas'

export default function NewIntimacyPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  
  const [boundaries, setBoundaries] = useState<BoundaryItemRecord[]>([])
  const [todaySession, setTodaySession] = useState<IntimacySession | null>(null)
  const [suggestedCard, setSuggestedCard] = useState<IntimacyCard | null>(null)
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [showBoundaryForm, setShowBoundaryForm] = useState(false)
  const [showReflectionForm, setShowReflectionForm] = useState(false)
  const [newBoundary, setNewBoundary] = useState('')
  const [reflection, setReflection] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user && !authLoading) {
      loadIntimacyData()
    }
  }, [user, authLoading])

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  const loadIntimacyData = async () => {
    if (!user) return

    try {
      setDataLoading(true)
      
      // Load boundaries
      const boundariesData = await listBoundaries(user.id)
      setBoundaries(boundariesData || [])

      // Load today's session
      const sessionData = await getTodaySession(user.id)
      setTodaySession(sessionData)

      // Load suggested card
      const cardData = await getTodayCard(user.id)
      setSuggestedCard(cardData)

      // Load partner ID
      const partner = await getPartnerId(user.id)
      setPartnerId(partner)

    } catch (error) {
      console.error('Error loading intimacy data:', error)
    } finally {
      setDataLoading(false)
    }
  }

  const handleAddBoundary = async () => {
    if (!user || !newBoundary.trim()) return

    setSaving(true)
    try {
      // Add boundary logic here
      setNewBoundary('')
      setShowBoundaryForm(false)
      await loadIntimacyData()
    } catch (error) {
      console.error('Error adding boundary:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveReflection = async () => {
    if (!user || !reflection.trim()) return

    setSaving(true)
    try {
      // Save reflection logic here
      setReflection('')
      setShowReflectionForm(false)
      await loadIntimacyData()
    } catch (error) {
      console.error('Error saving reflection:', error)
    } finally {
      setSaving(false)
    }
  }

  const getBoundaryIcon = (status: string) => {
    switch (status) {
      case 'yes':
        return <CheckCircle className="h-5 w-5 text-success" />
      case 'no':
        return <XCircle className="h-5 w-5 text-error" />
      case 'maybe':
        return <HelpCircle className="h-5 w-5 text-warning" />
      default:
        return <HelpCircle className="h-5 w-5 text-muted-foreground" />
    }
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
        title="Intimacy" 
        subtitle="Connection & Boundaries"
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
        showNotifications={true}
        showThemeToggle={true}
      />

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Today's Card */}
        {suggestedCard && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-cta-start" />
                Today's Intimacy Card
              </CardTitle>
              <CardDescription>
                Suggested for your current cycle phase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-accent-rose/10 text-accent-rose rounded-full text-sm font-medium">
                        {getCategoryDisplayName(suggestedCard.category)}
                      </span>
                      <span className="px-2 py-1 bg-accent-purple/10 text-accent-purple rounded-full text-sm font-medium">
                        {getDifficultyDisplayName(suggestedCard.difficulty)}
                      </span>
                    </div>
                    <p className="text-foreground text-lg leading-relaxed">
                      {suggestedCard.text}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-warning" />
                    <span className="text-sm text-muted-foreground">
                      Difficulty: {suggestedCard.difficulty}/5
                    </span>
                  </div>
                  <Button variant="cta" size="sm">
                    <Share2 className="h-4 w-4" />
                    Share with Partner
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Boundaries */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-cta-start" />
                  Boundaries & Preferences
                </CardTitle>
                <CardDescription>
                  Set your comfort levels for different activities
                </CardDescription>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowBoundaryForm(true)}
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {boundaries.map((boundary) => (
                <div
                  key={boundary.id}
                  className="flex items-center justify-between p-3 bg-bg-elevated rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getBoundaryIcon(boundary.status)}
                    <span className="text-foreground font-medium">
                      {boundary.text}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {getBoundaryStatusDisplay(boundary.status)}
                    </span>
                    <Button variant="ghost" size="sm">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {boundaries.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No boundaries set yet</p>
                  <p className="text-sm">Add your first boundary to get started</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Today's Session */}
        {todaySession && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-cta-start" />
                Today's Session
              </CardTitle>
              <CardDescription>
                {getTodayDate()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Shared with partner</span>
                  <Toggle
                    checked={todaySession.shared_with_partner}
                    onChange={() => {}} // Handle toggle
                    label=""
                  />
                </div>
                
                {todaySession.reflection && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Reflection
                    </label>
                    <p className="text-foreground bg-bg-elevated p-3 rounded-lg">
                      {todaySession.reflection}
                    </p>
                  </div>
                )}
                
                <Button
                  variant="secondary"
                  onClick={() => setShowReflectionForm(true)}
                  className="w-full"
                >
                  <MessageCircle className="h-4 w-4" />
                  Add Reflection
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Partner Status */}
        {partnerId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-cta-start" />
                Partner Connection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-foreground font-medium">Connected</p>
                  <p className="text-sm text-muted-foreground">
                    Your partner can see shared activities
                  </p>
                </div>
                <div className="w-3 h-3 bg-success rounded-full"></div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Boundary Modal */}
      {showBoundaryForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add New Boundary</CardTitle>
              <CardDescription>
                Set your comfort level for a new activity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Activity
                </label>
                <input
                  type="text"
                  value={newBoundary}
                  onChange={(e) => setNewBoundary(e.target.value)}
                  placeholder="e.g., Massage, Kissing, etc."
                  className="input"
                />
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowBoundaryForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="cta"
                  onClick={handleAddBoundary}
                  loading={saving}
                  className="flex-1"
                >
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reflection Modal */}
      {showReflectionForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add Reflection</CardTitle>
              <CardDescription>
                Share your thoughts about today's intimacy session
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                label="Reflection"
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="How did you feel? What worked well? What would you like to try next?"
                rows={4}
              />
              
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowReflectionForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="cta"
                  onClick={handleSaveReflection}
                  loading={saving}
                  className="flex-1"
                >
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Navbar />
    </div>
  )
}
