import { supabase } from '@/lib/supabaseClient'
import type { PartnerSharedData, PartnerLink, PartnerDataResponse } from './types'

/**
 * Get partner shared data based on privacy settings and RLS
 */
export async function getPartnerSharedData(userId: string): Promise<PartnerDataResponse> {
  try {
    const response = await fetch('/api/partner/shared-data', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch partner data')
    }

    const data = await response.json()
    return data.data

  } catch (error) {
    console.error('Error fetching partner shared data:', error)
    return { sharedData: null, partnerLink: null }
  }
}

/**
 * Create a partner link (invite partner)
 */
export async function createPartnerLink(userId: string, partnerEmail: string): Promise<PartnerLink | null> {
  try {
    // First, find the partner user by email
    const { data: partnerUser, error: partnerError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', partnerEmail)
      .single()

    if (partnerError || !partnerUser) {
      throw new Error('Partner not found with this email')
    }

    if (partnerUser.id === userId) {
      throw new Error('Cannot invite yourself')
    }

    // Check if partnership already exists
    const { data: existingLink } = await supabase
      .from('partner_links')
      .select('*')
      .or(`user_id.eq.${userId},partner_user_id.eq.${userId}`)
      .or(`user_id.eq.${partnerUser.id},partner_user_id.eq.${partnerUser.id}`)

    if (existingLink && existingLink.length > 0) {
      throw new Error('Partnership already exists')
    }

    // Create partner link
    const { data: partnerLink, error: linkError } = await supabase
      .from('partner_links')
      .insert({
        user_id: userId,
        partner_user_id: partnerUser.id,
        status: 'pending'
      })
      .select()
      .single()

    if (linkError) {
      throw new Error('Failed to create partner link')
    }

    return partnerLink

  } catch (error) {
    console.error('Error creating partner link:', error)
    return null
  }
}

/**
 * Accept a partner link
 */
export async function acceptPartnerLink(linkId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('partner_links')
      .update({ status: 'active' })
      .eq('id', linkId)

    if (error) {
      throw new Error('Failed to accept partner link')
    }

    return true

  } catch (error) {
    console.error('Error accepting partner link:', error)
    return false
  }
}

/**
 * Remove a partner link
 */
export async function removePartnerLink(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('partner_links')
      .update({ status: 'inactive' })
      .or(`user_id.eq.${userId},partner_user_id.eq.${userId}`)

    if (error) {
      throw new Error('Failed to remove partner link')
    }

    return true

  } catch (error) {
    console.error('Error removing partner link:', error)
    return false
  }
}
