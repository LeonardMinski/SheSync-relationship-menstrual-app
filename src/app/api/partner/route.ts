import { NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/api/authentication'
import { createErrorResponse, createSuccessResponse } from '@/lib/api/responses'
import type { PartnerLinkWithPerson } from '@/types/partner'

type PartnerLinkRow = {
  id: string
  owner_user_id: string
  viewer_user_id: string
  status: string
  created_at: string
  owner_name: string | null
  owner_email: string | null
  viewer_email: string | null
}

type CreateInviteRow = {
  id: string
  status: string
  viewer_email: string | null
  created_at: string
}

function toOwnerLink(row: PartnerLinkRow): PartnerLinkWithPerson {
  return {
    id: row.id,
    owner_user_id: row.owner_user_id,
    viewer_user_id: row.viewer_user_id,
    status: row.status as PartnerLinkWithPerson['status'],
    created_at: row.created_at,
    personName: row.viewer_email || 'Invited partner',
    personEmail: row.viewer_email || '',
  }
}

function toViewerLink(row: PartnerLinkRow): PartnerLinkWithPerson {
  return {
    id: row.id,
    owner_user_id: row.owner_user_id,
    viewer_user_id: row.viewer_user_id,
    status: row.status as PartnerLinkWithPerson['status'],
    created_at: row.created_at,
    personName: row.owner_name || 'SheSync+ user',
    personEmail: row.owner_email || '',
  }
}

/**
 * Maps a RAISE EXCEPTION message from one of the partner_links SECURITY
 * DEFINER functions to a client-facing status code. These functions never
 * return the other party's resolved user id, so no branch here can either.
 */
function statusForRpcError(message: string): number {
  if (message.includes('not authenticated')) return 401
  if (message.includes('no account found')) return 404
  if (message.includes('cannot invite yourself')) return 400
  if (message.includes('email address is required')) return 400
  if (message.includes('already exists') || message.includes('already have an active')) return 400
  if (message.includes('not eligible') || message.includes('not found')) return 404
  return 500
}

export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request)
    if (!user || !supabase) {
      return createErrorResponse('Authentication required', 401)
    }

    const [{ data: ownerRows, error: ownerError }, { data: viewerRows, error: viewerError }] =
      await Promise.all([
        supabase
          .from('partner_links')
          .select('*')
          .eq('owner_user_id', user.id)
          .in('status', ['pending', 'active'])
          .order('created_at', { ascending: false })
          .limit(1),
        supabase
          .from('partner_links')
          .select('*')
          .eq('viewer_user_id', user.id)
          .in('status', ['pending', 'active'])
          .order('created_at', { ascending: false })
          .limit(1),
      ])

    if (ownerError || viewerError) {
      return createErrorResponse('Failed to load partner status', 500)
    }

    const ownerRow = ownerRows?.[0] as PartnerLinkRow | undefined
    const viewerRow = viewerRows?.[0] as PartnerLinkRow | undefined

    return createSuccessResponse({
      ownerLink: ownerRow ? toOwnerLink(ownerRow) : null,
      viewerLink: viewerRow ? toViewerLink(viewerRow) : null,
    })
  } catch (error) {
    console.error('Get partner status error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request)
    if (!user || !supabase) {
      return createErrorResponse('Authentication required', 401)
    }

    const body = await request.json().catch(() => ({}))
    const viewerEmail = typeof body.viewerEmail === 'string' ? body.viewerEmail.trim() : ''

    if (!viewerEmail) {
      return createErrorResponse('An email address is required', 400)
    }

    // create_partner_invite() does the email lookup and the insert
    // atomically, inside the database, and never returns the matched
    // account's id — see the migration for the enumeration-exposure
    // rationale.
    const { data, error } = await supabase.rpc('create_partner_invite', {
      p_owner_name: user.name,
      p_owner_email: user.email,
      p_viewer_email: viewerEmail,
    })

    if (error) {
      return createErrorResponse(error.message, statusForRpcError(error.message))
    }

    const created = (Array.isArray(data) ? data[0] : data) as CreateInviteRow | undefined

    if (!created) {
      return createErrorResponse('Failed to send invitation', 500)
    }

    return createSuccessResponse(
      {
        ownerLink: {
          id: created.id,
          status: created.status,
          personName: created.viewer_email || 'Invited partner',
          personEmail: created.viewer_email || '',
          created_at: created.created_at,
        },
      },
      'Invitation sent',
    )
  } catch (error) {
    console.error('Create partner invitation error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request)
    if (!user || !supabase) {
      return createErrorResponse('Authentication required', 401)
    }

    const body = await request.json().catch(() => ({}))
    const linkId = typeof body.linkId === 'string' ? body.linkId : ''
    const action = body.action === 'accept' || body.action === 'decline' ? body.action : null

    if (!linkId || !action) {
      return createErrorResponse('linkId and a valid action are required', 400)
    }

    const { data: updated, error } = await supabase.rpc(
      action === 'accept' ? 'accept_partner_invite' : 'decline_partner_invite',
      { p_link_id: linkId },
    )

    if (error || !updated) {
      const message = error?.message || 'Invitation is no longer available to respond to'
      return createErrorResponse(message, error ? statusForRpcError(message) : 404)
    }

    return createSuccessResponse(
      { viewerLink: toViewerLink(updated as PartnerLinkRow) },
      action === 'accept' ? 'Invitation accepted' : 'Invitation declined',
    )
  } catch (error) {
    console.error('Respond to partner invitation error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request)
    if (!user || !supabase) {
      return createErrorResponse('Authentication required', 401)
    }

    const { data: ownerLinks } = await supabase
      .from('partner_links')
      .select('id')
      .eq('owner_user_id', user.id)
      .in('status', ['pending', 'active'])
      .order('created_at', { ascending: false })
      .limit(1)

    const link = ownerLinks?.[0]

    if (!link) {
      return createErrorResponse('No active connection found', 404)
    }

    const { data: updated, error } = await supabase.rpc('revoke_partner_link', {
      p_link_id: link.id,
    })

    if (error || !updated) {
      const message = error?.message || 'Failed to revoke connection'
      return createErrorResponse(message, error ? statusForRpcError(message) : 500)
    }

    return createSuccessResponse(null, 'Connection revoked')
  } catch (error) {
    console.error('Revoke partner connection error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}
