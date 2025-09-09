import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    const authenticatedRequest = await authenticateRequest(request)
    if (!authenticatedRequest?.user) {
      return createErrorResponse('Unauthorized', 401)
    }

    const userId = authenticatedRequest.user.id

    // Get partner link
    const { data: partnerLink, error: linkError } = await supabase
      .from('partner_links')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (linkError || !partnerLink) {
      return createSuccessResponse({ sharedData: null, partnerLink: null })
    }

    // Get partner's basic info and privacy settings
    const { data: partnerInfo, error: partnerError } = await supabase
      .from('users')
      .select('id, name, privacy_settings')
      .eq('id', partnerLink.partner_user_id)
      .single()

    if (partnerError || !partnerInfo) {
      return createErrorResponse('Partner not found', 404)
    }

    const privacySettings = partnerInfo.privacy_settings as {
      share_with_partner: boolean
      share_cycle_phase: boolean
      share_mood: boolean
      share_fantasy_vault: boolean
      share_intimacy_deck: boolean
    }

    // If partner has disabled sharing, return empty data
    if (!privacySettings.share_with_partner) {
      return createSuccessResponse({
        sharedData: {
          partnerName: partnerInfo.name,
          privacySettings: {
            shareWithPartner: false,
            shareCyclePhase: false,
            shareMood: false,
            shareFantasyVault: false,
            shareIntimacyDeck: false
          },
          recentActivity: []
        },
        partnerLink
      })
    }

    const today = new Date().toISOString().split('T')[0]
    const sharedData = {
      partnerName: partnerInfo.name,
      privacySettings: {
        shareWithPartner: privacySettings.share_with_partner,
        shareCyclePhase: privacySettings.share_cycle_phase,
        shareMood: privacySettings.share_mood,
        shareFantasyVault: privacySettings.share_fantasy_vault,
        shareIntimacyDeck: privacySettings.share_intimacy_deck
      },
      recentActivity: []
    }

    // Get today's cycle data if sharing is enabled
    if (privacySettings.share_cycle_phase || privacySettings.share_mood) {
      const { data: cycleData } = await supabase
        .from('cycle_data')
        .select('phase, mood, energy, libido, stress, symptoms, notes')
        .eq('user_id', partnerLink.partner_user_id)
        .eq('date', today)
        .single()

      if (cycleData) {
        sharedData.todayCycle = {
          phase: cycleData.phase,
          mood: cycleData.mood,
          energy: cycleData.energy,
          libido: cycleData.libido,
          stress: cycleData.stress,
          symptoms: cycleData.symptoms,
          notes: cycleData.notes
        }
      }
    }

    // Get today's intimacy session if sharing is enabled
    if (privacySettings.share_intimacy_deck) {
      const { data: intimacySession } = await supabase
        .from('intimacy_sessions')
        .select(`
          id,
          date,
          shared_with_partner,
          reflection,
          selected_card:selected_card_id (
            id,
            category,
            difficulty,
            text,
            phase_tags
          )
        `)
        .eq('user_id', partnerLink.partner_user_id)
        .eq('date', today)
        .eq('shared_with_partner', true)
        .single()

      if (intimacySession) {
        sharedData.todayIntimacy = intimacySession
      }
    }

    // Get today's fantasy entry if sharing is enabled
    if (privacySettings.share_fantasy_vault) {
      const { data: fantasyEntry } = await supabase
        .from('fantasy_entries')
        .select('id, title, content, type, tags, created_at')
        .eq('user_id', partnerLink.partner_user_id)
        .eq('is_shared_with_partner', true)
        .gte('created_at', today)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (fantasyEntry) {
        sharedData.todayFantasy = {
          id: fantasyEntry.id,
          title: fantasyEntry.title,
          content: fantasyEntry.content,
          type: fantasyEntry.type,
          tags: fantasyEntry.tags,
          createdAt: fantasyEntry.created_at
        }
      }
    }

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

    // Recent cycle entries
    if (privacySettings.share_cycle_phase || privacySettings.share_mood) {
      const { data: recentCycle } = await supabase
        .from('cycle_data')
        .select('date, phase, mood')
        .eq('user_id', partnerLink.partner_user_id)
        .gte('date', sevenDaysAgoStr)
        .order('date', { ascending: false })
        .limit(3)

      if (recentCycle) {
        recentCycle.forEach(entry => {
          sharedData.recentActivity.push({
            description: `Logged ${entry.phase} phase with mood ${entry.mood}/10`,
            date: entry.date,
            type: 'cycle'
          })
        })
      }
    }

    // Recent intimacy sessions
    if (privacySettings.share_intimacy_deck) {
      const { data: recentIntimacy } = await supabase
        .from('intimacy_sessions')
        .select('date, selected_card:selected_card_id (category)')
        .eq('user_id', partnerLink.partner_user_id)
        .eq('shared_with_partner', true)
        .gte('date', sevenDaysAgoStr)
        .order('date', { ascending: false })
        .limit(3)

      if (recentIntimacy) {
        recentIntimacy.forEach(session => {
          sharedData.recentActivity.push({
            description: `Completed ${session.selected_card?.category} connection card`,
            date: session.date,
            type: 'intimacy'
          })
        })
      }
    }

    // Recent fantasy entries
    if (privacySettings.share_fantasy_vault) {
      const { data: recentFantasy } = await supabase
        .from('fantasy_entries')
        .select('title, created_at')
        .eq('user_id', partnerLink.partner_user_id)
        .eq('is_shared_with_partner', true)
        .gte('created_at', sevenDaysAgoStr)
        .order('created_at', { ascending: false })
        .limit(3)

      if (recentFantasy) {
        recentFantasy.forEach(entry => {
          sharedData.recentActivity.push({
            description: `Shared fantasy: ${entry.title}`,
            date: entry.created_at.split('T')[0],
            type: 'fantasy'
          })
        })
      }
    }

    // Sort recent activity by date
    sharedData.recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return createSuccessResponse({ sharedData, partnerLink })

  } catch (error) {
    console.error('Get partner shared data error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}
