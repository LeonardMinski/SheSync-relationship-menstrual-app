import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authenticateRequest } from '@/lib/api/authentication'

import { GET, POST } from './route'

vi.mock('@/lib/api/authentication', () => ({
  authenticateRequest: vi.fn(),
}))

const authenticateRequestMock = vi.mocked(authenticateRequest)
const CALLER = { id: 'user-1', email: 'person@example.com', name: 'Person' }
const VALID_SOURCE_ID = '11111111-1111-4111-8111-111111111111'

function makeRequest(path: string, { method = 'GET', body, authorized = true }: { method?: string; body?: unknown; authorized?: boolean } = {}) {
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers: authorized
      ? { 'content-type': 'application/json', authorization: 'Bearer real-user-token' }
      : { 'content-type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

const VALID_BODY = { sourceType: 'appreciation', sourceId: VALID_SOURCE_ID, content: 'Agreed, that meant a lot.' }

describe('GET /api/replies', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('rejects an unauthenticated request', async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null })

    const response = await GET(
      makeRequest(`/api/replies?sourceType=appreciation&sourceId=${VALID_SOURCE_ID}`, { authorized: false }),
    )

    expect(response.status).toBe(401)
  })

  it('rejects a request missing sourceType/sourceId', async () => {
    const rpc = vi.fn()
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    })

    const response = await GET(makeRequest('/api/replies'))

    expect(response.status).toBe(400)
    expect(rpc).not.toHaveBeenCalled()
  })

  it("maps 'not found or not accessible' to 403 (wrong relationship / private source / revoked share)", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'source not found or not accessible' } })
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    })

    const response = await GET(makeRequest(`/api/replies?sourceType=appreciation&sourceId=${VALID_SOURCE_ID}`))

    expect(response.status).toBe(403)
  })

  it('returns a safe, generic 500 on an unmapped RPC error (never the raw DB error text)', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'connection reset' } })
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    })

    const response = await GET(makeRequest(`/api/replies?sourceType=appreciation&sourceId=${VALID_SOURCE_ID}`))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error).not.toContain('connection reset')
  })

  it('fetches replies only via the get_replies RPC (shared_replies has zero direct SELECT policies)', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ id: 'r1', author_id: 'user-1', content: 'hi', created_at: '2026-01-01T00:00:00.000Z' }],
      error: null,
    })
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    })

    const response = await GET(makeRequest(`/api/replies?sourceType=appreciation&sourceId=${VALID_SOURCE_ID}`))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(rpc).toHaveBeenCalledWith('get_replies', { p_source_type: 'appreciation', p_source_id: VALID_SOURCE_ID })
    expect(body.data.replies).toHaveLength(1)
  })
})

describe('POST /api/replies', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('rejects an unauthenticated request', async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null })

    const response = await POST(makeRequest('/api/replies', { method: 'POST', authorized: false, body: VALID_BODY }))

    expect(response.status).toBe(401)
  })

  it('rejects an invalid source id (not a UUID)', async () => {
    const rpc = vi.fn()
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    })

    const response = await POST(
      makeRequest('/api/replies', { method: 'POST', body: { ...VALID_BODY, sourceId: 'not-a-uuid' } }),
    )

    expect(response.status).toBe(400)
    expect(rpc).not.toHaveBeenCalled()
  })

  it("maps 'not found or not accessible' to 403 on add (wrong relationship / private source)", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'source not found or not accessible' } })
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    })

    const response = await POST(makeRequest('/api/replies', { method: 'POST', body: VALID_BODY }))

    expect(response.status).toBe(403)
  })

  it('returns a safe, generic 500 on an unmapped RPC error when adding (never the raw DB error text)', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'connection reset' } })
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    })

    const response = await POST(makeRequest('/api/replies', { method: 'POST', body: VALID_BODY }))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error).not.toContain('connection reset')
  })

  it('adds via the RPC, then echoes the row back from a direct shared_replies select when that succeeds', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 'reply-1', error: null })
    const single = vi.fn().mockResolvedValue({
      data: { id: 'reply-1', author_id: 'user-1', content: 'Agreed, that meant a lot.', created_at: '2026-01-01T00:00:00.000Z' },
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

    const response = await POST(makeRequest('/api/replies', { method: 'POST', body: VALID_BODY }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(rpc).toHaveBeenCalledWith('add_reply', {
      p_source_type: 'appreciation',
      p_source_id: VALID_SOURCE_ID,
      p_content: 'Agreed, that meant a lot.',
    })
    expect(body.data.reply.id).toBe('reply-1')
  })

  it('falls back to get_replies and finds the new reply by id when the direct shared_replies select fails (expected — zero SELECT policies)', async () => {
    const rpc = vi
      .fn()
      // add_reply
      .mockResolvedValueOnce({ data: 'reply-2', error: null })
      // fallback get_replies
      .mockResolvedValueOnce({
        data: [
          { id: 'reply-1', author_id: 'partner-1', content: 'earlier', created_at: '2026-01-01T00:00:00.000Z' },
          { id: 'reply-2', author_id: 'user-1', content: 'Agreed, that meant a lot.', created_at: '2026-01-02T00:00:00.000Z' },
        ],
        error: null,
      })
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: 'permission denied for table shared_replies' } })
    const eq = vi.fn(() => ({ single }))
    const select = vi.fn(() => ({ eq }))
    const from = vi.fn(() => ({ select }))
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc, from } as any,
    })

    const response = await POST(makeRequest('/api/replies', { method: 'POST', body: VALID_BODY }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(rpc).toHaveBeenNthCalledWith(2, 'get_replies', { p_source_type: 'appreciation', p_source_id: VALID_SOURCE_ID })
    expect(body.data.reply.id).toBe('reply-2')
    expect(body.data.reply.content).toBe('Agreed, that meant a lot.')
  })

  it('returns 500 if even the get_replies fallback cannot find the newly created reply', async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: 'reply-3', error: null })
      .mockResolvedValueOnce({ data: [], error: null })
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: 'permission denied' } })
    const eq = vi.fn(() => ({ single }))
    const select = vi.fn(() => ({ eq }))
    const from = vi.fn(() => ({ select }))
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc, from } as any,
    })

    const response = await POST(makeRequest('/api/replies', { method: 'POST', body: VALID_BODY }))

    expect(response.status).toBe(500)
  })
})
