import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authenticateRequest } from '@/lib/api/authentication'

import { POST } from './route'

vi.mock('@/lib/api/authentication', () => ({
  authenticateRequest: vi.fn(),
}))

const authenticateRequestMock = vi.mocked(authenticateRequest)
const CALLER = { id: 'user-1', email: 'person@example.com', name: 'Person' }

function makeRequest(path: string, { body, authorized = true }: { body?: unknown; authorized?: boolean } = {}) {
  return new NextRequest(`http://localhost${path}`, {
    method: 'POST',
    headers: authorized
      ? { 'content-type': 'application/json', authorization: 'Bearer real-user-token' }
      : { 'content-type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

const VALID_BODY = { promptKey: 'felt_closest', answerText: 'You showed up when I needed it' }

describe('POST /api/relationship-sessions/[id]/answers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('rejects an unauthenticated request', async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null })

    const response = await POST(
      makeRequest('/api/relationship-sessions/session-1/answers', { authorized: false, body: VALID_BODY }),
      makeParams('session-1'),
    )

    expect(response.status).toBe(401)
  })

  it('rejects a malformed body before touching the database', async () => {
    const rpc = vi.fn()
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    })

    const response = await POST(
      makeRequest('/api/relationship-sessions/session-1/answers', { body: { promptKey: 'felt_closest' } }),
      makeParams('session-1'),
    )

    expect(response.status).toBe(400)
    expect(rpc).not.toHaveBeenCalled()
  })

  it("maps 'not a participant' to 403 (wrong relationship / guessed session id)", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'caller is not a participant in this session' } })
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    })

    const response = await POST(
      makeRequest('/api/relationship-sessions/session-1/answers', { body: VALID_BODY }),
      makeParams('session-1'),
    )

    expect(response.status).toBe(403)
  })

  it("maps 'already been revealed' to 409", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'this session has already been revealed' } })
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    })

    const response = await POST(
      makeRequest('/api/relationship-sessions/session-1/answers', { body: VALID_BODY }),
      makeParams('session-1'),
    )

    expect(response.status).toBe(409)
  })

  it('returns a safe, generic 500 on an unmapped RPC error (never the raw DB error text)', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'connection reset' } })
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    })

    const response = await POST(
      makeRequest('/api/relationship-sessions/session-1/answers', { body: VALID_BODY }),
      makeParams('session-1'),
    )
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error).not.toContain('connection reset')
  })

  it('submits via the RPC using the caller-supplied session id and the parsed body, never a client-supplied answerer', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null })
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    })

    const response = await POST(
      makeRequest('/api/relationship-sessions/session-1/answers', { body: VALID_BODY }),
      makeParams('session-1'),
    )

    expect(response.status).toBe(200)
    expect(rpc).toHaveBeenCalledWith('submit_session_answer', {
      p_session_id: 'session-1',
      p_prompt_key: 'felt_closest',
      p_answer_text: 'You showed up when I needed it',
    })
  })

  it('rejects a body carrying an unrecognised field instead of silently ignoring it (.strict() schema)', async () => {
    const rpc = vi.fn()
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    })

    const response = await POST(
      makeRequest('/api/relationship-sessions/session-1/answers', {
        body: { ...VALID_BODY, answererId: 'someone-else' },
      }),
      makeParams('session-1'),
    )

    expect(response.status).toBe(400)
    expect(rpc).not.toHaveBeenCalled()
  })
})
