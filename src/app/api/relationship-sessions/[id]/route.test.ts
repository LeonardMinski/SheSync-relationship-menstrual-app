import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authenticateRequest } from '@/lib/api/authentication'

import { GET } from './route'

vi.mock('@/lib/api/authentication', () => ({
  authenticateRequest: vi.fn(),
}))

const authenticateRequestMock = vi.mocked(authenticateRequest)
const CALLER = { id: 'user-1', email: 'person@example.com', name: 'Person' }

function makeRequest(path: string, { authorized = true }: { authorized?: boolean } = {}) {
  return new NextRequest(`http://localhost${path}`, {
    headers: authorized
      ? { 'content-type': 'application/json', authorization: 'Bearer real-user-token' }
      : { 'content-type': 'application/json' },
  })
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

const SESSION_ROW = {
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
}

function makeSupabase(
  sessionResult: { data: unknown; error: unknown },
  rpcResult?: { data: unknown; error: unknown },
) {
  const single = vi.fn().mockResolvedValue(sessionResult)
  const eq = vi.fn(() => ({ single }))
  const select = vi.fn(() => ({ eq }))
  const from = vi.fn(() => ({ select }))
  const rpc = rpcResult ? vi.fn().mockResolvedValue(rpcResult) : vi.fn()
  return { from, rpc, eq, select }
}

describe('GET /api/relationship-sessions/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('rejects an unauthenticated request', async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null })

    const response = await GET(makeRequest('/api/relationship-sessions/session-1', { authorized: false }), makeParams('session-1'))

    expect(response.status).toBe(401)
  })

  it('returns 404 when the session does not exist (or is not visible to the caller)', async () => {
    const { from, rpc } = makeSupabase({ data: null, error: { message: 'no rows' } })
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from, rpc } as any,
    })

    const response = await GET(makeRequest('/api/relationship-sessions/missing'), makeParams('missing'))

    expect(response.status).toBe(404)
    expect(rpc).not.toHaveBeenCalled()
  })

  it("maps 'not a participant' from get_session_answers to 403 (wrong relationship / guessed id)", async () => {
    const { from, rpc } = makeSupabase(
      { data: SESSION_ROW, error: null },
      { data: null, error: { message: 'not a participant in this session' } },
    )
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from, rpc } as any,
    })

    const response = await GET(makeRequest('/api/relationship-sessions/session-1'), makeParams('session-1'))

    expect(response.status).toBe(403)
  })

  it('returns a safe 500 on an unmapped RPC error (never the raw DB/RPC error text)', async () => {
    const { from, rpc } = makeSupabase(
      { data: SESSION_ROW, error: null },
      { data: null, error: { message: 'connection reset' } },
    )
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from, rpc } as any,
    })

    const response = await GET(makeRequest('/api/relationship-sessions/session-1'), makeParams('session-1'))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error).not.toContain('connection reset')
  })

  it('calls get_session_answers with the requested session id and returns exactly what it provides (no extra leakage before reveal)', async () => {
    const answerRows = [{ answerer_id: 'user-1', prompt_key: 'felt_closest', answer_text: 'you' }]
    const { from, rpc } = makeSupabase(
      { data: SESSION_ROW, error: null },
      { data: answerRows, error: null },
    )
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from, rpc } as any,
    })

    const response = await GET(makeRequest('/api/relationship-sessions/session-1'), makeParams('session-1'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(rpc).toHaveBeenCalledWith('get_session_answers', { p_session_id: 'session-1' })
    expect(body.data.session.id).toBe('session-1')
    expect(body.data.answers).toEqual([{ answererId: 'user-1', promptKey: 'felt_closest', answerText: 'you' }])
  })
})
