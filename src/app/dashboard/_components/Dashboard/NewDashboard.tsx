'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { 
  Calendar, 
  TrendingUp, 
  Heart, 
  Zap, 
  Brain,
  Plus,
  Droplet,
  Sparkles,
  MessageCircle
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useCycleLogger } from '@/features/cycle/hooks/useCycleLogger'
import { TopNavbar } from '@/components/ui/Navbar'
import { Navbar } from '@/components/ui/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { getPhaseEmoji, getPhaseColor } from '@/lib/mockData'
import type { CycleData } from '@/types'

export default function NewDashboard() {
  const { user, loading: authLoading } = useAuth()
  const { cycles, fetchCycles, logCycle, loading: cycleLoading } = useCycleLogger()
  const router = useRouter()
  
  const [showLogForm, setShowLogForm] = useState(false)
  const [mood, setMood] = useState(5)
  const [energy, setEnergy] = useState(5)
  const [libido, setLibido] = useState(5)
  const [stress, setStress] = useState(5)
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [logging, setLogging] = useState(false)

  // Get today's cycle data
  const todaysData = cycles.find(cycle =>
    cycle.date === format(new Date(), 'yyyy-MM-dd')
  )

  useEffect(() => {
    if (user && !authLoading) {
      fetchCycles()
    }
  }, [user, authLoading, fetchCycles])

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  const handleLogCycle = async () => {
    if (!user) return

    setLogging(true)
    try {
      const success = await logCycle({
        phase: todaysData?.phase || 'follicular',
        mood,
        energy,
        libido,
        stress,
        symptoms,
        notes
      })

      if (success) {
        setShowLogForm(false)
        // Reset form
        setMood(5)
        setEnergy(5)
        setLibido(5)
        setStress(5)
        setSymptoms([])
        setNotes('')
      }
    } catch (error) {
      console.error('Error logging cycle:', error)
    } finally {
      setLogging(false)
    }
  }

  const toggleSymptom = (symptom: string) => {
    setSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    )
  }

  const symptomOptions = [
    'Cramps', 'Bloating', 'Headache', 'Fatigue', 'Mood swings',
    'Breast tenderness', 'Acne', 'Food cravings', 'Insomnia'
  ]

  if (authLoading || cycleLoading) {
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
        title="Dashboard" 
        subtitle={format(new Date(), 'EEEE, MMMM d')}
        actions={
          <Button
            variant="cta"
            size="sm"
            onClick={() => setShowLogForm(true)}
          >
            <Plus className="h-4 w-4" />
            Log Today
          </Button>
        }
        showNotifications={true}
        showThemeToggle={true}
      />

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Cycle Phase Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-cta-start" />
              Today's Cycle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {todaysData ? getPhaseEmoji(todaysData.phase) : '🌙'} {todaysData?.phase || 'Unknown'}
                </div>
                <CardDescription>
                  {todaysData ? `Day ${todaysData.day} of cycle` : 'No data logged today'}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Mood</div>
                <div className="text-lg font-semibold text-foreground">
                  {todaysData?.mood || '—'}/10
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent-rose/10">
                  <Heart className="h-5 w-5 text-accent-rose" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Energy</div>
                  <div className="text-lg font-semibold text-foreground">
                    {todaysData?.energy || '—'}/10
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent-purple/10">
                  <Zap className="h-5 w-5 text-accent-purple" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Libido</div>
                  <div className="text-lg font-semibold text-foreground">
                    {todaysData?.libido || '—'}/10
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Brain className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Stress</div>
                  <div className="text-lg font-semibold text-foreground">
                    {todaysData?.stress || '—'}/10
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info/10">
                  <TrendingUp className="h-5 w-5 text-info" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Symptoms</div>
                  <div className="text-lg font-semibold text-foreground">
                    {todaysData?.symptoms?.length || 0}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                className="h-auto p-4 flex-col gap-2"
                onClick={() => router.push('/cycle')}
              >
                <Calendar className="h-6 w-6" />
                <span>Cycle History</span>
              </Button>
              
              <Button
                variant="secondary"
                className="h-auto p-4 flex-col gap-2"
                onClick={() => router.push('/intimacy')}
              >
                <Heart className="h-6 w-6" />
                <span>Intimacy Deck</span>
              </Button>
              
              <Button
                variant="secondary"
                className="h-auto p-4 flex-col gap-2"
                onClick={() => router.push('/fantasy')}
              >
                <Sparkles className="h-6 w-6" />
                <span>Fantasy Vault</span>
              </Button>
              
              <Button
                variant="secondary"
                className="h-auto p-4 flex-col gap-2"
                onClick={() => router.push('/coach')}
              >
                <MessageCircle className="h-6 w-6" />
                <span>AI Coach</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Log Cycle Modal */}
      {showLogForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {todaysData ? 'Update Today\'s Entry' : 'Log Cycle Entry'}
              </CardTitle>
              <CardDescription>
                Track your mood, energy, and symptoms for today
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mood Slider */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Mood: {mood}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={mood}
                  onChange={(e) => setMood(Number(e.target.value))}
                  className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {/* Energy Slider */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Energy: {energy}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={energy}
                  onChange={(e) => setEnergy(Number(e.target.value))}
                  className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {/* Libido Slider */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Libido: {libido}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={libido}
                  onChange={(e) => setLibido(Number(e.target.value))}
                  className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {/* Stress Slider */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Stress: {stress}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={stress}
                  onChange={(e) => setStress(Number(e.target.value))}
                  className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {/* Symptoms */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Symptoms
                </label>
                <div className="flex flex-wrap gap-2">
                  {symptomOptions.map((symptom) => (
                    <button
                      key={symptom}
                      type="button"
                      onClick={() => toggleSymptom(symptom)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        symptoms.includes(symptom)
                          ? 'bg-cta-start text-white'
                          : 'bg-bg-elevated text-foreground border border-border'
                      }`}
                    >
                      {symptom}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How are you feeling today?"
                  className="w-full p-3 border border-border rounded-lg bg-bg-surface text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cta-start"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowLogForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="cta"
                  onClick={handleLogCycle}
                  loading={logging}
                  className="flex-1"
                >
                  {logging ? 'Saving...' : (todaysData ? 'Update Entry' : 'Save Entry')}
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
