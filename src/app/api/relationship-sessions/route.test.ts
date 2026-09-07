import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authenticateRequest } from '@/lib/api/authentication'

import { GET, POST } from './route'

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

describe('GET /api/relationship-sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('rejects an unauthenticated request', async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null })

    const response = await GET(makeRequest('/api/relationship-sessions', { authorized: false }))

    expect(response.status).toBe(401)
  })

  it('scopes the list to sessions where the caller is a participant', async () => {
    const order = vi.fn().mockResolvedValue({ data: [], error: null })
    const orFn = vi.fn(() => ({ order }))
    const select = vi.fn(() => ({ or: orFn }))
    const from = vi.fn(() => ({ select }))
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    })

    const response = await GET(makeRequest('/api/relationship-sessions'))

    expect(response.status).toBe(200)
    expect(orFn).toHaveBeenCalledWith('initiator_id.eq.user-1,partner_id.eq.user-1')
  })

  it('filters by ?type= when supplied', async () => {
    const eqFn = vi.fn().mockResolvedValue({ data: [], error: null })
    const order = vi.fn(() => ({ eq: eqFn }))
    const orFn = vi.fn(() => ({ order }))
    const select = vi.fn(() => ({ or: orFn }))
    const from = vi.fn(() => ({ select }))
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    })

    await GET(makeRequest('/api/relationship-sessions?type=weekly_us'))

    expect(eqFn).toHaveBeenCalledWith('session_type', 'weekly_us')
  })

  it("marks ownReadyAt/partnerReadyAt correctly depending on whether the caller is the initiator", async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          id: 's1',
          session_type: 'weekly_us',
          category: null,
          prompts: [],
          initiator_id: 'partner-1',
          partner_id: 'user-1',
          initiator_ready_at: '2026-01-01T00:00:00.000Z',
          partner_ready_at: null,
          revealed_at: null,
          created_at: '2026-01-01T00:00:00.000Z',
        },
      ],
      error: null,
    })
    const from = vi.fn(() => ({ select: vi.fn(() => ({ or: vi.fn(() => ({ order })) })) }))
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    })

    const response = await GET(makeRequest('/api/relationship-sessions'))
    const body = await response.json()

    // Caller (user-1) is the partner_id side here, not the initiator.
    expect(body.data.sessions[0].isInitiator).toBe(false)
    expect(body.data.sessions[0].ownReadyAt).toBeNull()
    expect(body.data.sessions[0].partnerReadyAt).toBe('2026-01-01T00:00:00.000Z')
  })
})

describe('POST /api/relationship-sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('rejects an unauthenticated request', async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null })

    const response = await POST(
      makeRequest('/api/relationship-sessions', { method: 'POST', authorized: false, body: { sessionType: 'weekly_us' } }),
    )

    expect(response.status).toBe(401)
  })

  it('rejects mutual_reveal without a category', async () => {
    const rpc = vi.fn()
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    })

    const response = await POST(
      makeRequest('/api/relationship-sessions', { method: 'POST', body: { sessionType: 'mutual_reveal' } }),
    )

    expect(response.status).toBe(400)
    expect(rpc).not.toHaveBeenCalled()
  })

  it('rejects weekly_us WITH a category (category only valid for mutual_reveal)', async () => {
    const rpc = vi.fn()
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    })

    const response = await POST(
      makeRequest('/api/relationship-sessions', {
        method: 'POST',
        body: { sessionType: 'weekly_us', category: 'affection' },
      }),
    )

    expect(response.status).toBe(400)
    expect(rpc).not.toHaveBeenCalled()
  })

  it('rejects (disconnected relationship) when the RPC reports no active partner', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'no active partner relationship to start a session with' } })
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    })

    const response = await POST(
      makeRequest('/api/relationship-sessions', { method: 'POST', body: { sessionType: 'weekly_us' } }),
    )

    expect(response.status).toBe(404)
  })

  it('starts a session via the RPC (never a direct insert) and fetches it back for the response', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 'session-1', error: null })
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'session-1',
        session_type: 'weekly_us',
        category: null,
        prompts: [{ key: 'felt_closest', text: 'x' }],
        initiator_id: 'user-1',
        partner_id: 'partner-1',
        initiator_ready_at: null,
        partner_ready_at: null,
        revealed_at: null,
        created_at: '2026-01-01T00:00:00.000Z',
      },
      error: null,
    })
    const eq = vi.fn(() => ({ single }))
    const select = vi.fn(() => ({ eq }))
    const from = vi.fn(() => ({ select }))
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc, from } as any,
    })

    const response = await POST(
      makeRequest('/api/relationship-sessions', { method: 'POST', body: { sessionType: 'weekly_us' } }),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(rpc).toHaveBeenCalledWith('start_relationship_session', expect.objectContaining({ p_session_type: 'weekly_us' }))
    expect(eq).toHaveBeenCalledWith('id', 'session-1')
    expect(body.data.session.id).toBe('session-1')
  })

  it('resolves the correct curated prompt for a mutual_reveal category', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 'session-2', error: null })
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'session-2',
        session_type: 'mutual_reveal',
        category: 'affection',
        prompts: [],
        initiator_id: 'user-1',
        partner_id: 'partner-1',
        initiator_ready_at: null,
        partner_ready_at: null,
        revealed_at: null,
        created_at: '2026-01-01T00:00:00.000Z',
      },
      error: null,
    })
    const from = vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ single })) })) }))
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc, from } as any,
    })

    await POST(
      makeRequest('/api/relationship-sessions', {
        method: 'POST',
        body: { sessionType: 'mutual_reveal', category: 'affection' },
      }),
    )

    const rpcArgs = rpc.mock.calls[0][1]
    expect(rpcArgs.p_category).toBe('affection')
    expect(rpcArgs.p_prompts).toHaveLength(1)
    expect(rpcArgs.p_prompts[0].key).toBe('affection')
  })
})
