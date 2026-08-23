import { z } from 'zod'

// =====================================================
// FANTASY ENTRY SCHEMAS
// =====================================================

export const FantasyEntrySchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  content_text: z.string().min(1, 'Content is required').max(2000, 'Content too long'),
  content_url: z.string().url().optional(),
  kind: z.enum(['text', 'moodboard', 'audio']).default('text'),
  tags: z.array(z.string()).default([]),
  comfort: z.number().min(1).max(5).default(3),
  share_status: z.enum(['hidden', 'tease', 'reveal']).default('hidden'),
  redacted: z.boolean().default(false)
})

export const CreateFantasyActionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content_text: z.string().min(1, 'Content is required'),
  content_url: z.string().url().optional(),
  kind: z.enum(['text', 'moodboard', 'audio']).default('text'),
  tags: z.array(z.string()).default([]),
  comfort: z.number().min(1).max(5).default(3),
  share_status: z.enum(['hidden', 'tease', 'reveal']).default('hidden'),
  redacted: z.boolean().default(false)
})

export const UpdateFantasyActionSchema = z.object({
  id: z.string().uuid('Invalid fantasy ID'),
  title: z.string().min(1, 'Title is required'),
  content_text: z.string().min(1, 'Content is required'),
  content_url: z.string().url().optional(),
  kind: z.enum(['text', 'moodboard', 'audio']).default('text'),
  tags: z.array(z.string()).default([]),
  comfort: z.number().min(1).max(5).default(3),
  share_status: z.enum(['hidden', 'tease', 'reveal']).default('hidden'),
  redacted: z.boolean().default(false)
})

export const DeleteFantasyActionSchema = z.object({
  id: z.string().uuid('Invalid fantasy ID')
})

// =====================================================
// TYPE EXPORTS
// =====================================================

export type FantasyEntry = z.infer<typeof FantasyEntrySchema>
export type CreateFantasyAction = z.infer<typeof CreateFantasyActionSchema>
export type UpdateFantasyAction = z.infer<typeof UpdateFantasyActionSchema>
export type DeleteFantasyAction = z.infer<typeof DeleteFantasyActionSchema>

// =====================================================
// DATABASE TYPES
// =====================================================

export interface FantasyEntryRecord {
  id: string
  user_id: string
  title: string
  content_text: string | null
  content_url: string | null
  kind: 'text' | 'moodboard' | 'audio'
  tags: string[]
  comfort: number
  share_status: 'hidden' | 'tease' | 'reveal'
  redacted: boolean
  created_at: string
  updated_at: string
}

