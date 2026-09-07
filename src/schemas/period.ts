import { z } from 'zod'

export const BleedingLevelSchema = z.enum(['spotting', 'light', 'medium', 'heavy'])
export const BleedingColourSchema = z.enum(['bright_red', 'dark_red', 'brown'])
export const ClotLevelSchema = z.enum(['none', 'small', 'medium', 'large'])
export const SymptomSeveritySchema = z.enum(['none', 'mild', 'moderate', 'severe'])
export const BowelChangeSchema = z.enum(['normal', 'loose', 'constipated', 'more_frequent'])
export const ActivityImpactSchema = z.enum(['none', 'some', 'significant'])

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD format')

const timeStringSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must use HH:MM format (24-hour)')

// Client never supplies user_id — the server always derives it from the
// authenticated session. Neither schema below has a user_id field.

// endDate is only for the "Add past period" flow — a completed historical
// period created directly with its end date already set, so it is never
// briefly "active". Omitting it is the normal Start Period path.
export const StartPeriodInputSchema = z
  .object({
    startDate: dateStringSchema.optional(),
    endDate: dateStringSchema.optional(),
  })
  .strict()
  .refine((data) => !data.endDate || !data.startDate || data.endDate >= data.startDate, {
    message: 'End date cannot be before the start date',
    path: ['endDate'],
  })

export const EndPeriodInputSchema = z
  .object({
    endDate: dateStringSchema.optional(),
  })
  .strict()

export const UpsertPeriodDayLogInputSchema = z
  .object({
    date: dateStringSchema.optional(),
    bleedingLevel: BleedingLevelSchema,
    bleedingColour: BleedingColourSchema.nullable().optional(),
    clots: ClotLevelSchema.optional(),
    cramps: z.number().int().min(0).max(10),
    lowerBackPain: z.number().int().min(0).max(10),
    headache: SymptomSeveritySchema,
    bloating: SymptomSeveritySchema,
    fatigue: z.number().int().min(0).max(10),
    nausea: SymptomSeveritySchema,
    bowelChanges: BowelChangeSchema,
    sleepQuality: z.number().int().min(1).max(5).nullable().optional(),
    mood: z.number().int().min(1).max(10),
    painReliefUsed: z.boolean(),
    painReliefMedication: z.string().trim().min(1).max(200).nullable().optional(),
    painReliefTime: timeStringSchema.nullable().optional(),
    activityImpact: ActivityImpactSchema,
    notes: z.string().trim().max(2000).nullable().optional(),
  })
  .strict()
  .refine((data) => data.painReliefUsed || !data.painReliefMedication, {
    message: 'painReliefMedication requires painReliefUsed to be true',
    path: ['painReliefMedication'],
  })
  .refine((data) => data.painReliefUsed || !data.painReliefTime, {
    message: 'painReliefTime requires painReliefUsed to be true',
    path: ['painReliefTime'],
  })

export type StartPeriodInputParsed = z.infer<typeof StartPeriodInputSchema>
export type EndPeriodInputParsed = z.infer<typeof EndPeriodInputSchema>
export type UpsertPeriodDayLogInputParsed = z.infer<typeof UpsertPeriodDayLogInputSchema>
