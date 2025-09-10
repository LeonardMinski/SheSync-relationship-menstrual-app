'use server'

import { revalidatePath } from 'next/cache'
import { updatePrivacySettings, resetPrivacySettings } from './services'
import { UpdatePrivacySettingsSchema } from './schemas'
import type { UpdatePrivacySettings } from './schemas'

/**
 * Update privacy settings server action
 */
export async function updatePrivacySettingsAction(
  userId: string,
  updates: UpdatePrivacySettings
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate the updates
    const validatedUpdates = UpdatePrivacySettingsSchema.parse(updates)

    // Update privacy settings
    const result = await updatePrivacySettings(userId, validatedUpdates)

    if (result.success) {
      // Revalidate the privacy settings page
      revalidatePath('/settings/privacy')
      revalidatePath('/dashboard')
    }

    return result
  } catch (error) {
    console.error('Error in updatePrivacySettingsAction:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

/**
 * Reset privacy settings to defaults server action
 */
export async function resetPrivacySettingsAction(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Reset privacy settings
    const result = await resetPrivacySettings(userId)

    if (result.success) {
      // Revalidate the privacy settings page
      revalidatePath('/settings/privacy')
      revalidatePath('/dashboard')
    }

    return result
  } catch (error) {
    console.error('Error in resetPrivacySettingsAction:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

/**
 * Update a single privacy setting server action
 */
export async function updateSinglePrivacySettingAction(
  userId: string,
  setting: keyof UpdatePrivacySettings,
  value: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const updates = { [setting]: value }
    return await updatePrivacySettingsAction(userId, updates)
  } catch (error) {
    console.error('Error in updateSinglePrivacySettingAction:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

