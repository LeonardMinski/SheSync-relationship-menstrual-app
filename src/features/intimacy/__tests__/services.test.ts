import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  listBoundaries, 
  upsertBoundary, 
  deleteBoundary,
  listCards,
  getTodayCard,
  getTodaySession,
  upsertSession,
  shareSession
} from '../services'
import type { BoundaryItem, IntimacyCard } from '../schemas'

// Mock Supabase client
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
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
              label: 'Test Boundary',
              status: 'yes',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z'
            },
            error: null
          }))
        }))
      })),
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: '123e4567-e89b-12d3-a456-426614174000',
              user_id: '456e7890-e89b-12d3-a456-426614174001',
              label: 'Updated Boundary',
              status: 'maybe',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-02T00:00:00Z'
            },
            error: null
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          error: null
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
}))

describe('Intimacy Services', () => {
  const mockUserId = '456e7890-e89b-12d3-a456-426614174001'
  const mockBoundaryId = '123e4567-e89b-12d3-a456-426614174000'
  const mockDate = '2024-01-01'
  
  const mockBoundary: BoundaryItem = {
    label: 'Test Boundary',
    status: 'yes'
  }

  const mockIntimacyCard: IntimacyCard = {
    id: 'card-123',
    category: 'talk',
    difficulty: 1,
    text: 'Share one highlight from your day',
    phase_tags: ['any'],
    active: true
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listBoundaries', () => {
    it('should return empty array when no boundaries exist', async () => {
      const boundaries = await listBoundaries(mockUserId)
      expect(boundaries).toEqual([])
    })

    it('should handle errors gracefully', async () => {
      // Mock error response
      const mockSupabase = await import('@/lib/supabaseClient')
      vi.mocked(mockSupabase.supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              data: null,
              error: { message: 'Database error' }
            }))
          }))
        }))
      } as any)

      const boundaries = await listBoundaries(mockUserId)
      expect(boundaries).toEqual([])
    })
  })

  describe('upsertBoundary', () => {
    it('should create a new boundary', async () => {
      const result = await upsertBoundary(mockUserId, mockBoundary)
      
      expect(result).toBeDefined()
      expect(result?.label).toBe('Test Boundary')
      expect(result?.status).toBe('yes')
    })

    it('should update an existing boundary', async () => {
      const updatedBoundary: BoundaryItem & { id: string } = {
        id: mockBoundaryId,
        label: 'Updated Boundary',
        status: 'maybe'
      }

      const result = await upsertBoundary(mockUserId, updatedBoundary)
      
      expect(result).toBeDefined()
      expect(result?.label).toBe('Updated Boundary')
      expect(result?.status).toBe('maybe')
    })

    it('should handle upsert errors', async () => {
      // Mock error response
      const mockSupabase = await import('@/lib/supabaseClient')
      vi.mocked(mockSupabase.supabase.from).mockReturnValue({
        upsert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: { message: 'Upsert failed' }
            }))
          }))
        }))
      } as any)

      const result = await upsertBoundary(mockUserId, mockBoundary)
      expect(result).toBeNull()
    })
  })

  describe('deleteBoundary', () => {
    it('should delete a boundary', async () => {
      const result = await deleteBoundary(mockUserId, mockBoundaryId)
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

      const result = await deleteBoundary(mockUserId, mockBoundaryId)
      expect(result).toBe(false)
    })
  })

  describe('listCards', () => {
    it('should return empty array when no cards exist', async () => {
      const cards = await listCards()
      expect(cards).toEqual([])
    })

    it('should filter cards by category', async () => {
      // Mock cards with different categories
      const mockCards = [
        { ...mockIntimacyCard, category: 'talk' },
        { ...mockIntimacyCard, category: 'affection' }
      ]
      
      const mockSupabase = await import('@/lib/supabaseClient')
      vi.mocked(mockSupabase.supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              data: mockCards.filter(card => card.category === 'talk'),
              error: null
            }))
          }))
        }))
      } as any)

      const cards = await listCards({ category: 'talk' })
      expect(cards).toHaveLength(1)
      expect(cards[0].category).toBe('talk')
    })

    it('should handle errors gracefully', async () => {
      // Mock error response
      const mockSupabase = await import('@/lib/supabaseClient')
      vi.mocked(mockSupabase.supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              data: null,
              error: { message: 'Database error' }
            }))
          }))
        }))
      } as any)

      const cards = await listCards()
      expect(cards).toEqual([])
    })
  })

  describe('getTodayCard', () => {
    it('should return fallback card when no cards exist', async () => {
      const mockSupabase = await import('@/lib/supabaseClient')
      vi.mocked(mockSupabase.supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              data: [],
              error: null
            }))
          }))
        }))
      } as any)

      const card = await getTodayCard(mockUserId)
      expect(card).toBeDefined()
      expect(card?.id).toMatch(/fallback-\d+/)
      expect(card?.category).toBeDefined()
    })

    it('should return random card from available cards', async () => {
      const mockCards = [
        mockIntimacyCard,
        { ...mockIntimacyCard, id: 'card-456', text: 'Different card' }
      ]
      
      const mockSupabase = await import('@/lib/supabaseClient')
      vi.mocked(mockSupabase.supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              data: mockCards,
              error: null
            }))
          }))
        }))
      } as any)

      const card = await getTodayCard(mockUserId)
      expect(card).toBeDefined()
      expect(mockCards).toContainEqual(card)
    })
  })

  describe('getTodaySession', () => {
    it('should return null when no session exists', async () => {
      const mockSupabase = await import('@/lib/supabaseClient')
      vi.mocked(mockSupabase.supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: null,
                error: { code: 'PGRST116' } // No rows returned
              }))
            }))
          }))
        }))
      } as any)

      const session = await getTodaySession(mockUserId, mockDate)
      expect(session).toBeNull()
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
                error: { message: 'Database error' }
              }))
            }))
          }))
        }))
      } as any)

      const session = await getTodaySession(mockUserId, mockDate)
      expect(session).toBeNull()
    })
  })

  describe('shareSession', () => {
    it('should update session share status', async () => {
      const result = await shareSession(mockUserId, mockDate, true)
      expect(result).toBe(true)
    })

    it('should handle update errors', async () => {
      // Mock error response
      const mockSupabase = await import('@/lib/supabaseClient')
      vi.mocked(mockSupabase.supabase.from).mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              error: { message: 'Update failed' }
            }))
          }))
        }))
      } as any)

      const result = await shareSession(mockUserId, mockDate, true)
      expect(result).toBe(false)
    })
  })
})
