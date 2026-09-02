import { NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/api/authentication'
import { createErrorResponse, createSuccessResponse } from '@/lib/api/responses'
import { buildPartnerSharedDataDto, type RawPartnerSharedDataRow } from '@/services/partner/shared-data.utils'
import type { PartnerLink } from '@/types/partner'

function dataReadError(message: string, error: { message?: string; code?: string }) {
  console.error(`[partner/shared-data] ${message}`, error)

  if (error.code === '42501') {
    return createErrorResponse('Partner data access denied by Supabase RLS policy', 403)
  }

  if (error.code === '42P01' || error.code === '42883') {
    return createErrorResponse('Partner sharing is not fully set up yet. Run the partner-owner-viewer-migration.sql migration.', 500)
  }

  return createErrorResponse(
    process.env.NODE_ENV !== 'production'
      ? `${message}: ${error.message || 'Unknown database error'}`
      : 'Failed to load partner shared data',
    500,
  )
}

export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request)
    if (!user || !supabase) {
      return createErrorResponse('Authentication required', 401)
    }

    // Confirmed via RLS: a viewer may only ever see their OWN partner_links
    // rows, whichever side they're on. This just fetches the link metadata
    // for the UI (id/status/created_at) — it never reads the owner's
    // users/cycle_data rows directly.
    const { data: link, error: linkError } = await supabase
      .from('partner_links')
      .select('*')
      .eq('viewer_user_id', user.id)
      .eq('status', 'active')
      .single()

    if (linkError || !link) {
      if (linkError && linkError.code !== 'PGRST116') {
        return dataReadError('failed to fetch partner link', linkError)
      }
      return createSuccessResponse({ sharedData: null, partnerLink: null })
    }

    // The only path that ever reads a value derived from the owner's
    // users/cycle_data rows. This is a SECURITY DEFINER function that
    // re-verifies the active connection and the owner's real privacy
    // settings itself — it does not trust anything from this route.
    const { data: rows, error: rpcError } = await supabase.rpc('get_partner_shared_data')

    if (rpcError) {
      return dataReadError('failed to load shared data', rpcError)
    }

    const row = (Array.isArray(rows) ? rows[0] : rows) as RawPartnerSharedDataRow | undefined

    if (!row) {
      return createSuccessResponse({ sharedData: null, partnerLink: null })
    }

    const sharedData = buildPartnerSharedDataDto(row)
    const partnerLink: PartnerLink = {
      id: link.id,
      owner_user_id: link.owner_user_id,
      viewer_user_id: link.viewer_user_id,
      status: link.status,
      created_at: link.created_at,
    }

    return createSuccessResponse({ sharedData, partnerLink })
  } catch (error) {
    console.error('[partner/shared-data] unexpected GET error', error)
    return createErrorResponse('Internal server error', 500)
  }
}
