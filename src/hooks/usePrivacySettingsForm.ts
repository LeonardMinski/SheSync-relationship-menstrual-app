"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import type { PrivacySettings } from "@/schemas/privacy";
import {
  getPrivacySettings,
  updatePrivacySettings,
} from "@/services/privacy/settings";

export const defaultPrivacySettings: PrivacySettings = {
  share_with_partner: false,
  share_cycle_phase: false,
  share_mood: false,
  share_fantasy_vault: false,
  share_intimacy_deck: false,
};

export function usePrivacySettingsForm(initialSettings?: PrivacySettings) {
  const { user } = useAuth();
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [settings, setSettings] = useState<PrivacySettings>(
    initialSettings ?? defaultPrivacySettings,
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clearSuccessSoon = () => {
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }

    successTimeoutRef.current = setTimeout(() => {
      setSuccess(null);
      successTimeoutRef.current = null;
    }, 2500);
  };

  const loadSettings = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);
    try {
      const userSettings = await getPrivacySettings(user.id);
      setSettings(userSettings);
    } catch (err) {
      setError("Failed to load privacy settings");
      console.error("Error loading privacy settings:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!initialSettings && user?.id) {
      void loadSettings();
    }
  }, [user?.id, initialSettings, loadSettings]);

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const updateSetting = async (key: keyof PrivacySettings, value: boolean) => {
    if (!user?.id) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await updatePrivacySettings(user.id, { [key]: value });

      if (result.success) {
        setSettings((prev) => ({ ...prev, [key]: value }));
        setSuccess("Privacy settings updated");
        clearSuccessSoon();
      } else {
        setError(result.error || "Failed to update privacy settings");
      }
    } catch (err) {
      setError("Failed to update privacy settings");
      console.error("Error updating privacy settings:", err);
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = async () => {
    if (!user?.id) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await updatePrivacySettings(user.id, defaultPrivacySettings);

      if (result.success) {
        setSettings(defaultPrivacySettings);
        setSuccess("Privacy settings reset");
        clearSuccessSoon();
      } else {
        setError(result.error || "Failed to reset privacy settings");
      }
    } catch (err) {
      setError("Failed to reset privacy settings");
      console.error("Error resetting privacy settings:", err);
    } finally {
      setSaving(false);
    }
  };

  return {
    error,
    loading,
    resetSettings,
    saving,
    settings,
    stealthMode: !settings.share_with_partner,
    success,
    updateSetting,
  };
}
