import { NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/api/authentication'
import { createErrorResponse, createSuccessResponse } from '@/lib/api/responses'
import { AddReplyInputSchema } from '@/schemas/relationship'
import type { SharedReply } from '@/types/relationship'

type ReplyRow = { id: string; author_id: string; content: string; created_at: string }

function toReply(row: ReplyRow): SharedReply {
  return { id: row.id, authorId: row.author_id, content: row.content, createdAt: row.created_at }
}

function statusForReplyRpcError(message: string): number {
  if (message.includes('not authenticated')) return 401
  if (message.includes('not found or not accessible')) return 403
  return 500
}

/** Flat, chronological, source-scoped replies. Access inherits from the source record — see get_replies(). */
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request)
    if (!user || !supabase) {
      return createErrorResponse('Authentication required', 401)
    }

    const sourceType = request.nextUrl.searchParams.get('sourceType')
    const sourceId = request.nextUrl.searchParams.get('sourceId')
    if (!sourceType || !sourceId) {
      return createErrorResponse('sourceType and sourceId are required', 400)
    }

    const { data, error } = await supabase.rpc('get_replies', {
      p_source_type: sourceType,
      p_source_id: sourceId,
    })

    if (error) {
      console.error('[replies] failed to fetch', error)
      const status = statusForReplyRpcError(error.message)
      return createErrorResponse(status === 500 ? 'Failed to load replies' : error.message, status)
    }

    return createSuccessResponse({ replies: ((data ?? []) as ReplyRow[]).map(toReply) })
  } catch (error) {
    console.error('[replies] unexpected GET error', error)
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
    const parsed = AddReplyInputSchema.safeParse(body)
    if (!parsed.success) {
      return createErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
    }

    const { data: replyId, error } = await supabase.rpc('add_reply', {
      p_source_type: parsed.data.sourceType,
      p_source_id: parsed.data.sourceId,
      p_content: parsed.data.content,
    })

    if (error) {
      console.error('[replies] failed to add', error)
      const status = statusForReplyRpcError(error.message)
      return createErrorResponse(status === 500 ? 'Failed to add reply' : error.message, status)
    }

    const { data: row, error: fetchError } = await supabase
      .from('shared_replies')
      .select('id, author_id, content, created_at')
      .eq('id', replyId)
      .single()

    // shared_replies has zero direct SELECT policies, so this follow-up
    // read (needed only to echo the created row back) also goes through
    // the RPC path instead of the raw table.
    if (fetchError || !row) {
      const { data: viaRpc } = await supabase.rpc('get_replies', {
        p_source_type: parsed.data.sourceType,
        p_source_id: parsed.data.sourceId,
      })
      const created = ((viaRpc ?? []) as ReplyRow[]).find((reply) => reply.id === replyId)
      if (!created) {
        return createErrorResponse('Reply added but could not be loaded', 500)
      }
      return createSuccessResponse({ reply: toReply(created) }, 'Reply added')
    }

    return createSuccessResponse({ reply: toReply(row as ReplyRow) }, 'Reply added')
  } catch (error) {
    console.error('[replies] unexpected POST error', error)
    return createErrorResponse('Internal server error', 500)
  }
}
