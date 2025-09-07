import { describe, it, expect } from 'vitest'
import {
  BoundaryItemSchema,
  CreateSessionSchema,
  GetTodayCardParamsSchema,
  UpdateBoundaryActionSchema,
  ChooseTodayCardActionSchema,
  ToggleShareActionSchema
} from '../schemas'

describe('Intimacy Schemas', () => {
  describe('BoundaryItemSchema', () => {
    it('should validate valid boundary item', () => {
      const validBoundary = {
        label: 'Hugs are welcome',
        status: 'yes'
      }
      
      const result = BoundaryItemSchema.safeParse(validBoundary)
      expect(result.success).toBe(true)
    })

    it('should reject empty label', () => {
      const invalidBoundary = {
        label: '',
        status: 'yes'
      }
      
      const result = BoundaryItemSchema.safeParse(invalidBoundary)
      expect(result.success).toBe(false)
    })

    it('should reject invalid status', () => {
      const invalidBoundary = {
        label: 'Test boundary',
        status: 'invalid'
      }
      
      const result = BoundaryItemSchema.safeParse(invalidBoundary)
      expect(result.success).toBe(false)
    })
  })

  describe('CreateSessionSchema', () => {
    it('should validate valid session data', () => {
      const validSession = {
        date: '2024-01-15',
        selectedCardId: '123e4567-e89b-12d3-a456-426614174000',
        share: true,
        reflection: 'This was wonderful'
      }
      
      const result = CreateSessionSchema.safeParse(validSession)
      expect(result.success).toBe(true)
    })

    it('should reject invalid date format', () => {
      const invalidSession = {
        date: '15-01-2024',
        selectedCardId: '123e4567-e89b-12d3-a456-426614174000'
      }
      
      const result = CreateSessionSchema.safeParse(invalidSession)
      expect(result.success).toBe(false)
    })

    it('should reject invalid UUID', () => {
      const invalidSession = {
        date: '2024-01-15',
        selectedCardId: 'not-a-uuid'
      }
      
      const result = CreateSessionSchema.safeParse(invalidSession)
      expect(result.success).toBe(false)
    })
  })

  describe('GetTodayCardParamsSchema', () => {
    it('should validate valid parameters', () => {
      const validParams = {
        phase: 'menstrual',
        difficulty: 1,
        category: 'talk'
      }
      
      const result = GetTodayCardParamsSchema.safeParse(validParams)
      expect(result.success).toBe(true)
    })

    it('should validate empty parameters', () => {
      const result = GetTodayCardParamsSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should reject invalid phase', () => {
      const invalidParams = {
        phase: 'invalid-phase'
      }
      
      const result = GetTodayCardParamsSchema.safeParse(invalidParams)
      expect(result.success).toBe(false)
    })

    it('should reject invalid difficulty', () => {
      const invalidParams = {
        difficulty: 5
      }
      
      const result = GetTodayCardParamsSchema.safeParse(invalidParams)
      expect(result.success).toBe(false)
    })

    it('should reject invalid category', () => {
      const invalidParams = {
        category: 'invalid-category'
      }
      
      const result = GetTodayCardParamsSchema.safeParse(invalidParams)
      expect(result.success).toBe(false)
    })
  })

  describe('UpdateBoundaryActionSchema', () => {
    it('should validate valid boundary update', () => {
      const validUpdate = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        label: 'Updated boundary',
        status: 'maybe'
      }
      
      const result = UpdateBoundaryActionSchema.safeParse(validUpdate)
      expect(result.success).toBe(true)
    })

    it('should validate without id (for new boundaries)', () => {
      const validUpdate = {
        label: 'New boundary',
        status: 'no'
      }
      
      const result = UpdateBoundaryActionSchema.safeParse(validUpdate)
      expect(result.success).toBe(true)
    })
  })

  describe('ChooseTodayCardActionSchema', () => {
    it('should validate valid card selection', () => {
      const validSelection = {
        selectedCardId: '123e4567-e89b-12d3-a456-426614174000',
        reflection: 'This card resonated with me'
      }
      
      const result = ChooseTodayCardActionSchema.safeParse(validSelection)
      expect(result.success).toBe(true)
    })

    it('should validate without reflection', () => {
      const validSelection = {
        selectedCardId: '123e4567-e89b-12d3-a456-426614174000'
      }
      
      const result = ChooseTodayCardActionSchema.safeParse(validSelection)
      expect(result.success).toBe(true)
    })
  })

  describe('ToggleShareActionSchema', () => {
    it('should validate valid share toggle', () => {
      const validToggle = {
        date: '2024-01-15',
        shared: true
      }
      
      const result = ToggleShareActionSchema.safeParse(validToggle)
      expect(result.success).toBe(true)
    })

    it('should reject invalid date format', () => {
      const invalidToggle = {
        date: '15-01-2024',
        shared: false
      }
      
      const result = ToggleShareActionSchema.safeParse(invalidToggle)
      expect(result.success).toBe(false)
    })
  })
})