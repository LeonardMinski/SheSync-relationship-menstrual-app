import { z } from 'zod'

export const SupportContextSchema = z.enum(['overwhelmed', 'upset', 'difficult_period_day'])
export const SupportChoiceSchema = z.enum([
  'space_first',
  'reassure',
  'help_practically',
  'ask_what_i_need',
  'physical_affection',
  'quiet_company',
])
export const SupportBarrierSchema = z.enum(['advice_problem_solving', 'crowding', 'telling_to_relax'])

// Client never supplies owner_user_id — the server always derives it from
// the authenticated session.

export const UpsertSupportPreferenceInputSchema = z
  .object({
    context: SupportContextSchema,
    preferredSupports: z.array(SupportChoiceSchema).max(6),
    whatDoesNotHelp: z.array(SupportBarrierSchema).max(3),
    additionalContext: z.string().trim().max(500).nullable().optional(),
  })
  .strict()

export const ShareSupportPreferenceInputSchema = z
  .object({
    context: SupportContextSchema,
    isShared: z.boolean(),
  })
  .strict()

export const TranslationHelpChoiceSchema = z.enum([
  'space',
  'quiet_company',
  'practical_help',
  'reassurance',
  'physical_affection',
])
export const TranslationExclusionChoiceSchema = z.enum(['advice', 'questions_about_it', 'trying_to_fix_it'])

export const UpsertPartnerContextInputSchema = z
  .object({
    whatTheyShouldKnow: z.string().trim().max(1000),
    mightHelp: z.array(TranslationHelpChoiceSchema).max(5),
    dontNeed: z.array(TranslationExclusionChoiceSchema).max(3),
  })
  .strict()

export const SetPartnerContextStatusInputSchema = z
  .object({
    status: z.enum(['shared', 'revoked']),
  })
  .strict()

export const SendAppreciationInputSchema = z
  .object({
    content: z.string().trim().min(1).max(1000),
  })
  .strict()

export const RevealCategorySchema = z.enum([
  'affection',
  'future',
  'communication',
  'quality_time',
  'intimacy',
  'support',
])

export const StartSessionInputSchema = z
  .object({
    sessionType: z.enum(['weekly_us', 'mutual_reveal', 'repair']),
    category: RevealCategorySchema.optional(),
  })
  .strict()
  .refine((data) => (data.sessionType === 'mutual_reveal') === (data.category !== undefined), {
    message: 'category is required for mutual_reveal and must be absent otherwise',
    path: ['category'],
  })

export const SubmitSessionAnswerInputSchema = z
  .object({
    promptKey: z.string().trim().min(1).max(100),
    answerText: z.string().trim().min(1).max(2000),
  })
  .strict()

export const SaveRelationshipMemoryInputSchema = z
  .object({
    sourceType: z.enum([
      'support_preference',
      'weekly_us',
      'mutual_reveal',
      'repair',
      'appreciation',
      'partner_context',
    ]),
    sourceId: z.string().uuid(),
    title: z.string().trim().min(1).max(200),
    content: z.string().trim().min(1).max(2000),
  })
  .strict()

export const AddReplyInputSchema = z
  .object({
    sourceType: z.enum(['partner_context', 'appreciation', 'relationship_session', 'vault_spark']),
    sourceId: z.string().uuid(),
    content: z.string().trim().min(1).max(1000),
  })
  .strict()

export type UpsertSupportPreferenceInput = z.infer<typeof UpsertSupportPreferenceInputSchema>
export type ShareSupportPreferenceInput = z.infer<typeof ShareSupportPreferenceInputSchema>
export type UpsertPartnerContextInput = z.infer<typeof UpsertPartnerContextInputSchema>
export type SetPartnerContextStatusInput = z.infer<typeof SetPartnerContextStatusInputSchema>
export type SendAppreciationInput = z.infer<typeof SendAppreciationInputSchema>
export type StartSessionInput = z.infer<typeof StartSessionInputSchema>
export type SubmitSessionAnswerInput = z.infer<typeof SubmitSessionAnswerInputSchema>
export type SaveRelationshipMemoryInput = z.infer<typeof SaveRelationshipMemoryInputSchema>
export type AddReplyInput = z.infer<typeof AddReplyInputSchema>
