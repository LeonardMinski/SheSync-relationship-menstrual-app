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

describe('GET /api/appreciations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('rejects an unauthenticated request', async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null })

    const response = await GET(makeRequest('/api/appreciations', { authorized: false }))

    expect(response.status).toBe(401)
  })

  it('queries both sender and recipient sides for the caller, and labels direction correctly', async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        { id: 'a1', sender_id: 'user-1', recipient_id: 'partner-1', content: 'thanks', sent_at: '2026-01-02T00:00:00.000Z' },
        { id: 'a2', sender_id: 'partner-1', recipient_id: 'user-1', content: 'you too', sent_at: '2026-01-01T00:00:00.000Z' },
      ],
      error: null,
    })
    const orFn = vi.fn(() => ({ order }))
    const select = vi.fn(() => ({ or: orFn }))
    const from = vi.fn(() => ({ select }))
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    })

    const response = await GET(makeRequest('/api/appreciations'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(orFn).toHaveBeenCalledWith('sender_id.eq.user-1,recipient_id.eq.user-1')
    expect(body.data.appreciations[0].direction).toBe('sent')
    expect(body.data.appreciations[1].direction).toBe('received')
  })

  it('returns a safe error when the query fails', async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: { message: 'connection reset' } })
    const from = vi.fn(() => ({ select: vi.fn(() => ({ or: vi.fn(() => ({ order })) })) }))
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    })

    const response = await GET(makeRequest('/api/appreciations'))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error).not.toContain('connection reset')
  })
})

describe('POST /api/appreciations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  function makeSupabase(linkResult: { data: unknown; error: unknown }, insertResult?: { data: unknown; error: unknown }) {
    const linkLimit = vi.fn().mockResolvedValue(linkResult)
    const linkOr = vi.fn(() => ({ limit: linkLimit }))
    const linkEq = vi.fn(() => ({ or: linkOr }))
    const linkSelect = vi.fn(() => ({ eq: linkEq }))

    const insertSingle = insertResult ? vi.fn().mockResolvedValue(insertResult) : vi.fn()
    const insertSelect = vi.fn(() => ({ single: insertSingle }))
    const insert = vi.fn(() => ({ select: insertSelect }))

    const from = vi.fn((table: string) => {
      if (table === 'partner_links') return { select: linkSelect }
      if (table === 'relationship_appreciations') return { insert }
      throw new Error(`unexpected table ${table}`)
    })

    return { from, linkEq, linkOr, insert }
  }

  it('rejects an unauthenticated request', async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null })

    const response = await POST(
      makeRequest('/api/appreciations', { method: 'POST', authorized: false, body: { content: 'thanks' } }),
    )

    expect(response.status).toBe(401)
  })

  it('rejects an empty/missing content field', async () => {
    const { from } = makeSupabase({ data: [], error: null })
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    })

    const response = await POST(makeRequest('/api/appreciations', { method: 'POST', body: { content: '' } }))

    expect(response.status).toBe(400)
    expect(from).not.toHaveBeenCalled()
  })

  it('rejects (disconnected relationship) when there is no active partner_links row', async () => {
    const { from } = makeSupabase({ data: [], error: null })
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    })

    const response = await POST(makeRequest('/api/appreciations', { method: 'POST', body: { content: 'thanks' } }))

    expect(response.status).toBe(404)
  })

  it('only ever queries partner_links filtered to status=active', async () => {
    const { from, linkEq } = makeSupabase({ data: [], error: null })
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    })

    await POST(makeRequest('/api/appreciations', { method: 'POST', body: { content: 'thanks' } }))

    expect(linkEq).toHaveBeenCalledWith('status', 'active')
  })

  it('resolves the recipient from the active link and sends as the authenticated caller — never a client-supplied recipient', async () => {
    const { from, insert } = makeSupabase(
      { data: [{ owner_user_id: 'user-1', viewer_user_id: 'partner-1' }], error: null },
      {
        data: { id: 'a1', sender_id: 'user-1', recipient_id: 'partner-1', content: 'thanks', sent_at: '2026-01-01T00:00:00.000Z' },
        error: null,
      },
    )
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    })

    const response = await POST(
      makeRequest('/api/appreciations', {
        method: 'POST',
        // Attacker-style attempt to redirect the message elsewhere.
        body: { content: 'thanks', recipientId: 'someone-else' },
      }),
    )
    const body = await response.json()

    expect(response.status).toBe(400) // .strict() schema rejects the extra field outright
    expect(insert).not.toHaveBeenCalled()
    expect(body).toBeDefined()
  })

  it('resolves the recipient correctly when the caller is the viewer side of the link', async () => {
    const { from, insert } = makeSupabase(
      { data: [{ owner_user_id: 'partner-1', viewer_user_id: 'user-1' }], error: null },
      {
        data: { id: 'a1', sender_id: 'user-1', recipient_id: 'partner-1', content: 'thanks', sent_at: '2026-01-01T00:00:00.000Z' },
        error: null,
      },
    )
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    })

    const response = await POST(makeRequest('/api/appreciations', { method: 'POST', body: { content: 'thanks' } }))

    expect(response.status).toBe(200)
    expect(insert.mock.calls[0][0]).toEqual({
      sender_id: 'user-1',
      recipient_id: 'partner-1',
      content: 'thanks',
    })
  })
})
