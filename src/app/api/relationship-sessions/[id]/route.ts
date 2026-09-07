import { NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/api/authentication'
import { createErrorResponse, createSuccessResponse } from '@/lib/api/responses'
import type { RelationshipSession, SessionAnswer } from '@/types/relationship'

type SessionRow = {
  id: string
  session_type: string
  category: string | null
  prompts: { key: string; text: string }[]
  initiator_id: string
  partner_id: string
  initiator_ready_at: string | null
  partner_ready_at: string | null
  revealed_at: string | null
  created_at: string
}

type AnswerRow = { answerer_id: string; prompt_key: string; answer_text: string }

function toSession(row: SessionRow, callerId: string): RelationshipSession {
  const isInitiator = row.initiator_id === callerId
  return {
    id: row.id,
    sessionType: row.session_type as RelationshipSession['sessionType'],
    category: row.category as RelationshipSession['category'],
    prompts: row.prompts,
    isInitiator,
    ownReadyAt: isInitiator ? row.initiator_ready_at : row.partner_ready_at,
    partnerReadyAt: isInitiator ? row.partner_ready_at : row.initiator_ready_at,
    revealedAt: row.revealed_at,
    createdAt: row.created_at,
  }
}

/**
 * Session metadata (via plain RLS-protected select — visible to both
 * participants while the relationship is active) plus answers via
 * get_session_answers(), which returns only the caller's own answers
 * unless the session is revealed AND the relationship is still active —
 * see the migration for the full invariant.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, supabase } = await authenticateRequest(request)
    if (!user || !supabase) {
      return createErrorResponse('Authentication required', 401)
    }

    const { id } = await params

    const { data: sessionRow, error: sessionError } = await supabase
      .from('relationship_sessions')
      .select('*')
      .eq('id', id)
      .single()

    if (sessionError || !sessionRow) {
      return createErrorResponse('Session not found', 404)
    }

    const { data: answerRows, error: answersError } = await supabase.rpc('get_session_answers', {
      p_session_id: id,
    })

    if (answersError) {
      console.error('[relationship-sessions/:id] failed to fetch answers', answersError)
      const isForbidden = answersError.message.includes('not a participant')
      return createErrorResponse(
        isForbidden ? answersError.message : 'Failed to load session answers',
        isForbidden ? 403 : 500,
      )
    }

    const answers: SessionAnswer[] = ((answerRows ?? []) as AnswerRow[]).map((row) => ({
      answererId: row.answerer_id,
      promptKey: row.prompt_key,
      answerText: row.answer_text,
    }))

    return createSuccessResponse({
      session: toSession(sessionRow as SessionRow, user.id),
      answers,
    })
  } catch (error) {
    console.error('[relationship-sessions/:id] unexpected GET error', error)
    return createErrorResponse('Internal server error', 500)
  }
}
