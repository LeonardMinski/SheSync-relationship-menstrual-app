import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authenticateRequest } from '@/lib/api/authentication'

import { POST } from './route'

vi.mock('@/lib/api/authentication', () => ({
  authenticateRequest: vi.fn(),
}))

const authenticateRequestMock = vi.mocked(authenticateRequest)
const CALLER = { id: 'user-1', email: 'person@example.com', name: 'Person' }

function makeRequest(path: string, { authorized = true }: { authorized?: boolean } = {}) {
  return new NextRequest(`http://localhost${path}`, {
    method: 'POST',
    headers: authorized
      ? { 'content-type': 'application/json', authorization: 'Bearer real-user-token' }
      : { 'content-type': 'application/json' },
  })
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe('POST /api/relationship-sessions/[id]/ready', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('rejects an unauthenticated request', async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null })

    const response = await POST(makeRequest('/api/relationship-sessions/session-1/ready', { authorized: false }), makeParams('session-1'))

    expect(response.status).toBe(401)
  })

  it("maps 'not a participant' to 403 (wrong relationship / guessed session id)", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'caller is not a participant in this session' } })
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    })

    const response = await POST(makeRequest('/api/relationship-sessions/session-1/ready'), makeParams('session-1'))

    expect(response.status).toBe(403)
  })

  it("maps 'answer at least one prompt' to 400", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'you must answer at least one prompt first' } })
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    })

    const response = await POST(makeRequest('/api/relationship-sessions/session-1/ready'), makeParams('session-1'))

    expect(response.status).toBe(400)
  })

  it('returns a safe, generic 500 on an unmapped RPC error (never the raw DB error text)', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'connection reset' } })
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    })

    const response = await POST(makeRequest('/api/relationship-sessions/session-1/ready'), makeParams('session-1'))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error).not.toContain('connection reset')
  })

  it("marks only the caller's own ready flag via the RPC, scoped to the session id in the URL", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null })
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    })

    const response = await POST(makeRequest('/api/relationship-sessions/session-1/ready'), makeParams('session-1'))

    expect(response.status).toBe(200)
    expect(rpc).toHaveBeenCalledWith('mark_session_ready', { p_session_id: 'session-1' })
  })
})
