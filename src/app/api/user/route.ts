import { NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/api/authentication'
import { createErrorResponse, createSuccessResponse } from '@/lib/api/responses'
import { validateEmail } from '@/utils/validation'

export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request)
    if (!user || !supabase) {
      return createErrorResponse('Authentication required', 401)
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('[user] failed to fetch profile', error)
      return createErrorResponse('User profile not found', 404)
    }

    return createSuccessResponse(data)
  } catch (error) {
    console.error('[user] unexpected GET error', error)
    return createErrorResponse('Internal server error', 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request)
    if (!user || !supabase) {
      return createErrorResponse('Authentication required', 401)
    }

    const updateData = await request.json()

    // Validate email if provided
    if (updateData.email && !validateEmail(updateData.email)) {
      return createErrorResponse('Invalid email format', 400)
    }

    // Prepare update object with only allowed fields
    const allowedUpdates: {
      name?: string
      email?: string
      subscription_tier?: 'free' | 'premium' | 'vip' | 'lifetime'
      privacy_settings?: {
        share_with_partner: boolean
        share_cycle_phase: boolean
        share_mood: boolean
        share_fantasy_vault: boolean
        share_intimacy_deck: boolean
      }
      onboarding_completed_at?: string
    } = {}
    
    if (updateData.name !== undefined) {
      if (typeof updateData.name !== 'string') {
        return createErrorResponse('Invalid name', 400)
      }
      allowedUpdates.name = updateData.name.trim()
    }
    
    if (updateData.email !== undefined) {
      if (typeof updateData.email !== 'string') {
        return createErrorResponse('Invalid email', 400)
      }
      allowedUpdates.email = updateData.email.toLowerCase().trim()
    }
    
    if (updateData.subscriptionTier !== undefined) {
      if (!['free', 'premium', 'vip', 'lifetime'].includes(updateData.subscriptionTier)) {
        return createErrorResponse('Invalid subscription tier', 400)
      }
      allowedUpdates.subscription_tier = updateData.subscriptionTier
    }
    
    if (updateData.privacySettings !== undefined) {
      const privacy = updateData.privacySettings
      if (!privacy || typeof privacy !== 'object') {
        return createErrorResponse('Invalid privacy settings', 400)
      }
      allowedUpdates.privacy_settings = {
        share_with_partner: !!privacy.shareWithPartner,
        share_cycle_phase: !!privacy.shareCyclePhase,
        share_mood: !!privacy.shareMood,
        share_fantasy_vault: !!privacy.shareFantasyVault,
        share_intimacy_deck: !!privacy.shareIntimacyDeck,
      }
    }

    // Write-only completion flag: the client can only ever mark onboarding
    // complete (server sets the timestamp), never unset it or backdate it.
    if (updateData.completeOnboarding !== undefined) {
      if (updateData.completeOnboarding !== true) {
        return createErrorResponse('Invalid completeOnboarding value', 400)
      }
      allowedUpdates.onboarding_completed_at = new Date().toISOString()
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return createErrorResponse('No valid fields to update', 400)
    }

    const { data, error } = await supabase
      .from('users')
      .update(allowedUpdates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('[user] failed to update profile', error)
      return createErrorResponse(error.message, 400)
    }

    return createSuccessResponse(data, 'Profile updated successfully')
  } catch (error) {
    console.error('[user] unexpected PUT error', error)
    return createErrorResponse('Internal server error', 500)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request)
    if (!user || !supabase) {
      return createErrorResponse('Authentication required', 401)
    }

    // Get user's partner ID before deletion
    const { data: userData } = await supabase
      .from('users')
      .select('partner_id')
      .eq('id', user.id)
      .single()

    // Remove partnership if exists
    if (userData?.partner_id) {
      await supabase
        .from('users')
        .update({ partner_id: null })
        .eq('id', userData.partner_id)
    }

    // Delete all user data
    await supabase
      .from('cycle_data')
      .delete()
      .eq('user_id', user.id)

    await supabase
      .from('intimacy_cards')
      .delete()
      .eq('user_id', user.id)

    await supabase
      .from('fantasy_entries')
      .delete()
      .eq('user_id', user.id)

    await supabase
      .from('ai_coach_messages')
      .delete()
      .eq('user_id', user.id)

    // Delete user profile
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', user.id)

    if (error) {
      console.error('[user] failed to delete profile', error)
      return createErrorResponse('Error deleting user profile', 500)
    }

    // Auth-user deletion requires a service role client and is intentionally outside the MVP route.
    console.warn('[user] account deletion skipped auth admin delete; service role is not available in MVP route')

    return createSuccessResponse(null, 'Account deleted successfully')
  } catch (error) {
    console.error('[user] unexpected DELETE error', error)
    return createErrorResponse('Internal server error', 500)
  }
}
