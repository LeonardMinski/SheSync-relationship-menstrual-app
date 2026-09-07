import { NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/api/authentication'
import { createErrorResponse, createSuccessResponse } from '@/lib/api/responses'
import { SubmitSessionAnswerInputSchema } from '@/schemas/relationship'

function statusForSessionRpcError(message: string): number {
  if (message.includes('not authenticated')) return 401
  if (message.includes('not a participant')) return 403
  if (message.includes('not found')) return 404
  if (message.includes('already been revealed')) return 409
  return 500
}

/** Upserts the caller's own answer to one prompt in this session. Owner-only by construction — see submit_session_answer(). */
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
    const body = await request.json().catch(() => ({}))
    const parsed = SubmitSessionAnswerInputSchema.safeParse(body)
    if (!parsed.success) {
      return createErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
    }

    const { error } = await supabase.rpc('submit_session_answer', {
      p_session_id: id,
      p_prompt_key: parsed.data.promptKey,
      p_answer_text: parsed.data.answerText,
    })

    if (error) {
      console.error('[relationship-sessions/:id/answers] failed to submit', error)
      return createErrorResponse(error.message, statusForSessionRpcError(error.message))
    }

    return createSuccessResponse(null, 'Answer saved')
  } catch (error) {
    console.error('[relationship-sessions/:id/answers] unexpected POST error', error)
    return createErrorResponse('Internal server error', 500)
  }
}
