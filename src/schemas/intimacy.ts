import { z } from 'zod'

// =====================================================
// BOUNDARY ITEM SCHEMAS
// =====================================================

export const BoundaryItemSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  status: z.enum(['yes', 'maybe', 'no'], {
    errorMap: () => ({ message: 'Status must be yes, maybe, or no' })
  })
})

export const UpdateBoundaryActionSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(1, 'Label is required'),
  status: z.enum(['yes', 'maybe', 'no'])
})

// =====================================================
// INTIMACY SESSION SCHEMAS
// =====================================================

export const CreateSessionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  selectedCardId: z.string().uuid('Invalid card ID'),
  share: z.boolean().optional(),
  reflection: z.string().optional()
})

export const ChooseTodayCardActionSchema = z.object({
  selectedCardId: z.string().uuid('Invalid card ID'),
  reflection: z.string().optional()
})

export const ToggleShareActionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  shared: z.boolean()
})

// =====================================================
// CARD SELECTION SCHEMAS
// =====================================================

export const GetTodayCardParamsSchema = z.object({
  phase: z.enum(['menstrual', 'follicular', 'ovulation', 'luteal']).optional(),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  category: z.enum(['talk', 'affection', 'quality_time', 'desire_exploration', 'acts']).optional()
})

// =====================================================
// TYPE EXPORTS
// =====================================================

export type BoundaryItem = z.infer<typeof BoundaryItemSchema>
export type CreateSession = z.infer<typeof CreateSessionSchema>
export type GetTodayCardParams = z.infer<typeof GetTodayCardParamsSchema>
export type UpdateBoundaryAction = z.infer<typeof UpdateBoundaryActionSchema>
export type ChooseTodayCardAction = z.infer<typeof ChooseTodayCardActionSchema>
export type ToggleShareAction = z.infer<typeof ToggleShareActionSchema>

// =====================================================
// DATABASE TYPES
// =====================================================

export interface PartnerLink {
  id: string
  user_id: string
  partner_user_id: string
  status: string
  created_at: string
}

export interface BoundaryItemRecord {
  id: string
  user_id: string
  label: string
  status: 'yes' | 'maybe' | 'no'
  created_at: string
  updated_at: string
}

export interface IntimacyCard {
  id: string
  category: 'talk' | 'affection' | 'quality_time' | 'desire_exploration' | 'acts'
  difficulty: 1 | 2 | 3
  text: string
  phase_tags: string[]
  active: boolean
}

export interface IntimacySession {
  id: string
  user_id: string
  date: string
  selected_card_id: string
  shared_with_partner: boolean
  reflection: string | null
  created_at: string
  // Joined data
  selected_card?: IntimacyCard
}