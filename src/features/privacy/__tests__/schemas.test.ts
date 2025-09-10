import { describe, it, expect } from 'vitest'
import {
  PrivacySettingsSchema,
  UpdatePrivacySettingsSchema,
  DEFAULT_PRIVACY_SETTINGS,
  PRIVACY_SETTING_DEFINITIONS,
} from '../schemas'

describe('Privacy Settings Schemas', () => {
  describe('PrivacySettingsSchema', () => {
    it('should validate complete privacy settings', () => {
      const validSettings = {
        share_with_partner: true,
        share_cycle_phase: false,
        share_mood: true,
        share_fantasy_vault: false,
        share_intimacy_deck: true,
      }

      const result = PrivacySettingsSchema.safeParse(validSettings)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validSettings)
      }
    })

    it('should apply defaults for missing fields', () => {
      const partialSettings = {
        share_with_partner: true,
        share_cycle_phase: false,
      }

      const result = PrivacySettingsSchema.safeParse(partialSettings)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.share_with_partner).toBe(true)
        expect(result.data.share_cycle_phase).toBe(false)
        expect(result.data.share_mood).toBe(false) // default
        expect(result.data.share_fantasy_vault).toBe(false) // default
        expect(result.data.share_intimacy_deck).toBe(false) // default
      }
    })

    it('should reject invalid boolean values', () => {
      const invalidSettings = {
        share_with_partner: 'true', // string instead of boolean
        share_cycle_phase: false,
        share_mood: true,
        share_fantasy_vault: false,
        share_intimacy_deck: true,
      }

      const result = PrivacySettingsSchema.safeParse(invalidSettings)
      expect(result.success).toBe(false)
    })

    it('should reject extra fields', () => {
      const settingsWithExtra = {
        share_with_partner: true,
        share_cycle_phase: false,
        share_mood: true,
        share_fantasy_vault: false,
        share_intimacy_deck: true,
        extra_field: 'should not be here',
      }

      const result = PrivacySettingsSchema.safeParse(settingsWithExtra)
      expect(result.success).toBe(false)
    })
  })

  describe('UpdatePrivacySettingsSchema', () => {
    it('should validate partial updates', () => {
      const partialUpdate = {
        share_with_partner: true,
        share_mood: false,
      }

      const result = UpdatePrivacySettingsSchema.safeParse(partialUpdate)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(partialUpdate)
      }
    })

    it('should allow empty object', () => {
      const emptyUpdate = {}

      const result = UpdatePrivacySettingsSchema.safeParse(emptyUpdate)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({})
      }
    })

    it('should reject invalid boolean values', () => {
      const invalidUpdate = {
        share_with_partner: 'true', // string instead of boolean
      }

      const result = UpdatePrivacySettingsSchema.safeParse(invalidUpdate)
      expect(result.success).toBe(false)
    })
  })

  describe('DEFAULT_PRIVACY_SETTINGS', () => {
    it('should have all required fields set to false', () => {
      expect(DEFAULT_PRIVACY_SETTINGS).toEqual({
        share_with_partner: false,
        share_cycle_phase: false,
        share_mood: false,
        share_fantasy_vault: false,
        share_intimacy_deck: false,
      })
    })

    it('should be valid according to PrivacySettingsSchema', () => {
      const result = PrivacySettingsSchema.safeParse(DEFAULT_PRIVACY_SETTINGS)
      expect(result.success).toBe(true)
    })
  })

  describe('PRIVACY_SETTING_DEFINITIONS', () => {
    it('should have all required privacy settings', () => {
      const expectedKeys = [
        'share_with_partner',
        'share_cycle_phase',
        'share_mood',
        'share_fantasy_vault',
        'share_intimacy_deck',
      ]

      const actualKeys = PRIVACY_SETTING_DEFINITIONS.map(def => def.key)
      expect(actualKeys).toEqual(expect.arrayContaining(expectedKeys))
      expect(actualKeys).toHaveLength(expectedKeys.length)
    })

    it('should have valid categories', () => {
      const validCategories = ['partner_sharing', 'data_sharing']
      
      PRIVACY_SETTING_DEFINITIONS.forEach(def => {
        expect(validCategories).toContain(def.category)
      })
    })

    it('should have non-empty labels and descriptions', () => {
      PRIVACY_SETTING_DEFINITIONS.forEach(def => {
        expect(def.label).toBeTruthy()
        expect(def.description).toBeTruthy()
        expect(def.label.length).toBeGreaterThan(0)
        expect(def.description.length).toBeGreaterThan(0)
      })
    })

    it('should have unique keys', () => {
      const keys = PRIVACY_SETTING_DEFINITIONS.map(def => def.key)
      const uniqueKeys = new Set(keys)
      expect(uniqueKeys.size).toBe(keys.length)
    })
  })
})


