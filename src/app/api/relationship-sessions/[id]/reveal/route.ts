import { NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/api/authentication'
import { createErrorResponse, createSuccessResponse } from '@/lib/api/responses'

function statusForSessionRpcError(message: string): number {
  if (message.includes('not authenticated')) return 401
  if (message.includes('not a participant')) return 403
  if (message.includes('not found')) return 404
  if (message.includes('must be ready')) return 409
  if (message.includes('no longer active')) return 403
  return 500
}

/**
 * The only endpoint that can reveal a session — requires both participants
 * ready, checked server-side by reveal_session_together(). This is a
 * distinct, explicit user action (the "Reveal Together" button), never a
 * side effect of the second participant answering or marking ready.
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

    const { error } = await supabase.rpc('reveal_session_together', { p_session_id: id })

    if (error) {
      console.error('[relationship-sessions/:id/reveal] failed', error)
      const status = statusForSessionRpcError(error.message)
      return createErrorResponse(status === 500 ? 'Failed to reveal session' : error.message, status)
    }

    return createSuccessResponse(null, 'Revealed')
  } catch (error) {
    console.error('[relationship-sessions/:id/reveal] unexpected POST error', error)
    return createErrorResponse('Internal server error', 500)
  }
}
