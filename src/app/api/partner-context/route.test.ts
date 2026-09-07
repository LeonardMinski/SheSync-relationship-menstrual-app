import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authenticateRequest } from '@/lib/api/authentication'

import { GET, PATCH, PUT } from './route'

vi.mock('@/lib/api/authentication', () => ({
  authenticateRequest: vi.fn(),
}))

const authenticateRequestMock = vi.mocked(authenticateRequest)
const CALLER = { id: 'user-1', email: 'person@example.com', name: 'Person' }

function makeRequest(
  path: string,
  { method = 'GET', body, authorized = true }: { method?: string; body?: unknown; authorized?: boolean } = {},
) {
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers: authorized
      ? { 'content-type': 'application/json', authorization: 'Bearer real-user-token' }
      : { 'content-type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

function makeMaybeSingleChain(result: { data: unknown; error: unknown }) {
  const maybeSingle = vi.fn().mockResolvedValue(result)
  const eq = vi.fn(() => ({ maybeSingle }))
  const select = vi.fn(() => ({ eq }))
  return { select, eq, maybeSingle }
}

describe('GET /api/partner-context', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('rejects an unauthenticated request', async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null })

    const response = await GET(makeRequest('/api/partner-context', { authorized: false }))

    expect(response.status).toBe(401)
  })

  it('queries only own context when no partnerId is supplied, and returns partner: null', async () => {
    const own = makeMaybeSingleChain({ data: null, error: null })
    const from = vi.fn(() => ({ select: own.select }))
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    })

    const response = await GET(makeRequest('/api/partner-context'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(from).toHaveBeenCalledTimes(1)
    expect(own.eq).toHaveBeenCalledWith('owner_user_id', 'user-1')
    expect(body.data.own).toBeNull()
    expect(body.data.partner).toBeNull()
  })

  it("returns partner: null for an unshared/private draft — simulates RLS hiding it, proving the route doesn't leak private drafts", async () => {
    const own = makeMaybeSingleChain({ data: null, error: null })
    // A real RLS-protected query for a private (non-'shared') draft would
    // come back empty even though the row technically exists — the route
    // must handle that the same as "nothing shared" and never assume
    // otherwise.
    const partner = makeMaybeSingleChain({ data: null, error: null })
    let call = 0
    const from = vi.fn(() => {
      call += 1
      return { select: call === 1 ? own.select : partner.select }
    })
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    })

    const response = await GET(makeRequest('/api/partner-context?partnerId=partner-1'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(partner.eq).toHaveBeenCalledWith('owner_user_id', 'partner-1')
    expect(body.data.partner).toBeNull()
  })

  it('returns the partner context when it is actually shared', async () => {
    const own = makeMaybeSingleChain({ data: null, error: null })
    const partner = makeMaybeSingleChain({
      data: {
        id: 'ctx-1',
        owner_user_id: 'partner-1',
        what_they_should_know: 'Cramps are intense today',
        might_help: ['quiet_company'],
        dont_need: ['advice'],
        status: 'shared',
        shared_at: '2026-01-01T00:00:00.000Z',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      error: null,
    })
    let call = 0
    const from = vi.fn(() => {
      call += 1
      return { select: call === 1 ? own.select : partner.select }
    })
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    })

    const response = await GET(makeRequest('/api/partner-context?partnerId=partner-1'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.partner.status).toBe('shared')
    expect(body.data.partner.whatTheyShouldKnow).toBe('Cramps are intense today')
  })
})

describe('PUT /api/partner-context', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('rejects an unauthenticated request', async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null })

    const response = await PUT(
      makeRequest('/api/partner-context', {
        method: 'PUT',
        authorized: false,
        body: { whatTheyShouldKnow: 'x', mightHelp: [], dontNeed: [] },
      }),
    )

    expect(response.status).toBe(401)
  })

  it('rejects a malformed body before touching the database', async () => {
    const from = vi.fn()
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    })

    const response = await PUT(
      makeRequest('/api/partner-context', {
        method: 'PUT',
        body: { whatTheyShouldKnow: 'x', mightHelp: ['not_a_real_choice'], dontNeed: [] },
      }),
    )

    expect(response.status).toBe(400)
    expect(from).not.toHaveBeenCalled()
  })

  it("upserts under the authenticated caller's id, never a client-supplied owner", async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'ctx-1',
        owner_user_id: 'user-1',
        what_they_should_know: 'x',
        might_help: [],
        dont_need: [],
        status: 'draft',
        shared_at: null,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      error: null,
    })
    const select = vi.fn(() => ({ single }))
    const upsert = vi.fn(() => ({ select }))
    const from = vi.fn(() => ({ upsert }))
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    })

    const response = await PUT(
      makeRequest('/api/partner-context', {
        method: 'PUT',
        body: { whatTheyShouldKnow: 'x', mightHelp: [], dontNeed: [] },
      }),
    )

    expect(response.status).toBe(200)
    expect(upsert.mock.calls[0][0].owner_user_id).toBe('user-1')
  })

  it('returns a safe error when the database write fails', async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: 'connection reset' } })
    const select = vi.fn(() => ({ single }))
    const upsert = vi.fn(() => ({ select }))
    const from = vi.fn(() => ({ upsert }))
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    })

    const response = await PUT(
      makeRequest('/api/partner-context', {
        method: 'PUT',
        body: { whatTheyShouldKnow: 'x', mightHelp: [], dontNeed: [] },
      }),
    )
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error).not.toContain('connection reset')
  })
})

describe('PATCH /api/partner-context', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('rejects an unauthenticated request', async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null })

    const response = await PATCH(
      makeRequest('/api/partner-context', { method: 'PATCH', authorized: false, body: { status: 'shared' } }),
    )

    expect(response.status).toBe(401)
  })

  it('rejects an invalid status value (e.g. attempting to set "draft" directly)', async () => {
    const from = vi.fn()
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    })

    const response = await PATCH(
      makeRequest('/api/partner-context', { method: 'PATCH', body: { status: 'draft' } }),
    )

    expect(response.status).toBe(400)
    expect(from).not.toHaveBeenCalled()
  })

  it('shares under the caller only, setting shared_at', async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'ctx-1',
        owner_user_id: 'user-1',
        what_they_should_know: 'x',
        might_help: [],
        dont_need: [],
        status: 'shared',
        shared_at: '2026-01-01T00:00:00.000Z',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      error: null,
    })
    const select = vi.fn(() => ({ single }))
    const eq = vi.fn(() => ({ select }))
    const update = vi.fn(() => ({ eq }))
    const from = vi.fn(() => ({ update }))
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    })

    const response = await PATCH(
      makeRequest('/api/partner-context', { method: 'PATCH', body: { status: 'shared' } }),
    )

    expect(response.status).toBe(200)
    expect(eq).toHaveBeenCalledWith('owner_user_id', 'user-1')
    const updatePayload = update.mock.calls[0][0]
    expect(updatePayload.status).toBe('shared')
    expect(typeof updatePayload.shared_at).toBe('string')
  })

  it('clears shared_at on revoke', async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'ctx-1',
        owner_user_id: 'user-1',
        what_they_should_know: 'x',
        might_help: [],
        dont_need: [],
        status: 'revoked',
        shared_at: null,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      error: null,
    })
    const select = vi.fn(() => ({ single }))
    const eq = vi.fn(() => ({ select }))
    const update = vi.fn(() => ({ eq }))
    const from = vi.fn(() => ({ update }))
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    })

    const response = await PATCH(
      makeRequest('/api/partner-context', { method: 'PATCH', body: { status: 'revoked' } }),
    )

    expect(response.status).toBe(200)
    expect(update.mock.calls[0][0].shared_at).toBeNull()
  })

  it('returns 404 when there is no draft to share', async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: 'no rows' } })
    const select = vi.fn(() => ({ single }))
    const eq = vi.fn(() => ({ select }))
    const update = vi.fn(() => ({ eq }))
    const from = vi.fn(() => ({ update }))
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    })

    const response = await PATCH(
      makeRequest('/api/partner-context', { method: 'PATCH', body: { status: 'shared' } }),
    )

    expect(response.status).toBe(404)
  })
})
