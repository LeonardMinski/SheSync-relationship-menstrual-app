import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getPartnerSharedData } from '../services'
import type { PartnerSharedData, PartnerLink } from '../types'

// Mock fetch
global.fetch = vi.fn()

describe('Partner Privacy Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getPartnerSharedData', () => {
    it('should return null data when partner has disabled sharing', async () => {
      const mockResponse = {
        data: {
          sharedData: {
            partnerName: 'Test Partner',
            privacySettings: {
              shareWithPartner: false,
              shareCyclePhase: false,
              shareMood: false,
              shareFantasyVault: false,
              shareIntimacyDeck: false
            },
            recentActivity: []
          },
          partnerLink: {
            id: 'link-1',
            user_id: 'user-1',
            partner_user_id: 'partner-1',
            status: 'active',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        }
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await getPartnerSharedData('user-1')

      expect(result.sharedData).toBeDefined()
      expect(result.sharedData?.privacySettings.shareWithPartner).toBe(false)
      expect(result.sharedData?.todayCycle).toBeUndefined()
      expect(result.sharedData?.todayIntimacy).toBeUndefined()
      expect(result.sharedData?.todayFantasy).toBeUndefined()
    })

    it('should return cycle data when partner shares cycle phase and mood', async () => {
      const mockResponse = {
        data: {
          sharedData: {
            partnerName: 'Test Partner',
            privacySettings: {
              shareWithPartner: true,
              shareCyclePhase: true,
              shareMood: true,
              shareFantasyVault: false,
              shareIntimacyDeck: false
            },
            todayCycle: {
              phase: 'ovulation',
              mood: 8,
              energy: 7,
              libido: 9,
              stress: 3,
              symptoms: ['increased energy', 'heightened senses'],
              notes: 'Feeling great today!'
            },
            recentActivity: []
          },
          partnerLink: {
            id: 'link-1',
            user_id: 'user-1',
            partner_user_id: 'partner-1',
            status: 'active',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        }
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await getPartnerSharedData('user-1')

      expect(result.sharedData?.privacySettings.shareCyclePhase).toBe(true)
      expect(result.sharedData?.privacySettings.shareMood).toBe(true)
      expect(result.sharedData?.todayCycle).toBeDefined()
      expect(result.sharedData?.todayCycle?.phase).toBe('ovulation')
      expect(result.sharedData?.todayCycle?.mood).toBe(8)
    })

    it('should return intimacy data when partner shares intimacy deck', async () => {
      const mockResponse = {
        data: {
          sharedData: {
            partnerName: 'Test Partner',
            privacySettings: {
              shareWithPartner: true,
              shareCyclePhase: false,
              shareMood: false,
              shareFantasyVault: false,
              shareIntimacyDeck: true
            },
            todayIntimacy: {
              id: 'session-1',
              date: '2024-01-01',
              shared_with_partner: true,
              reflection: 'This was really meaningful for us',
              selected_card: {
                id: 'card-1',
                category: 'talk',
                difficulty: 2,
                text: 'Share something you appreciate about your partner',
                phase_tags: ['ovulation']
              }
            },
            recentActivity: []
          },
          partnerLink: {
            id: 'link-1',
            user_id: 'user-1',
            partner_user_id: 'partner-1',
            status: 'active',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        }
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await getPartnerSharedData('user-1')

      expect(result.sharedData?.privacySettings.shareIntimacyDeck).toBe(true)
      expect(result.sharedData?.todayIntimacy).toBeDefined()
      expect(result.sharedData?.todayIntimacy?.shared_with_partner).toBe(true)
      expect(result.sharedData?.todayIntimacy?.reflection).toBe('This was really meaningful for us')
    })

    it('should return fantasy data when partner shares fantasy vault', async () => {
      const mockResponse = {
        data: {
          sharedData: {
            partnerName: 'Test Partner',
            privacySettings: {
              shareWithPartner: true,
              shareCyclePhase: false,
              shareMood: false,
              shareFantasyVault: true,
              shareIntimacyDeck: false
            },
            todayFantasy: {
              id: 'fantasy-1',
              title: 'Romantic Evening',
              content: 'A candlelit dinner followed by...',
              type: 'text',
              tags: ['romance', 'intimacy'],
              createdAt: '2024-01-01T12:00:00Z'
            },
            recentActivity: []
          },
          partnerLink: {
            id: 'link-1',
            user_id: 'user-1',
            partner_user_id: 'partner-1',
            status: 'active',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        }
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await getPartnerSharedData('user-1')

      expect(result.sharedData?.privacySettings.shareFantasyVault).toBe(true)
      expect(result.sharedData?.todayFantasy).toBeDefined()
      expect(result.sharedData?.todayFantasy?.title).toBe('Romantic Evening')
      expect(result.sharedData?.todayFantasy?.type).toBe('text')
    })

    it('should return null when no partner link exists', async () => {
      const mockResponse = {
        data: {
          sharedData: null,
          partnerLink: null
        }
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await getPartnerSharedData('user-1')

      expect(result.sharedData).toBeNull()
      expect(result.partnerLink).toBeNull()
    })

    it('should handle API errors gracefully', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('API Error'))

      const result = await getPartnerSharedData('user-1')

      expect(result.sharedData).toBeNull()
      expect(result.partnerLink).toBeNull()
    })

    it('should handle non-ok responses', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      const result = await getPartnerSharedData('user-1')

      expect(result.sharedData).toBeNull()
      expect(result.partnerLink).toBeNull()
    })
  })
})
