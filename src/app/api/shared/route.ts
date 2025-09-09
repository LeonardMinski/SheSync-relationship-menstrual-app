import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    const authenticatedRequest = await authenticateRequest(request)
    if (!authenticatedRequest?.user) {
      return createErrorResponse('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const dataType = searchParams.get('type') // 'cycle', 'intimacy', 'fantasy', 'mood'
    const partnerId = searchParams.get('partnerId')

    if (!dataType || !partnerId) {
      return createErrorResponse('Data type and partner ID are required', 400)
    }

    // Verify partnership
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('partner_id, privacy_settings')
      .eq('id', authenticatedRequest.user.id)
      .single()

    if (userError || userData.partner_id !== partnerId) {
      return createErrorResponse('Partnership not found', 403)
    }

    // Get partner's privacy settings
    const { data: partnerData, error: partnerError } = await supabase
      .from('users')
      .select('privacy_settings')
      .eq('id', partnerId)
      .single()

    if (partnerError) {
      return createErrorResponse('Partner not found', 404)
    }

    const partnerPrivacy = partnerData.privacy_settings
    let sharedData: any = null

    switch (dataType) {
      case 'cycle':
        if (!partnerPrivacy.share_cycle_phase) {
          return createErrorResponse('Partner has not shared cycle data', 403)
        }
        
        const { data: cycleData, error: cycleError } = await supabase
          .from('cycle_data')
          .select('date, phase, mood, energy, libido, stress, symptoms')
          .eq('user_id', partnerId)
          .order('date', { ascending: false })
          .limit(30)

        if (cycleError) {
          return createErrorResponse('Error fetching cycle data', 500)
        }
        sharedData = cycleData
        break

      case 'intimacy':
        if (!partnerPrivacy.share_intimacy_deck) {
          return createErrorResponse('Partner has not shared intimacy data', 403)
        }
        
        const { data: intimacyData, error: intimacyError } = await supabase
          .from('intimacy_cards')
          .select('question, description, tags, user_answer, partner_answer')
          .eq('user_id', partnerId)
          .eq('is_shared', true)
          .order('created_at', { ascending: false })

        if (intimacyError) {
          return createErrorResponse('Error fetching intimacy data', 500)
        }
        sharedData = intimacyData
        break

      case 'fantasy':
        if (!partnerPrivacy.share_fantasy_vault) {
          return createErrorResponse('Partner has not shared fantasy data', 403)
        }
        
        const { data: fantasyData, error: fantasyError } = await supabase
          .from('fantasy_entries')
          .select('title, content, type, tags, mood, phase')
          .eq('user_id', partnerId)
          .eq('is_shared_with_partner', true)
          .order('created_at', { ascending: false })

        if (fantasyError) {
          return createErrorResponse('Error fetching fantasy data', 500)
        }
        sharedData = fantasyData
        break

      case 'mood':
        if (!partnerPrivacy.share_mood) {
          return createErrorResponse('Partner has not shared mood data', 403)
        }
        
        const { data: moodData, error: moodError } = await supabase
          .from('cycle_data')
          .select('date, mood, energy, stress, notes')
          .eq('user_id', partnerId)
          .order('date', { ascending: false })
          .limit(7)

        if (moodError) {
          return createErrorResponse('Error fetching mood data', 500)
        }
        sharedData = moodData
        break

      default:
        return createErrorResponse('Invalid data type', 400)
    }

    return createSuccessResponse({ 
      data: sharedData,
      dataType,
      partnerId,
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    console.error('Get shared data error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const authenticatedRequest = await authenticateRequest(request)
    if (!authenticatedRequest?.user) {
      return createErrorResponse('Unauthorized', 401)
    }

    const { dataType, isShared } = await request.json()

    if (!dataType || typeof isShared !== 'boolean') {
      return createErrorResponse('Data type and share status are required', 400)
    }

    // Update user's privacy settings
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('privacy_settings')
      .eq('id', authenticatedRequest.user.id)
      .single()

    if (userError) {
      return createErrorResponse('User not found', 404)
    }

    const currentPrivacy = userData.privacy_settings
    let updatedPrivacy = { ...currentPrivacy }

    switch (dataType) {
      case 'cycle':
        updatedPrivacy.share_cycle_phase = isShared
        break
      case 'mood':
        updatedPrivacy.share_mood = isShared
        break
      case 'fantasy':
        updatedPrivacy.share_fantasy_vault = isShared
        break
      case 'intimacy':
        updatedPrivacy.share_intimacy_deck = isShared
        break
      default:
        return createErrorResponse('Invalid data type', 400)
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ privacy_settings: updatedPrivacy })
      .eq('id', authenticatedRequest.user.id)

    if (updateError) {
      return createErrorResponse('Error updating privacy settings', 500)
    }

    return createSuccessResponse(
      { privacySettings: updatedPrivacy },
      `Privacy settings updated for ${dataType}`
    )
  } catch (error) {
    console.error('Update privacy settings error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}
