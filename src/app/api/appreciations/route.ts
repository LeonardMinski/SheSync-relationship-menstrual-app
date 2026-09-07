import { NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/api/authentication'
import { createErrorResponse, createSuccessResponse } from '@/lib/api/responses'
import { SendAppreciationInputSchema } from '@/schemas/relationship'
import type { Appreciation } from '@/types/relationship'

type AppreciationRow = {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  sent_at: string
}

function toAppreciation(row: AppreciationRow, callerId: string): Appreciation {
  return {
    id: row.id,
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    content: row.content,
    sentAt: row.sent_at,
    direction: row.sender_id === callerId ? 'sent' : 'received',
  }
}

export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request)
    if (!user || !supabase) {
      return createErrorResponse('Authentication required', 401)
    }

    // RLS already restricts rows to ones the caller sent or received (and,
    // for received, only while the relationship is currently active) —
    // this single or-filter just reads both sides in one query.
    const { data, error } = await supabase
      .from('relationship_appreciations')
      .select('*')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('sent_at', { ascending: false })

    if (error) {
      console.error('[appreciations] failed to fetch', error)
      return createErrorResponse('Failed to load appreciations', 500)
    }

    return createSuccessResponse({
      appreciations: ((data ?? []) as AppreciationRow[]).map((row) => toAppreciation(row, user.id)),
    })
  } catch (error) {
    console.error('[appreciations] unexpected GET error', error)
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
    const parsed = SendAppreciationInputSchema.safeParse(body)
    if (!parsed.success) {
      return createErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
    }

    const { data: ownerLinks, error: linkError } = await supabase
      .from('partner_links')
      .select('owner_user_id, viewer_user_id')
      .eq('status', 'active')
      .or(`owner_user_id.eq.${user.id},viewer_user_id.eq.${user.id}`)
      .limit(1)

    if (linkError) {
      console.error('[appreciations] failed to resolve active partner', linkError)
      return createErrorResponse('Failed to send appreciation', 500)
    }

    const link = ownerLinks?.[0]
    if (!link) {
      return createErrorResponse('No active partner relationship to send this to', 404)
    }

    const recipientId = link.owner_user_id === user.id ? link.viewer_user_id : link.owner_user_id

    const { data, error } = await supabase
      .from('relationship_appreciations')
      .insert({ sender_id: user.id, recipient_id: recipientId, content: parsed.data.content })
      .select()
      .single()

    if (error) {
      console.error('[appreciations] failed to insert', error)
      return createErrorResponse('Failed to send appreciation', 500)
    }

    return createSuccessResponse(
      { appreciation: toAppreciation(data as AppreciationRow, user.id) },
      'Sent',
    )
  } catch (error) {
    console.error('[appreciations] unexpected POST error', error)
    return createErrorResponse('Internal server error', 500)
  }
}
