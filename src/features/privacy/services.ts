import { supabase } from '@/lib/supabaseClient'
import { PrivacySettingsSchema, UpdatePrivacySettingsSchema, DEFAULT_PRIVACY_SETTINGS } from './schemas'
import type { PrivacySettings, UpdatePrivacySettings } from './schemas'

/**
 * Get user's privacy settings
 */
export async function getPrivacySettings(userId: string): Promise<PrivacySettings> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('privacy_settings')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching privacy settings:', error)
      return DEFAULT_PRIVACY_SETTINGS
    }

    // Validate and return privacy settings with defaults
    const validatedSettings = PrivacySettingsSchema.parse(data.privacy_settings || DEFAULT_PRIVACY_SETTINGS)
    return validatedSettings
  } catch (error) {
    console.error('Error parsing privacy settings:', error)
    return DEFAULT_PRIVACY_SETTINGS
  }
}

/**
 * Update user's privacy settings
 */
export async function updatePrivacySettings(
  userId: string,
  updates: UpdatePrivacySettings
): Promise<{ success: boolean; error?: string; data?: PrivacySettings }> {
  try {
    // Validate the updates
    const validatedUpdates = UpdatePrivacySettingsSchema.parse(updates)

    // Get current privacy settings
    const currentSettings = await getPrivacySettings(userId)

    // Merge with current settings
    const updatedSettings = { ...currentSettings, ...validatedUpdates }

    // Validate the complete settings
    const validatedSettings = PrivacySettingsSchema.parse(updatedSettings)

    // Update in database
    const { data, error } = await supabase
      .from('users')
      .update({ privacy_settings: validatedSettings })
      .eq('id', userId)
      .select('privacy_settings')
      .single()

    if (error) {
      console.error('Error updating privacy settings:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: validatedSettings }
  } catch (error) {
    console.error('Error updating privacy settings:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

/**
 * Reset privacy settings to defaults
 */
export async function resetPrivacySettings(userId: string): Promise<{ success: boolean; error?: string; data?: PrivacySettings }> {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ privacy_settings: DEFAULT_PRIVACY_SETTINGS })
      .eq('id', userId)
      .select('privacy_settings')
      .single()

    if (error) {
      console.error('Error resetting privacy settings:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: DEFAULT_PRIVACY_SETTINGS }
  } catch (error) {
    console.error('Error resetting privacy settings:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

/**
 * Check if a specific privacy setting is enabled
 */
export async function isPrivacySettingEnabled(
  userId: string,
  setting: keyof PrivacySettings
): Promise<boolean> {
  try {
    const settings = await getPrivacySettings(userId)
    return settings[setting]
  } catch (error) {
    console.error('Error checking privacy setting:', error)
    return false
  }
}

