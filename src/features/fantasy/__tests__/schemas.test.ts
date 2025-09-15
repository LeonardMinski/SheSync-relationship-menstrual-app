import { describe, it, expect } from 'vitest'
import { 
  FantasyEntrySchema, 
  CreateFantasyActionSchema, 
  UpdateFantasyActionSchema,
  DeleteFantasyActionSchema,
  type FantasyEntry,
  type FantasyEntryRecord
} from '../schemas'

describe('Fantasy Schemas', () => {
  describe('FantasyEntrySchema', () => {
    it('should validate a valid fantasy entry', () => {
      const validEntry: FantasyEntry = {
        title: 'Test Fantasy',
        content_text: 'This is a test fantasy entry',
        content_url: 'https://example.com/image.jpg',
        kind: 'text',
        tags: ['romantic', 'test'],
        comfort: 3,
        share_status: 'hidden',
        redacted: false
      }

      const result = FantasyEntrySchema.safeParse(validEntry)
      expect(result.success).toBe(true)
    })

    it('should reject entry without title', () => {
      const invalidEntry = {
        content_text: 'This is a test fantasy entry',
        kind: 'text',
        comfort: 3,
        share_status: 'hidden'
      }

      const result = FantasyEntrySchema.safeParse(invalidEntry)
      expect(result.success).toBe(false)
    })

    it('should reject entry with invalid kind', () => {
      const invalidEntry = {
        title: 'Test Fantasy',
        content_text: 'This is a test fantasy entry',
        kind: 'invalid',
        comfort: 3,
        share_status: 'hidden'
      }

      const result = FantasyEntrySchema.safeParse(invalidEntry)
      expect(result.success).toBe(false)
    })

    it('should reject entry with invalid comfort level', () => {
      const invalidEntry = {
        title: 'Test Fantasy',
        content_text: 'This is a test fantasy entry',
        kind: 'text',
        comfort: 6, // Invalid: should be 1-5
        share_status: 'hidden'
      }

      const result = FantasyEntrySchema.safeParse(invalidEntry)
      expect(result.success).toBe(false)
    })

    it('should reject entry with invalid share status', () => {
      const invalidEntry = {
        title: 'Test Fantasy',
        content_text: 'This is a test fantasy entry',
        kind: 'text',
        comfort: 3,
        share_status: 'invalid'
      }

      const result = FantasyEntrySchema.safeParse(invalidEntry)
      expect(result.success).toBe(false)
    })
  })

  describe('CreateFantasyActionSchema', () => {
    it('should validate a valid create action', () => {
      const validAction = {
        title: 'New Fantasy',
        content_text: 'Creating a new fantasy entry',
        kind: 'moodboard',
        tags: ['creative'],
        comfort: 4,
        share_status: 'tease',
        redacted: false
      }

      const result = CreateFantasyActionSchema.safeParse(validAction)
      expect(result.success).toBe(true)
    })

    it('should apply default values', () => {
      const minimalAction = {
        title: 'Minimal Fantasy',
        content_text: 'Minimal content'
      }

      const result = CreateFantasyActionSchema.safeParse(minimalAction)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data.kind).toBe('text')
        expect(result.data.comfort).toBe(3)
        expect(result.data.share_status).toBe('hidden')
        expect(result.data.redacted).toBe(false)
      }
    })
  })

  describe('UpdateFantasyActionSchema', () => {
    it('should validate a valid update action', () => {
      const validAction = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Updated Fantasy',
        content_text: 'Updated content',
        kind: 'audio',
        comfort: 2,
        share_status: 'reveal'
      }

      const result = UpdateFantasyActionSchema.safeParse(validAction)
      expect(result.success).toBe(true)
    })

    it('should reject update action without valid UUID', () => {
      const invalidAction = {
        id: 'invalid-uuid',
        title: 'Updated Fantasy',
        content_text: 'Updated content'
      }

      const result = UpdateFantasyActionSchema.safeParse(invalidAction)
      expect(result.success).toBe(false)
    })
  })

  describe('DeleteFantasyActionSchema', () => {
    it('should validate a valid delete action', () => {
      const validAction = {
        id: '123e4567-e89b-12d3-a456-426614174000'
      }

      const result = DeleteFantasyActionSchema.safeParse(validAction)
      expect(result.success).toBe(true)
    })

    it('should reject delete action without valid UUID', () => {
      const invalidAction = {
        id: 'not-a-uuid'
      }

      const result = DeleteFantasyActionSchema.safeParse(invalidAction)
      expect(result.success).toBe(false)
    })
  })

  describe('FantasyEntryRecord interface', () => {
    it('should match expected database record structure', () => {
      const record: FantasyEntryRecord = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: '456e7890-e89b-12d3-a456-426614174001',
        title: 'Database Record',
        content_text: 'Content from database',
        content_url: null,
        kind: 'text',
        tags: ['database', 'test'],
        comfort: 3,
        share_status: 'hidden',
        redacted: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      // TypeScript compilation test - if this compiles, the interface is correct
      expect(record.id).toBe('123e4567-e89b-12d3-a456-426614174000')
      expect(record.kind).toBe('text')
      expect(record.comfort).toBe(3)
    })
  })
})
