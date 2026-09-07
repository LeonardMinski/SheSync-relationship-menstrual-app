import { NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/api/authentication'
import { createErrorResponse, createSuccessResponse } from '@/lib/api/responses'

function statusForSessionRpcError(message: string): number {
  if (message.includes('not authenticated')) return 401
  if (message.includes('not a participant')) return 403
  if (message.includes('not found')) return 404
  if (message.includes('answer at least one prompt')) return 400
  return 500
}

/**
 * Marks the caller ready. Never reveals anything — mark_session_ready()
 * only ever writes the caller's own ready flag, even if this call is what
 * makes both participants ready. See reveal/route.ts for the explicit,
 * separate reveal action.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, supabase } = await authenticateRequest(request)
    if (!user || !supabase) {
      return createErrorResponse('Authentication required', 401)
    }

    const { id } = await params

    const { error } = await supabase.rpc('mark_session_ready', { p_session_id: id })

    if (error) {
      console.error('[relationship-sessions/:id/ready] failed', error)
      const status = statusForSessionRpcError(error.message)
      return createErrorResponse(status === 500 ? 'Failed to mark ready' : error.message, status)
    }

    return createSuccessResponse(null, 'Marked ready')
  } catch (error) {
    console.error('[relationship-sessions/:id/ready] unexpected POST error', error)
    return createErrorResponse('Internal server error', 500)
  }
}
