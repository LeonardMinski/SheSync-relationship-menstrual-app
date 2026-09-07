import { NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/api/authentication'
import { createErrorResponse, createSuccessResponse } from '@/lib/api/responses'
import { SetPartnerContextStatusInputSchema, UpsertPartnerContextInputSchema } from '@/schemas/relationship'
import type { PartnerContext } from '@/types/relationship'

type PartnerContextRow = {
  id: string
  owner_user_id: string
  what_they_should_know: string
  might_help: string[]
  dont_need: string[]
  status: string
  shared_at: string | null
  created_at: string
  updated_at: string
}

function toPartnerContext(row: PartnerContextRow): PartnerContext {
  return {
    id: row.id,
    whatTheyShouldKnow: row.what_they_should_know,
    mightHelp: row.might_help as PartnerContext['mightHelp'],
    dontNeed: row.dont_need as PartnerContext['dontNeed'],
    status: row.status as PartnerContext['status'],
    sharedAt: row.shared_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** Own translation (any status) plus, when a partnerId is supplied, that partner's shared one. */
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request)
    if (!user || !supabase) {
      return createErrorResponse('Authentication required', 401)
    }

    const partnerId = request.nextUrl.searchParams.get('partnerId')

    const [ownResult, partnerResult] = await Promise.all([
      supabase.from('partner_contexts').select('*').eq('owner_user_id', user.id).maybeSingle(),
      partnerId
        ? supabase.from('partner_contexts').select('*').eq('owner_user_id', partnerId).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ])

    if (ownResult.error || partnerResult.error) {
      console.error('[partner-context] failed to fetch', ownResult.error, partnerResult.error)
      return createErrorResponse('Failed to load partner context', 500)
    }

    return createSuccessResponse({
      own: ownResult.data ? toPartnerContext(ownResult.data as PartnerContextRow) : null,
      partner: partnerResult.data ? toPartnerContext(partnerResult.data as PartnerContextRow) : null,
    })
  } catch (error) {
    console.error('[partner-context] unexpected GET error', error)
    return createErrorResponse('Internal server error', 500)
  }
}

/** Owner-only upsert of the single current draft. Status is untouched here — see PATCH. */
export async function PUT(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request)
    if (!user || !supabase) {
      return createErrorResponse('Authentication required', 401)
    }

    const body = await request.json().catch(() => ({}))
    const parsed = UpsertPartnerContextInputSchema.safeParse(body)
    if (!parsed.success) {
      return createErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
    }

    const { data, error } = await supabase
      .from('partner_contexts')
      .upsert(
        {
          owner_user_id: user.id,
          what_they_should_know: parsed.data.whatTheyShouldKnow,
          might_help: parsed.data.mightHelp,
          dont_need: parsed.data.dontNeed,
        },
        { onConflict: 'owner_user_id' },
      )
      .select()
      .single()

    if (error) {
      console.error('[partner-context] failed to upsert', error)
      return createErrorResponse('Failed to save context', 500)
    }

    return createSuccessResponse({ context: toPartnerContext(data as PartnerContextRow) }, 'Draft saved')
  } catch (error) {
    console.error('[partner-context] unexpected PUT error', error)
    return createErrorResponse('Internal server error', 500)
  }
}

/** Owner-only share/revoke. */
export async function PATCH(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request)
    if (!user || !supabase) {
      return createErrorResponse('Authentication required', 401)
    }

    const body = await request.json().catch(() => ({}))
    const parsed = SetPartnerContextStatusInputSchema.safeParse(body)
    if (!parsed.success) {
      return createErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
    }

    const { data, error } = await supabase
      .from('partner_contexts')
      .update({
        status: parsed.data.status,
        shared_at: parsed.data.status === 'shared' ? new Date().toISOString() : null,
      })
      .eq('owner_user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('[partner-context] failed to update status', error)
      return createErrorResponse('No draft found to share — save one first', 404)
    }

    return createSuccessResponse(
      { context: toPartnerContext(data as PartnerContextRow) },
      parsed.data.status === 'shared' ? 'Shared with your partner' : 'Revoked',
    )
  } catch (error) {
    console.error('[partner-context] unexpected PATCH error', error)
    return createErrorResponse('Internal server error', 500)
  }
}
