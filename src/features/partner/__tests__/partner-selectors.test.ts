import { describe, it, expect } from 'vitest'
import {
  formatDateShort,
  getPhaseDisplayName,
  getMoodEmoji,
  getCategoryDisplayName,
  getDifficultyDisplayName,
  getSessionSummary
} from '../selectors'

describe('Partner Selectors', () => {
  describe('formatDateShort', () => {
    it('should return "Today" for today\'s date', () => {
      const today = new Date().toISOString().split('T')[0]
      expect(formatDateShort(today)).toBe('Today')
    })

    it('should return "Yesterday" for yesterday\'s date', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]
      expect(formatDateShort(yesterdayStr)).toBe('Yesterday')
    })

    it('should return formatted date for other dates', () => {
      expect(formatDateShort('2024-01-15')).toBe('Jan 15')
      expect(formatDateShort('2024-12-25')).toBe('Dec 25')
    })
  })

  describe('getPhaseDisplayName', () => {
    it('should return proper display names for cycle phases', () => {
      expect(getPhaseDisplayName('menstrual')).toBe('Menstrual')
      expect(getPhaseDisplayName('follicular')).toBe('Follicular')
      expect(getPhaseDisplayName('ovulation')).toBe('Ovulation')
      expect(getPhaseDisplayName('luteal')).toBe('Luteal')
    })

    it('should return the input string for unknown phases', () => {
      expect(getPhaseDisplayName('unknown')).toBe('unknown')
    })
  })

  describe('getMoodEmoji', () => {
    describe('for cycle phases', () => {
      it('should return correct emojis for cycle phases', () => {
        expect(getMoodEmoji('menstrual')).toBe('🩸')
        expect(getMoodEmoji('follicular')).toBe('🌱')
        expect(getMoodEmoji('ovulation')).toBe('🌸')
        expect(getMoodEmoji('luteal')).toBe('🍂')
      })

      it('should return question mark for unknown phases', () => {
        expect(getMoodEmoji('unknown')).toBe('❓')
      })
    })

    describe('for mood values', () => {
      it('should return correct emojis for high moods', () => {
        expect(getMoodEmoji(10)).toBe('😍')
        expect(getMoodEmoji(9)).toBe('😍')
      })

      it('should return correct emojis for good moods', () => {
        expect(getMoodEmoji(8)).toBe('😊')
        expect(getMoodEmoji(7)).toBe('😊')
      })

      it('should return correct emojis for neutral moods', () => {
        expect(getMoodEmoji(6)).toBe('😐')
        expect(getMoodEmoji(5)).toBe('😐')
      })

      it('should return correct emojis for low moods', () => {
        expect(getMoodEmoji(4)).toBe('😔')
        expect(getMoodEmoji(3)).toBe('😔')
      })

      it('should return correct emojis for very low moods', () => {
        expect(getMoodEmoji(2)).toBe('😢')
        expect(getMoodEmoji(1)).toBe('😢')
      })
    })
  })

  describe('getCategoryDisplayName', () => {
    it('should return proper display names for categories', () => {
      expect(getCategoryDisplayName('talk')).toBe('Conversation')
      expect(getCategoryDisplayName('affection')).toBe('Affection')
      expect(getCategoryDisplayName('quality_time')).toBe('Quality Time')
      expect(getCategoryDisplayName('desire_exploration')).toBe('Desire Exploration')
      expect(getCategoryDisplayName('acts')).toBe('Acts of Love')
    })

    it('should return the input string for unknown categories', () => {
      expect(getCategoryDisplayName('unknown')).toBe('unknown')
    })
  })

  describe('getDifficultyDisplayName', () => {
    it('should return proper display names for difficulties', () => {
      expect(getDifficultyDisplayName(1)).toBe('Easy')
      expect(getDifficultyDisplayName(2)).toBe('Medium')
      expect(getDifficultyDisplayName(3)).toBe('Advanced')
    })

    it('should return "Unknown" for unknown difficulties', () => {
      expect(getDifficultyDisplayName(0)).toBe('Unknown')
      expect(getDifficultyDisplayName(4)).toBe('Unknown')
    })
  })

  describe('getSessionSummary', () => {
    it('should return proper summary for session with card', () => {
      const session = {
        selected_card: {
          category: 'talk',
          difficulty: 2
        }
      }

      expect(getSessionSummary(session)).toBe('Conversation - Medium')
    })

    it('should return "No card selected" for session without card', () => {
      const session = {}
      expect(getSessionSummary(session)).toBe('No card selected')

      const session2 = { selected_card: null }
      expect(getSessionSummary(session2)).toBe('No card selected')
    })

    it('should handle unknown categories and difficulties', () => {
      const session = {
        selected_card: {
          category: 'unknown',
          difficulty: 5
        }
      }

      expect(getSessionSummary(session)).toBe('unknown - Unknown')
    })
  })
})
