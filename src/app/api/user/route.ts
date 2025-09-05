import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { authenticateRequest, createErrorResponse, createSuccessResponse, validateEmail } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    const authenticatedRequest = await authenticateRequest(request)
    if (!authenticatedRequest?.user) {
      return createErrorResponse('Unauthorized', 401)
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authenticatedRequest.user.id)
      .single()

    if (error) {
      return createErrorResponse('User profile not found', 404)
    }

    return createSuccessResponse(data)
  } catch (error) {
    console.error('Get user profile error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authenticatedRequest = await authenticateRequest(request)
    if (!authenticatedRequest?.user) {
      return createErrorResponse('Unauthorized', 401)
    }

    const updateData = await request.json()

    // Validate email if provided
    if (updateData.email && !validateEmail(updateData.email)) {
      return createErrorResponse('Invalid email format', 400)
    }

    // Prepare update object with only allowed fields
    const allowedUpdates: any = {}
    
    if (updateData.name !== undefined) {
      allowedUpdates.name = updateData.name.trim()
    }
    
    if (updateData.email !== undefined) {
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
      allowedUpdates.privacy_settings = {
        share_with_partner: !!privacy.shareWithPartner,
        share_cycle_phase: !!privacy.shareCyclePhase,
        share_mood: !!privacy.shareMood,
        share_fantasy_vault: !!privacy.shareFantasyVault,
        share_intimacy_deck: !!privacy.shareIntimacyDeck,
      }
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return createErrorResponse('No valid fields to update', 400)
    }

    const { data, error } = await supabase
      .from('users')
      .update(allowedUpdates)
      .eq('id', authenticatedRequest.user.id)
      .select()
      .single()

    if (error) {
      return createErrorResponse(error.message, 400)
    }

    return createSuccessResponse(data, 'Profile updated successfully')
  } catch (error) {
    console.error('Update user profile error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authenticatedRequest = await authenticateRequest(request)
    if (!authenticatedRequest?.user) {
      return createErrorResponse('Unauthorized', 401)
    }

    // Get user's partner ID before deletion
    const { data: userData } = await supabase
      .from('users')
      .select('partner_id')
      .eq('id', authenticatedRequest.user.id)
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
      .eq('user_id', authenticatedRequest.user.id)

    await supabase
      .from('intimacy_cards')
      .delete()
      .eq('user_id', authenticatedRequest.user.id)

    await supabase
      .from('fantasy_entries')
      .delete()
      .eq('user_id', authenticatedRequest.user.id)

    await supabase
      .from('ai_coach_messages')
      .delete()
      .eq('user_id', authenticatedRequest.user.id)

    // Delete user profile
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', authenticatedRequest.user.id)

    if (error) {
      return createErrorResponse('Error deleting user profile', 500)
    }

    // Delete Supabase auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(
      authenticatedRequest.user.id
    )

    if (authError) {
      console.error('Error deleting auth user:', authError)
    }

    return createSuccessResponse(null, 'Account deleted successfully')
  } catch (error) {
    console.error('Delete user error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}
