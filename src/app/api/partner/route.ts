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
      // Get current user's partner info
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('partner_id')
        .eq('id', authenticatedRequest.user.id)
        .single()

      if (userError || !userData.partner_id) {
        return createSuccessResponse({ partner: null })
      }

      const { data: partnerData, error: partnerError } = await supabase
        .from('users')
        .select('id, name, email, subscription_tier, created_at')
        .eq('id', userData.partner_id)
        .single()

      if (partnerError) {
        return createErrorResponse('Partner not found', 404)
      }

      return createSuccessResponse({ partner: partnerData })
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

    // Check if already partnered
    const { data: existingPartnership, error: checkError } = await supabase
      .from('users')
      .select('partner_id')
      .or(`id.eq.${authenticatedRequest.user.id},id.eq.${partnerUser.id}`)

    if (checkError) {
      return createErrorResponse('Error checking partnership status', 500)
    }

    const currentUser = existingPartnership.find(u => u.id === authenticatedRequest.user.id)
    const partner = existingPartnership.find(u => u.id === partnerUser.id)

    if (currentUser?.partner_id || partner?.partner_id) {
      return createErrorResponse('One or both users are already partnered', 400)
    }

    // Create partnership (both users get each other's ID as partner_id)
    const { error: updateError } = await supabase
      .from('users')
      .update({ partner_id: partnerUser.id })
      .eq('id', authenticatedRequest.user.id)

    if (updateError) {
      return createErrorResponse('Error creating partnership', 500)
    }

    const { error: partnerUpdateError } = await supabase
      .from('users')
      .update({ partner_id: authenticatedRequest.user.id })
      .eq('id', partnerUser.id)

    if (partnerUpdateError) {
      // Rollback the first update
      await supabase
        .from('users')
        .update({ partner_id: null })
        .eq('id', authenticatedRequest.user.id)
      return createErrorResponse('Error creating partnership', 500)
    }

    return createSuccessResponse(
      { partner: partnerUser },
      'Partnership created successfully'
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

    // Get current user's partner ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('partner_id')
      .eq('id', authenticatedRequest.user.id)
      .single()

    if (userError || !userData.partner_id) {
      return createErrorResponse('No active partnership found', 404)
    }

    // Remove partnership from both users
    const { error: updateError } = await supabase
      .from('users')
      .update({ partner_id: null })
      .eq('id', authenticatedRequest.user.id)

    if (updateError) {
      return createErrorResponse('Error removing partnership', 500)
    }

    const { error: partnerUpdateError } = await supabase
      .from('users')
      .update({ partner_id: null })
      .eq('id', userData.partner_id)

    if (partnerUpdateError) {
      console.error('Error removing partner relationship:', partnerUpdateError)
    }

    return createSuccessResponse(null, 'Partnership removed successfully')
  } catch (error) {
    console.error('Remove partnership error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}
