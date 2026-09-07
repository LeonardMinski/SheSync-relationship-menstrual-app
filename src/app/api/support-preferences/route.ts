import { NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/api/authentication'
import { createErrorResponse, createSuccessResponse } from '@/lib/api/responses'
import {
  ShareSupportPreferenceInputSchema,
  UpsertSupportPreferenceInputSchema,
} from '@/schemas/relationship'
import type { SupportPreference } from '@/types/relationship'

type SupportPreferenceRow = {
  id: string
  owner_user_id: string
  context: string
  preferred_supports: string[]
  what_does_not_help: string[]
  additional_context: string | null
  is_shared: boolean
  shared_at: string | null
  created_at: string
  updated_at: string
}

function toSupportPreference(row: SupportPreferenceRow): SupportPreference {
  return {
    id: row.id,
    context: row.context as SupportPreference['context'],
    preferredSupports: row.preferred_supports as SupportPreference['preferredSupports'],
    whatDoesNotHelp: row.what_does_not_help as SupportPreference['whatDoesNotHelp'],
    additionalContext: row.additional_context,
    isShared: row.is_shared,
    sharedAt: row.shared_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Own preferences (all contexts, private or shared) plus, when a partner
 * id is supplied, that partner's SHARED preferences only — RLS enforces
 * the "shared + currently active relationship" boundary either way, this
 * just shapes two separate queries for a clearer response.
 */
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request)
    if (!user || !supabase) {
      return createErrorResponse('Authentication required', 401)
    }

    const partnerId = request.nextUrl.searchParams.get('partnerId')

    const ownQuery = supabase
      .from('support_preferences')
      .select('*')
      .eq('owner_user_id', user.id)

    const queries = partnerId
      ? [
          ownQuery,
          supabase.from('support_preferences').select('*').eq('owner_user_id', partnerId),
        ]
      : [ownQuery]

    const results = await Promise.all(queries)

    if (results.some((result) => result.error)) {
      console.error('[support-preferences] failed to fetch', results.map((result) => result.error))
      return createErrorResponse('Failed to load support preferences', 500)
    }

    const own = (results[0].data ?? []) as SupportPreferenceRow[]
    const partner = partnerId ? ((results[1]?.data ?? []) as SupportPreferenceRow[]) : []

    return createSuccessResponse({
      own: own.map(toSupportPreference),
      // RLS already restricted this to shared rows only, but the API
      // never trusts that silently — it only exposes what the caller
      // requested via an explicit partnerId, and RLS empty-returns for
      // anything not actually shared with them.
      partner: partner.map(toSupportPreference),
    })
  } catch (error) {
    console.error('[support-preferences] unexpected GET error', error)
    return createErrorResponse('Internal server error', 500)
  }
}

/** Owner-only upsert of one context's preferences. Sharing state is untouched here — see PATCH. */
export async function PUT(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request)
    if (!user || !supabase) {
      return createErrorResponse('Authentication required', 401)
    }

    const body = await request.json().catch(() => ({}))
    const parsed = UpsertSupportPreferenceInputSchema.safeParse(body)
    if (!parsed.success) {
      return createErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
    }

    const { data, error } = await supabase
      .from('support_preferences')
      .upsert(
        {
          owner_user_id: user.id,
          context: parsed.data.context,
          preferred_supports: parsed.data.preferredSupports,
          what_does_not_help: parsed.data.whatDoesNotHelp,
          additional_context: parsed.data.additionalContext ?? null,
        },
        { onConflict: 'owner_user_id,context' },
      )
      .select()
      .single()

    if (error) {
      console.error('[support-preferences] failed to upsert', error)
      return createErrorResponse('Failed to save support preferences', 500)
    }

    return createSuccessResponse(
      { preference: toSupportPreference(data as SupportPreferenceRow) },
      'Support preference saved',
    )
  } catch (error) {
    console.error('[support-preferences] unexpected PUT error', error)
    return createErrorResponse('Internal server error', 500)
  }
}

/** Owner-only share/unshare toggle for one context. */
export async function PATCH(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request)
    if (!user || !supabase) {
      return createErrorResponse('Authentication required', 401)
    }

    const body = await request.json().catch(() => ({}))
    const parsed = ShareSupportPreferenceInputSchema.safeParse(body)
    if (!parsed.success) {
      return createErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
    }

    const { data, error } = await supabase
      .from('support_preferences')
      .update({
        is_shared: parsed.data.isShared,
        shared_at: parsed.data.isShared ? new Date().toISOString() : null,
      })
      .eq('owner_user_id', user.id)
      .eq('context', parsed.data.context)
      .select()
      .single()

    if (error) {
      console.error('[support-preferences] failed to update sharing', error)
      return createErrorResponse('Failed to update sharing', 404)
    }

    return createSuccessResponse(
      { preference: toSupportPreference(data as SupportPreferenceRow) },
      parsed.data.isShared ? 'Shared with your partner' : 'No longer shared',
    )
  } catch (error) {
    console.error('[support-preferences] unexpected PATCH error', error)
    return createErrorResponse('Internal server error', 500)
  }
}
