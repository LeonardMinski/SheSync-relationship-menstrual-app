import { NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/api/authentication'
import { createErrorResponse, createSuccessResponse } from '@/lib/api/responses'

type PrivacySettingsRow = {
  share_with_partner?: boolean
  share_cycle_phase?: boolean
  share_mood?: boolean
  share_fantasy_vault?: boolean
  share_intimacy_deck?: boolean
}

type RecentActivity = {
  description: string
  date: string
  type: 'cycle'
}

function dataReadError(message: string, error: { message?: string; code?: string; details?: string; hint?: string }) {
  console.error(`[partner/shared-data] ${message}`, error)

  if (error.code === '42501') {
    return createErrorResponse('Partner data access denied by Supabase RLS policy', 403)
  }

  if (error.code === '42P01') {
    return createErrorResponse('A required partner sharing table is missing. Run the Supabase database migrations.', 500)
  }

  return createErrorResponse(
    process.env.NODE_ENV !== 'production'
      ? `${message}: ${error.message || 'Unknown database error'}`
      : 'Failed to load partner shared data',
    500
  )
}

export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request)
    if (!user || !supabase) {
      return createErrorResponse('Authentication required', 401)
    }

    const userId = user.id

    // Get partner link
    const { data: partnerLink, error: linkError } = await supabase
      .from('partner_links')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (linkError || !partnerLink) {
      if (linkError && linkError.code !== 'PGRST116') {
        return dataReadError('failed to fetch partner link', linkError)
      }
      return createSuccessResponse({ sharedData: null, partnerLink: null })
    }

    // Get partner's basic info and privacy settings
    const { data: partnerInfo, error: partnerError } = await supabase
      .from('users')
      .select('id, name, privacy_settings')
      .eq('id', partnerLink.partner_user_id)
      .single()

    if (partnerError || !partnerInfo) {
      if (partnerError && partnerError.code !== 'PGRST116') {
        return dataReadError('partner profile lookup failed', partnerError)
      }
      console.error('[partner/shared-data] partner profile not found')
      return createErrorResponse('Partner not found', 404)
    }

    const privacySettings = (partnerInfo.privacy_settings || {}) as PrivacySettingsRow
    const canShareWithPartner = privacySettings.share_with_partner === true
    const canShareCyclePhase = canShareWithPartner && privacySettings.share_cycle_phase === true
    const canShareMood = canShareWithPartner && privacySettings.share_mood === true

    const publicPrivacySettings = {
      shareWithPartner: canShareWithPartner,
      shareCyclePhase: canShareCyclePhase,
      shareMood: canShareMood,
      shareFantasyVault: false,
      shareIntimacyDeck: false
    }

    // If partner has disabled sharing, return empty data
    if (!canShareWithPartner) {
      return createSuccessResponse({
        sharedData: {
          partnerName: partnerInfo.name,
          privacySettings: publicPrivacySettings,
          recentActivity: []
        },
        partnerLink
      })
    }

    const today = new Date().toISOString().split('T')[0]
    const sharedData: {
      partnerName: string
      privacySettings: typeof publicPrivacySettings
      todayCycle?: {
        phase?: string
        mood?: number
        energy?: number
      }
      recentActivity: RecentActivity[]
    } = {
      partnerName: partnerInfo.name,
      privacySettings: publicPrivacySettings,
      recentActivity: []
    }

    // Get today's cycle data if sharing is enabled
    if (canShareCyclePhase || canShareMood) {
      const { data: cycleData, error: todayCycleError } = await supabase
        .from('cycle_data')
        .select('phase, mood, energy')
        .eq('user_id', partnerLink.partner_user_id)
        .eq('date', today)
        .single()

      if (todayCycleError && todayCycleError.code !== 'PGRST116') {
        return dataReadError('failed to fetch today cycle data', todayCycleError)
      }

      if (cycleData) {
        sharedData.todayCycle = {}

        if (canShareCyclePhase) {
          sharedData.todayCycle.phase = cycleData.phase
        }

        if (canShareMood) {
          sharedData.todayCycle.mood = cycleData.mood
          sharedData.todayCycle.energy = cycleData.energy
        }
      }
    }

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

    // Recent cycle entries
    if (canShareCyclePhase || canShareMood) {
      const { data: recentCycle, error: recentCycleError } = await supabase
        .from('cycle_data')
        .select('date, phase, mood')
        .eq('user_id', partnerLink.partner_user_id)
        .gte('date', sevenDaysAgoStr)
        .order('date', { ascending: false })
        .limit(3)

      if (recentCycleError) {
        return dataReadError('failed to fetch recent cycle data', recentCycleError)
      }

      if (recentCycle) {
        recentCycle.forEach(entry => {
          const description = canShareMood
            ? `Logged ${entry.phase} phase with mood ${entry.mood}/10`
            : `Logged ${entry.phase} phase`

          sharedData.recentActivity.push({
            description,
            date: entry.date,
            type: 'cycle'
          })
        })
      }
    }

    // Sort recent activity by date
    sharedData.recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return createSuccessResponse({ sharedData, partnerLink })

  } catch (error) {
    console.error('[partner/shared-data] unexpected GET error', error)
    return createErrorResponse('Internal server error', 500)
  }
}
