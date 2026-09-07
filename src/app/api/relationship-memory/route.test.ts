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

const VALID_BODY = {
  sourceType: 'appreciation',
  sourceId: VALID_SOURCE_ID,
  title: 'Thank you',
  content: 'You made a hard day easier.',
}

describe('GET /api/relationship-memory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('rejects an unauthenticated request', async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null })

    const response = await GET(makeRequest('/api/relationship-memory', { authorized: false }))

    expect(response.status).toBe(401)
  })

  it('lists memories, relying on RLS as the cross-user access boundary', async () => {
    const order = vi.fn().mockResolvedValue({ data: [], error: null })
    const select = vi.fn(() => ({ order }))
    const from = vi.fn(() => ({ select }))
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    })

    const response = await GET(makeRequest('/api/relationship-memory'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(from).toHaveBeenCalledWith('relationship_memories')
    expect(body.data.memories).toEqual([])
  })

  it('returns a safe error when the query fails', async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: { message: 'connection reset' } })
    const from = vi.fn(() => ({ select: vi.fn(() => ({ order })) }))
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    })

    const response = await GET(makeRequest('/api/relationship-memory'))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error).not.toContain('connection reset')
  })
})

describe('POST /api/relationship-memory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('rejects an unauthenticated request', async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null })

    const response = await POST(
      makeRequest('/api/relationship-memory', { method: 'POST', authorized: false, body: VALID_BODY }),
    )

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
      makeRequest('/api/relationship-memory', { method: 'POST', body: { ...VALID_BODY, sourceId: 'not-a-uuid' } }),
    )

    expect(response.status).toBe(400)
    expect(rpc).not.toHaveBeenCalled()
  })

  it("maps 'not found or not accessible' to 403 — the cited source isn't the caller's to save (wrong relationship / private draft)", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'source not found or not accessible' } })
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    })

    const response = await POST(makeRequest('/api/relationship-memory', { method: 'POST', body: VALID_BODY }))

    expect(response.status).toBe(403)
  })

  it('maps a disconnected relationship (no active partner) to 404', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'no active partner relationship' } })
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    })

    const response = await POST(makeRequest('/api/relationship-memory', { method: 'POST', body: VALID_BODY }))

    expect(response.status).toBe(404)
  })

  it('returns a safe, generic 500 on an unmapped RPC error (never the raw DB error text)', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'connection reset' } })
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    })

    const response = await POST(makeRequest('/api/relationship-memory', { method: 'POST', body: VALID_BODY }))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error).not.toContain('connection reset')
  })

  it('saves via the RPC (which itself re-verifies source access) then fetches the created row back', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 'memory-1', error: null })
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'memory-1',
        created_by: 'user-1',
        source_type: 'appreciation',
        source_id: VALID_SOURCE_ID,
        title: 'Thank you',
        content: 'You made a hard day easier.',
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

    const response = await POST(makeRequest('/api/relationship-memory', { method: 'POST', body: VALID_BODY }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(rpc).toHaveBeenCalledWith('save_relationship_memory', {
      p_source_type: 'appreciation',
      p_source_id: VALID_SOURCE_ID,
      p_title: 'Thank you',
      p_content: 'You made a hard day easier.',
    })
    expect(eq).toHaveBeenCalledWith('id', 'memory-1')
    expect(body.data.memory.id).toBe('memory-1')
  })
})
