import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  listEntries, 
  getEntry, 
  createEntry, 
  updateEntry, 
  deleteEntry 
} from '../services'
import type { FantasyEntry } from '../schemas'

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          data: [],
          error: null
        })),
        single: vi.fn(() => ({
          data: null,
          error: null
        }))
      }))
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => ({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            user_id: '456e7890-e89b-12d3-a456-426614174001',
            title: 'Test Fantasy',
            content_text: 'Test content',
            content_url: null,
            kind: 'text',
            tags: [],
            comfort: 3,
            share_status: 'hidden',
            redacted: false,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          },
          error: null
        }))
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: {
                id: '123e4567-e89b-12d3-a456-426614174000',
                user_id: '456e7890-e89b-12d3-a456-426614174001',
                title: 'Updated Fantasy',
                content_text: 'Updated content',
                content_url: null,
                kind: 'text',
                tags: [],
                comfort: 4,
                share_status: 'tease',
                redacted: false,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-02T00:00:00Z'
              },
              error: null
            }))
          }))
        }))
      }))
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          error: null
        }))
      }))
    }))
  }))
}

vi.mock('@/lib/supabaseClient', () => ({
  supabase: mockSupabaseClient
}))

describe('Fantasy Services', () => {
  const mockUserId = '456e7890-e89b-12d3-a456-426614174001'
  const mockEntryId = '123e4567-e89b-12d3-a456-426614174000'
  
  const mockFantasyEntry: FantasyEntry = {
    title: 'Test Fantasy',
    content_text: 'This is a test fantasy entry',
    content_url: 'https://example.com/image.jpg',
    kind: 'text',
    tags: ['romantic', 'test'],
    comfort: 3,
    share_status: 'hidden',
    redacted: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock to default behavior
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null
          })),
          single: vi.fn(() => ({
            data: null,
            error: null
          }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: '123e4567-e89b-12d3-a456-426614174000',
              user_id: '456e7890-e89b-12d3-a456-426614174001',
              title: 'Test Fantasy',
              content_text: 'Test content',
              content_url: null,
              kind: 'text',
              tags: [],
              comfort: 3,
              share_status: 'hidden',
              redacted: false,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z'
            },
            error: null
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: {
                  id: '123e4567-e89b-12d3-a456-426614174000',
                  user_id: '456e7890-e89b-12d3-a456-426614174001',
                  title: 'Updated Fantasy',
                  content_text: 'Updated content',
                  content_url: null,
                  kind: 'text',
                  tags: [],
                  comfort: 4,
                  share_status: 'tease',
                  redacted: false,
                  created_at: '2024-01-01T00:00:00Z',
                  updated_at: '2024-01-02T00:00:00Z'
                },
                error: null
              }))
            }))
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            error: null
          }))
        }))
      }))
    } as any)
  })

  describe('listEntries', () => {
    it('should return empty array when no entries exist', async () => {
      const entries = await listEntries(mockUserId)
      expect(entries).toEqual([])
    })

    it('should handle errors gracefully', async () => {
      // Mock error response
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              data: null,
              error: { message: 'Database error' }
            }))
          }))
        }))
      } as any)

      const entries = await listEntries(mockUserId)
      expect(entries).toEqual([])
    })
  })

  describe('getEntry', () => {
    it('should return null when entry does not exist', async () => {
      const entry = await getEntry(mockUserId, mockEntryId)
      expect(entry).toBeNull()
    })

    it('should handle errors gracefully', async () => {
      // Mock error response
      const mockSupabase = await import('@/lib/supabaseClient')
      vi.mocked(mockSupabase.supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: null,
                error: { message: 'Entry not found' }
              }))
            }))
          }))
        }))
      } as any)

      const entry = await getEntry(mockUserId, mockEntryId)
      expect(entry).toBeNull()
    })
  })

  describe('createEntry', () => {
    it('should create a new fantasy entry', async () => {
      const result = await createEntry(mockUserId, mockFantasyEntry)
      
      expect(result).toBeDefined()
      expect(result?.title).toBe('Test Fantasy')
      expect(result?.content_text).toBe('This is a test fantasy entry')
      expect(result?.kind).toBe('text')
      expect(result?.comfort).toBe(3)
    })

    it('should handle creation errors', async () => {
      // Mock error response
      const mockSupabase = await import('@/lib/supabaseClient')
      vi.mocked(mockSupabase.supabase.from).mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: { message: 'Creation failed' }
            }))
          }))
        }))
      } as any)

      const result = await createEntry(mockUserId, mockFantasyEntry)
      expect(result).toBeNull()
    })
  })

  describe('updateEntry', () => {
    it('should update an existing fantasy entry', async () => {
      const updatedEntry: FantasyEntry = {
        ...mockFantasyEntry,
        title: 'Updated Fantasy',
        comfort: 4,
        share_status: 'tease'
      }

      const result = await updateEntry(mockUserId, mockEntryId, updatedEntry)
      
      expect(result).toBeDefined()
      expect(result?.title).toBe('Updated Fantasy')
      expect(result?.comfort).toBe(4)
      expect(result?.share_status).toBe('tease')
    })

    it('should handle update errors', async () => {
      // Mock error response
      const mockSupabase = await import('@/lib/supabaseClient')
      vi.mocked(mockSupabase.supabase.from).mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: null,
                error: { message: 'Update failed' }
              }))
            }))
          }))
        }))
      } as any)

      const result = await updateEntry(mockUserId, mockEntryId, mockFantasyEntry)
      expect(result).toBeNull()
    })
  })

  describe('deleteEntry', () => {
    it('should delete an existing fantasy entry', async () => {
      const result = await deleteEntry(mockUserId, mockEntryId)
      expect(result).toBe(true)
    })

    it('should handle deletion errors', async () => {
      // Mock error response
      const mockSupabase = await import('@/lib/supabaseClient')
      vi.mocked(mockSupabase.supabase.from).mockReturnValue({
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              error: { message: 'Deletion failed' }
            }))
          }))
        }))
      } as any)

      const result = await deleteEntry(mockUserId, mockEntryId)
      expect(result).toBe(false)
    })
  })
})
