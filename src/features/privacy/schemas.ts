import { z } from 'zod'

// Privacy settings schema
export const PrivacySettingsSchema = z.object({
  share_with_partner: z.boolean().default(false),
  share_cycle_phase: z.boolean().default(false),
  share_mood: z.boolean().default(false),
  share_fantasy_vault: z.boolean().default(false),
  share_intimacy_deck: z.boolean().default(false),
}).strict()

// Update privacy settings schema
export const UpdatePrivacySettingsSchema = z.object({
  share_with_partner: z.boolean().optional(),
  share_cycle_phase: z.boolean().optional(),
  share_mood: z.boolean().optional(),
  share_fantasy_vault: z.boolean().optional(),
  share_intimacy_deck: z.boolean().optional(),
})

// Privacy setting item schema for UI
export const PrivacySettingItemSchema = z.object({
  key: z.enum(['share_with_partner', 'share_cycle_phase', 'share_mood', 'share_fantasy_vault', 'share_intimacy_deck']),
  label: z.string(),
  description: z.string(),
  category: z.enum(['partner_sharing', 'data_sharing']),
})

// Default privacy settings
export const DEFAULT_PRIVACY_SETTINGS = {
  share_with_partner: false,
  share_cycle_phase: false,
  share_mood: false,
  share_fantasy_vault: false,
  share_intimacy_deck: false,
} as const

// Privacy setting definitions for UI
export const PRIVACY_SETTING_DEFINITIONS: z.infer<typeof PrivacySettingItemSchema>[] = [
  {
    key: 'share_with_partner',
    label: 'Share with Partner',
    description: 'Allow your partner to see your shared data',
    category: 'partner_sharing',
  },
  {
    key: 'share_cycle_phase',
    label: 'Share Cycle Phase',
    description: 'Share your current menstrual cycle phase with your partner',
    category: 'data_sharing',
  },
  {
    key: 'share_mood',
    label: 'Share Mood Data',
    description: 'Share your mood tracking data with your partner',
    category: 'data_sharing',
  },
  {
    key: 'share_fantasy_vault',
    label: 'Share Fantasy Vault',
    description: 'Allow your partner to see your fantasy entries',
    category: 'data_sharing',
  },
  {
    key: 'share_intimacy_deck',
    label: 'Share Intimacy Deck',
    description: 'Share your intimacy preferences and boundaries',
    category: 'data_sharing',
  },
]

// Type exports
export type PrivacySettings = z.infer<typeof PrivacySettingsSchema>
export type UpdatePrivacySettings = z.infer<typeof UpdatePrivacySettingsSchema>
export type PrivacySettingItem = z.infer<typeof PrivacySettingItemSchema>

