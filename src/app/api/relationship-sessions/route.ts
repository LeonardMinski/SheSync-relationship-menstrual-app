import { NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/api/authentication'
import { createErrorResponse, createSuccessResponse } from '@/lib/api/responses'
import { getMutualRevealPrompt, REPAIR_PROMPTS, WEEKLY_US_PROMPTS } from '@/features/relationship/prompts'
import { StartSessionInputSchema } from '@/schemas/relationship'
import type { RelationshipSession } from '@/types/relationship'

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

/** Lists the caller's sessions, most recent first — optionally filtered by ?type=. */
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request)
    if (!user || !supabase) {
      return createErrorResponse('Authentication required', 401)
    }

    const sessionType = request.nextUrl.searchParams.get('type')

    let query = supabase
      .from('relationship_sessions')
      .select('*')
      .or(`initiator_id.eq.${user.id},partner_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (sessionType) {
      query = query.eq('session_type', sessionType)
    }

    const { data, error } = await query

    if (error) {
      console.error('[relationship-sessions] failed to list', error)
      return createErrorResponse('Failed to load sessions', 500)
    }

    return createSuccessResponse({
      sessions: ((data ?? []) as SessionRow[]).map((row) => toSession(row, user.id)),
    })
  } catch (error) {
    console.error('[relationship-sessions] unexpected GET error', error)
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
    const parsed = StartSessionInputSchema.safeParse(body)
    if (!parsed.success) {
      return createErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
    }

    const prompts =
      parsed.data.sessionType === 'weekly_us'
        ? WEEKLY_US_PROMPTS
        : parsed.data.sessionType === 'repair'
          ? REPAIR_PROMPTS
          : [getMutualRevealPrompt(parsed.data.category!)]

    const { data: sessionId, error } = await supabase.rpc('start_relationship_session', {
      p_session_type: parsed.data.sessionType,
      p_category: parsed.data.category ?? null,
      p_prompts: prompts,
    })

    if (error) {
      const status = error.message.includes('not authenticated')
        ? 401
        : error.message.includes('no active partner')
          ? 404
          : 500
      console.error('[relationship-sessions] failed to start', error)
      return createErrorResponse(error.message, status)
    }

    const { data: sessionRow, error: fetchError } = await supabase
      .from('relationship_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (fetchError || !sessionRow) {
      return createErrorResponse('Session started but could not be loaded', 500)
    }

    return createSuccessResponse(
      { session: toSession(sessionRow as SessionRow, user.id) },
      'Session started',
    )
  } catch (error) {
    console.error('[relationship-sessions] unexpected POST error', error)
    return createErrorResponse('Internal server error', 500)
  }
}
