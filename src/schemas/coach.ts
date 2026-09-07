import { z } from 'zod'

export const CoachContextSelectionSchema = z
  .object({
    dailyCheckIns: z.boolean(),
    cycleContext: z.boolean(),
    periodHistory: z.boolean(),
    recentObservations: z.boolean(),
  })
  .strict()

// Client never supplies owner_user_id — the server always derives it from
// the authenticated session.

export const CreateCoachConversationInputSchema = z.object({}).strict()

export const SendCoachMessageInputSchema = z
  .object({
    content: z.string().trim().min(1).max(4000),
    context: CoachContextSelectionSchema.optional(),
  })
  .strict()

export type CoachContextSelectionParsed = z.infer<typeof CoachContextSelectionSchema>
export type SendCoachMessageInputParsed = z.infer<typeof SendCoachMessageInputSchema>
