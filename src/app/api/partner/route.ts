import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    const authenticatedRequest = await authenticateRequest(request)
    if (!authenticatedRequest?.user) {
      return createErrorResponse('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const partnerId = searchParams.get('partnerId')

    if (partnerId) {
      // Get specific partner details
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, subscription_tier, created_at')
        .eq('id', partnerId)
        .single()

      if (error) {
        return createErrorResponse('Partner not found', 404)
      }

      return createSuccessResponse(data)
    } else {
      // Get current user's partner info from partner_links
      const { data: partnerLink, error: linkError } = await supabase
        .from('partner_links')
        .select('*')
        .eq('user_id', authenticatedRequest.user.id)
        .eq('status', 'active')
        .single()

      if (linkError || !partnerLink) {
        return createSuccessResponse({ partner: null })
      }

      const { data: partnerData, error: partnerError } = await supabase
        .from('users')
        .select('id, name, email, subscription_tier, created_at')
        .eq('id', partnerLink.partner_user_id)
        .single()

      if (partnerError) {
        return createErrorResponse('Partner not found', 404)
      }

      return createSuccessResponse({ partner: partnerData, link: partnerLink })
    }
  } catch (error) {
    console.error('Get partner error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const authenticatedRequest = await authenticateRequest(request)
    if (!authenticatedRequest?.user) {
      return createErrorResponse('Unauthorized', 401)
    }

    const { partnerEmail, message } = await request.json()

    if (!partnerEmail) {
      return createErrorResponse('Partner email is required', 400)
    }

    // Check if partner email exists
    const { data: partnerUser, error: partnerError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', partnerEmail)
      .single()

    if (partnerError || !partnerUser) {
      return createErrorResponse('Partner not found with this email', 404)
    }

    if (partnerUser.id === authenticatedRequest.user.id) {
      return createErrorResponse('Cannot invite yourself', 400)
    }

    // Check if partnership already exists
    const { data: existingLink } = await supabase
      .from('partner_links')
      .select('*')
      .or(`user_id.eq.${authenticatedRequest.user.id},partner_user_id.eq.${authenticatedRequest.user.id}`)
      .or(`user_id.eq.${partnerUser.id},partner_user_id.eq.${partnerUser.id}`)

    if (existingLink && existingLink.length > 0) {
      return createErrorResponse('Partnership already exists', 400)
    }

    // Create partner link
    const { data: partnerLink, error: linkError } = await supabase
      .from('partner_links')
      .insert({
        user_id: authenticatedRequest.user.id,
        partner_user_id: partnerUser.id,
        status: 'pending'
      })
      .select()
      .single()

    if (linkError) {
      return createErrorResponse('Failed to create partner link', 500)
    }

    return createSuccessResponse(
      { partner: partnerUser, link: partnerLink },
      'Partner invitation sent successfully'
    )
  } catch (error) {
    console.error('Create partnership error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authenticatedRequest = await authenticateRequest(request)
    if (!authenticatedRequest?.user) {
      return createErrorResponse('Unauthorized', 401)
    }

    // Get current user's partner link
    const { data: partnerLink, error: linkError } = await supabase
      .from('partner_links')
      .select('*')
      .eq('user_id', authenticatedRequest.user.id)
      .eq('status', 'active')
      .single()

    if (linkError || !partnerLink) {
      return createErrorResponse('No active partnership found', 404)
    }

    // Deactivate partner link
    const { error: updateError } = await supabase
      .from('partner_links')
      .update({ status: 'inactive' })
      .eq('id', partnerLink.id)

    if (updateError) {
      return createErrorResponse('Error removing partnership', 500)
    }

    return createSuccessResponse(null, 'Partnership removed successfully')
  } catch (error) {
    console.error('Remove partnership error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}
