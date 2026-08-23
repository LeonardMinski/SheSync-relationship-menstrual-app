import { supabase } from "@/lib/supabase/client";
import {
  PrivacySettingsSchema,
  UpdatePrivacySettingsSchema,
  DEFAULT_PRIVACY_SETTINGS,
} from "@/schemas/privacy";
import type { PrivacySettings, UpdatePrivacySettings } from "@/schemas/privacy";

type UserApiResponse = {
  data?: {
    privacy_settings?: unknown;
  };
  error?: string;
};

async function getAccessToken(): Promise<string | null> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) {
    console.error("[privacy] failed to read Supabase session", error);
    return null;
  }
  return session?.access_token || null;
}

function toApiPrivacySettings(settings: PrivacySettings) {
  return {
    shareWithPartner: settings.share_with_partner,
    shareCyclePhase: settings.share_cycle_phase,
    shareMood: settings.share_mood,
    shareFantasyVault: settings.share_fantasy_vault,
    shareIntimacyDeck: settings.share_intimacy_deck,
  };
}

/**
 * Get user's privacy settings
 */
export async function getPrivacySettings(
  userId: string,
): Promise<PrivacySettings> {
  try {
    const token = await getAccessToken();
    if (!token) {
      console.error(
        "[privacy] cannot fetch settings without an authenticated session",
        { userId },
      );
      return DEFAULT_PRIVACY_SETTINGS;
    }

    const response = await fetch("/api/user", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = (await response.json()) as UserApiResponse;

    if (!response.ok) {
      console.error("[privacy] failed to fetch privacy settings", data);
      return DEFAULT_PRIVACY_SETTINGS;
    }

    const validatedSettings = PrivacySettingsSchema.parse(
      data.data?.privacy_settings || DEFAULT_PRIVACY_SETTINGS,
    );
    return validatedSettings;
  } catch (error) {
    console.error("[privacy] failed to parse privacy settings", error);
    return DEFAULT_PRIVACY_SETTINGS;
  }
}

/**
 * Update user's privacy settings
 */
export async function updatePrivacySettings(
  userId: string,
  updates: UpdatePrivacySettings,
): Promise<{ success: boolean; error?: string; data?: PrivacySettings }> {
  try {
    const validatedUpdates = UpdatePrivacySettingsSchema.parse(updates);
    const currentSettings = await getPrivacySettings(userId);
    const updatedSettings = { ...currentSettings, ...validatedUpdates };
    const validatedSettings = PrivacySettingsSchema.parse(updatedSettings);

    const token = await getAccessToken();
    if (!token) {
      console.error(
        "[privacy] cannot update settings without an authenticated session",
        { userId },
      );
      return { success: false, error: "Authentication required" };
    }

    const response = await fetch("/api/user", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        privacySettings: toApiPrivacySettings(validatedSettings),
      }),
    });
    const data = (await response.json()) as UserApiResponse;

    if (!response.ok) {
      console.error("[privacy] failed to update privacy settings", data);
      return {
        success: false,
        error: data.error || "Failed to update privacy settings",
      };
    }

    const returnedSettings = PrivacySettingsSchema.parse(
      data.data?.privacy_settings || validatedSettings,
    );
    return { success: true, data: returnedSettings };
  } catch (error) {
    console.error("[privacy] unexpected update error", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Reset privacy settings to defaults
 */
export async function resetPrivacySettings(
  userId: string,
): Promise<{ success: boolean; error?: string; data?: PrivacySettings }> {
  return updatePrivacySettings(userId, DEFAULT_PRIVACY_SETTINGS);
}

/**
 * Check if a specific privacy setting is enabled
 */
export async function isPrivacySettingEnabled(
  userId: string,
  setting: keyof PrivacySettings,
): Promise<boolean> {
  try {
    const settings = await getPrivacySettings(userId);
    return settings[setting];
  } catch (error) {
    console.error("[privacy] failed to check privacy setting", error);
    return false;
  }
}
