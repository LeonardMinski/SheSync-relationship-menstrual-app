import { NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/api/authentication'
import { createErrorResponse, createSuccessResponse } from '@/lib/api/responses'
import { SaveRelationshipMemoryInputSchema } from '@/schemas/relationship'
import type { RelationshipMemory } from '@/types/relationship'

type MemoryRow = {
  id: string
  created_by: string
  source_type: string
  source_id: string
  title: string
  content: string
  created_at: string
}

function toMemory(row: MemoryRow): RelationshipMemory {
  return {
    id: row.id,
    createdBy: row.created_by,
    sourceType: row.source_type as RelationshipMemory['sourceType'],
    sourceId: row.source_id,
    title: row.title,
    content: row.content,
    createdAt: row.created_at,
  }
}

export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request)
    if (!user || !supabase) {
      return createErrorResponse('Authentication required', 401)
    }

    const { data, error } = await supabase
      .from('relationship_memories')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[relationship-memory] failed to fetch', error)
      return createErrorResponse('Failed to load relationship memory', 500)
    }

    return createSuccessResponse({ memories: ((data ?? []) as MemoryRow[]).map(toMemory) })
  } catch (error) {
    console.error('[relationship-memory] unexpected GET error', error)
    return createErrorResponse('Internal server error', 500)
  }
}

/** save_relationship_memory() verifies the caller genuinely has access to the cited source before saving. */
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request)
    if (!user || !supabase) {
      return createErrorResponse('Authentication required', 401)
    }

    const body = await request.json().catch(() => ({}))
    const parsed = SaveRelationshipMemoryInputSchema.safeParse(body)
    if (!parsed.success) {
      return createErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
    }

    const { data: memoryId, error } = await supabase.rpc('save_relationship_memory', {
      p_source_type: parsed.data.sourceType,
      p_source_id: parsed.data.sourceId,
      p_title: parsed.data.title,
      p_content: parsed.data.content,
    })

    if (error) {
      console.error('[relationship-memory] failed to save', error)
      const status = error.message.includes('not authenticated')
        ? 401
        : error.message.includes('no active partner')
          ? 404
          : error.message.includes('not found or not accessible')
            ? 403
            : 500
      return createErrorResponse(error.message, status)
    }

    const { data: row, error: fetchError } = await supabase
      .from('relationship_memories')
      .select('*')
      .eq('id', memoryId)
      .single()

    if (fetchError || !row) {
      return createErrorResponse('Saved but could not be loaded', 500)
    }

    return createSuccessResponse({ memory: toMemory(row as MemoryRow) }, 'Saved to relationship memory')
  } catch (error) {
    console.error('[relationship-memory] unexpected POST error', error)
    return createErrorResponse('Internal server error', 500)
  }
}
