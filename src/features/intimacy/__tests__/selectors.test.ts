import { describe, it, expect } from 'vitest'
import {
  getCategoryDisplayName,
  getDifficultyDisplayName,
  getBoundaryStatusDisplay,
  getPhaseDisplayName,
  formatDateForDisplay,
  formatDateShort,
  hasConsentRequirement,
  getConsentMessage,
  filterCardsByPhase,
  filterCardsByDifficulty,
  filterCardsByCategory,
  getBoundariesByStatus,
  getBoundaryCounts,
  getSessionSummary,
  hasReflection,
  isValidDate,
  isToday,
  isFutureDate
} from '../selectors'
import type { IntimacyCard, BoundaryItemRecord } from '../schemas'

describe('Intimacy Selectors', () => {
  describe('Display Helpers', () => {
    it('should return correct category display names', () => {
      expect(getCategoryDisplayName('talk')).toBe('Conversation')
      expect(getCategoryDisplayName('affection')).toBe('Affection')
      expect(getCategoryDisplayName('quality_time')).toBe('Quality Time')
      expect(getCategoryDisplayName('desire_exploration')).toBe('Desire Exploration')
      expect(getCategoryDisplayName('acts')).toBe('Acts of Service')
      expect(getCategoryDisplayName('unknown')).toBe('unknown')
    })

    it('should return correct difficulty display names', () => {
      expect(getDifficultyDisplayName(1)).toBe('Gentle')
      expect(getDifficultyDisplayName(2)).toBe('Moderate')
      expect(getDifficultyDisplayName(3)).toBe('Intense')
      expect(getDifficultyDisplayName(4)).toBe('Unknown')
    })

    it('should return correct boundary status display names', () => {
      expect(getBoundaryStatusDisplay('yes')).toBe('Yes')
      expect(getBoundaryStatusDisplay('maybe')).toBe('Maybe')
      expect(getBoundaryStatusDisplay('no')).toBe('No')
      expect(getBoundaryStatusDisplay('unknown')).toBe('unknown')
    })

    it('should return correct phase display names', () => {
      expect(getPhaseDisplayName('menstrual')).toBe('Menstrual')
      expect(getPhaseDisplayName('follicular')).toBe('Follicular')
      expect(getPhaseDisplayName('ovulation')).toBe('Ovulation')
      expect(getPhaseDisplayName('luteal')).toBe('Luteal')
      expect(getPhaseDisplayName('unknown')).toBe('unknown')
    })
  })

  describe('Date Helpers', () => {
    it('should format date for display', () => {
      const dateString = '2024-01-15'
      const formatted = formatDateForDisplay(dateString)
      expect(formatted).toContain('January')
      expect(formatted).toContain('2024')
    })

    it('should format date short', () => {
      const dateString = '2024-01-15'
      const formatted = formatDateShort(dateString)
      expect(formatted).toContain('Jan')
      expect(formatted).toContain('15')
    })

    it('should validate dates correctly', () => {
      expect(isValidDate('2024-01-15')).toBe(true)
      expect(isValidDate('invalid-date')).toBe(false)
      expect(isValidDate('')).toBe(false)
    })

    it('should check if date is today', () => {
      const today = new Date().toISOString().split('T')[0]
      expect(isToday(today)).toBe(true)
      expect(isToday('2024-01-15')).toBe(false)
    })

    it('should check if date is in future', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowString = tomorrow.toISOString().split('T')[0]
      
      expect(isFutureDate(tomorrowString)).toBe(true)
      expect(isFutureDate('2020-01-01')).toBe(false)
    })
  })

  describe('Consent Helpers', () => {
    const consentCard: IntimacyCard = {
      id: '1',
      category: 'affection',
      difficulty: 1,
      text: 'Test card',
      phase_tags: [],
      active: true
    }

    const nonConsentCard: IntimacyCard = {
      id: '2',
      category: 'talk',
      difficulty: 1,
      text: 'Test card',
      phase_tags: [],
      active: true
    }

    it('should identify consent requirements correctly', () => {
      expect(hasConsentRequirement(consentCard)).toBe(true)
      expect(hasConsentRequirement(nonConsentCard)).toBe(false)
    })

    it('should return consent message for consent-required cards', () => {
      expect(getConsentMessage(consentCard)).toBe('Ask first; stop on no/neutral.')
      expect(getConsentMessage(nonConsentCard)).toBe('')
    })
  })

  describe('Card Filtering', () => {
    const cards: IntimacyCard[] = [
      {
        id: '1',
        category: 'talk',
        difficulty: 1,
        text: 'Test card 1',
        phase_tags: ['menstrual'],
        active: true
      },
      {
        id: '2',
        category: 'affection',
        difficulty: 2,
        text: 'Test card 2',
        phase_tags: ['follicular', 'ovulation'],
        active: true
      },
      {
        id: '3',
        category: 'talk',
        difficulty: 3,
        text: 'Test card 3',
        phase_tags: [],
        active: true
      }
    ]

    it('should filter cards by phase', () => {
      const menstrualCards = filterCardsByPhase(cards, 'menstrual')
      expect(menstrualCards).toHaveLength(2) // Card 1 and Card 3 (empty phase_tags)
      
      const follicularCards = filterCardsByPhase(cards, 'follicular')
      expect(follicularCards).toHaveLength(2) // Card 2 and Card 3
    })

    it('should filter cards by difficulty', () => {
      const difficulty1Cards = filterCardsByDifficulty(cards, 1)
      expect(difficulty1Cards).toHaveLength(1)
      expect(difficulty1Cards[0].id).toBe('1')
    })

    it('should filter cards by category', () => {
      const talkCards = filterCardsByCategory(cards, 'talk')
      expect(talkCards).toHaveLength(2)
      expect(talkCards.every(card => card.category === 'talk')).toBe(true)
    })
  })

  describe('Boundary Helpers', () => {
    const boundaries: BoundaryItemRecord[] = [
      {
        id: '1',
        user_id: 'user1',
        label: 'Hugs are welcome',
        status: 'yes',
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      },
      {
        id: '2',
        user_id: 'user1',
        label: 'Ask before touching',
        status: 'maybe',
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      },
      {
        id: '3',
        user_id: 'user1',
        label: 'No physical contact',
        status: 'no',
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      }
    ]

    it('should filter boundaries by status', () => {
      const yesBoundaries = getBoundariesByStatus(boundaries, 'yes')
      expect(yesBoundaries).toHaveLength(1)
      expect(yesBoundaries[0].status).toBe('yes')
    })

    it('should count boundaries by status', () => {
      const counts = getBoundaryCounts(boundaries)
      expect(counts).toEqual({
        yes: 1,
        maybe: 1,
        no: 1
      })
    })
  })

  describe('Session Helpers', () => {
    it('should generate session summary', () => {
      const session = {
        id: '1',
        user_id: 'user1',
        date: '2024-01-15',
        selected_card_id: 'card1',
        shared_with_partner: true,
        reflection: 'Great experience',
        created_at: '2024-01-15',
        selected_card: {
          id: 'card1',
          category: 'talk',
          difficulty: 1,
          text: 'Test card',
          phase_tags: [],
          active: true
        }
      }

      const summary = getSessionSummary(session)
      expect(summary).toBe('Conversation - Gentle')
    })

    it('should handle session without card', () => {
      const session = {
        id: '1',
        user_id: 'user1',
        date: '2024-01-15',
        selected_card_id: 'card1',
        shared_with_partner: true,
        reflection: null,
        created_at: '2024-01-15'
      }

      const summary = getSessionSummary(session)
      expect(summary).toBe('No card selected today')
    })

    it('should check if session has reflection', () => {
      const sessionWithReflection = {
        reflection: 'Great experience'
      }

      const sessionWithoutReflection = {
        reflection: null
      }

      expect(hasReflection(sessionWithReflection)).toBe(true)
      expect(hasReflection(sessionWithoutReflection)).toBe(false)
    })
  })
})