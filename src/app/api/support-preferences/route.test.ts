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

describe('GET /api/support-preferences', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('rejects an unauthenticated request', async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null })

    const response = await GET(makeRequest('/api/support-preferences', { authorized: false }))

    expect(response.status).toBe(401)
  })

  it("queries only the caller's own row when no partnerId is supplied", async () => {
    const eq = vi.fn().mockResolvedValue({ data: [], error: null })
    const select = vi.fn(() => ({ eq }))
    const from = vi.fn(() => ({ select }))
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    })

    const response = await GET(makeRequest('/api/support-preferences'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(from).toHaveBeenCalledTimes(1)
    expect(eq).toHaveBeenCalledWith('owner_user_id', 'user-1')
    expect(body.data.own).toEqual([])
    expect(body.data.partner).toEqual([])
  })

  it('also queries the partnerId row when supplied — RLS is the real access boundary, this just shapes the response', async () => {
    const ownEq = vi.fn().mockResolvedValue({ data: [], error: null })
    const partnerEq = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'pref-1',
          owner_user_id: 'partner-1',
          context: 'overwhelmed',
          preferred_supports: ['quiet_company'],
          what_does_not_help: [],
          additional_context: null,
          is_shared: true,
          shared_at: '2026-01-01T00:00:00.000Z',
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
        },
      ],
      error: null,
    })
    let call = 0
    const from = vi.fn(() => {
      call += 1
      const eq = call === 1 ? ownEq : partnerEq
      return { select: vi.fn(() => ({ eq })) }
    })
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    })

    const response = await GET(makeRequest('/api/support-preferences?partnerId=partner-1'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(partnerEq).toHaveBeenCalledWith('owner_user_id', 'partner-1')
    expect(body.data.partner).toHaveLength(1)
    expect(body.data.partner[0].isShared).toBe(true)
  })

  it('returns a safe error when the underlying query fails', async () => {
    const eq = vi.fn().mockResolvedValue({ data: null, error: { message: 'connection reset' } })
    const from = vi.fn(() => ({ select: vi.fn(() => ({ eq })) }))
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    })

    const response = await GET(makeRequest('/api/support-preferences'))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error).not.toContain('connection reset')
  })
})

describe('PUT /api/support-preferences', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('rejects an unauthenticated request', async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null })

    const response = await PUT(
      makeRequest('/api/support-preferences', {
        method: 'PUT',
        authorized: false,
        body: { context: 'overwhelmed', preferredSupports: [], whatDoesNotHelp: [] },
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
      makeRequest('/api/support-preferences', {
        method: 'PUT',
        body: { context: 'not-a-real-context', preferredSupports: [], whatDoesNotHelp: [] },
      }),
    )

    expect(response.status).toBe(400)
    expect(from).not.toHaveBeenCalled()
  })

  it('rejects an unrecognised chip value', async () => {
    const from = vi.fn()
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    })

    const response = await PUT(
      makeRequest('/api/support-preferences', {
        method: 'PUT',
        body: { context: 'overwhelmed', preferredSupports: ['made_up_choice'], whatDoesNotHelp: [] },
      }),
    )

    expect(response.status).toBe(400)
    expect(from).not.toHaveBeenCalled()
  })

  it("upserts under the authenticated caller's id, never a client-supplied one", async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'pref-1',
        owner_user_id: 'user-1',
        context: 'overwhelmed',
        preferred_supports: ['quiet_company'],
        what_does_not_help: [],
        additional_context: null,
        is_shared: false,
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
      makeRequest('/api/support-preferences', {
        method: 'PUT',
        body: { context: 'overwhelmed', preferredSupports: ['quiet_company'], whatDoesNotHelp: [] },
      }),
    )

    expect(response.status).toBe(200)
    const upsertPayload = upsert.mock.calls[0][0]
    expect(upsertPayload.owner_user_id).toBe('user-1')
  })

  it('rejects a body carrying an unrecognised ownership field instead of silently ignoring it (.strict() schema)', async () => {
    const from = vi.fn()
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    })

    const response = await PUT(
      makeRequest('/api/support-preferences', {
        method: 'PUT',
        body: {
          context: 'overwhelmed',
          preferredSupports: [],
          whatDoesNotHelp: [],
          // Attacker-style attempt to write into a different owner's row —
          // the .strict() schema rejects this outright, before any upsert.
          ownerUserId: 'victim-user-2',
        },
      }),
    )

    expect(response.status).toBe(400)
    expect(from).not.toHaveBeenCalled()
  })
})

describe('PATCH /api/support-preferences', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('rejects an unauthenticated request', async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null })

    const response = await PATCH(
      makeRequest('/api/support-preferences', {
        method: 'PATCH',
        authorized: false,
        body: { context: 'overwhelmed', isShared: true },
      }),
    )

    expect(response.status).toBe(401)
  })

  it('rejects a malformed body', async () => {
    const from = vi.fn()
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    })

    const response = await PATCH(
      makeRequest('/api/support-preferences', {
        method: 'PATCH',
        body: { context: 'overwhelmed', isShared: 'yes' },
      }),
    )

    expect(response.status).toBe(400)
    expect(from).not.toHaveBeenCalled()
  })

  it('scopes the update to the caller only, and sets shared_at when sharing', async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'pref-1',
        owner_user_id: 'user-1',
        context: 'overwhelmed',
        preferred_supports: [],
        what_does_not_help: [],
        additional_context: null,
        is_shared: true,
        shared_at: '2026-01-01T00:00:00.000Z',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      error: null,
    })
    const select = vi.fn(() => ({ single }))
    const eq2 = vi.fn(() => ({ select }))
    const eq1 = vi.fn(() => ({ eq: eq2 }))
    const update = vi.fn(() => ({ eq: eq1 }))
    const from = vi.fn(() => ({ update }))
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    })

    const response = await PATCH(
      makeRequest('/api/support-preferences', {
        method: 'PATCH',
        body: { context: 'overwhelmed', isShared: true },
      }),
    )

    expect(response.status).toBe(200)
    expect(eq1).toHaveBeenCalledWith('owner_user_id', 'user-1')
    expect(eq2).toHaveBeenCalledWith('context', 'overwhelmed')
    const updatePayload = update.mock.calls[0][0]
    expect(updatePayload.is_shared).toBe(true)
    expect(typeof updatePayload.shared_at).toBe('string')
  })

  it("returns 404 when there's no row to share for that context (RLS/no-op update)", async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: 'no rows' } })
    const select = vi.fn(() => ({ single }))
    const eq2 = vi.fn(() => ({ select }))
    const eq1 = vi.fn(() => ({ eq: eq2 }))
    const update = vi.fn(() => ({ eq: eq1 }))
    const from = vi.fn(() => ({ update }))
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    })

    const response = await PATCH(
      makeRequest('/api/support-preferences', {
        method: 'PATCH',
        body: { context: 'upset', isShared: true },
      }),
    )

    expect(response.status).toBe(404)
  })
})
