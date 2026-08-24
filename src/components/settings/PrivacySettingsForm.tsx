"use client";

import { PrivacySettingsCards } from "@/components/settings/PrivacySettingsCards";
import { usePrivacySettingsForm } from "@/hooks/usePrivacySettingsForm";
import type { PrivacySettings } from "@/schemas/privacy";
import { cn } from "@/utils/cn";

interface PrivacySettingsFormProps {
  initialSettings?: PrivacySettings;
}

export default function PrivacySettingsForm({
  initialSettings,
}: PrivacySettingsFormProps) {
  const {
    error,
    loading,
    resetSettings,
    saving,
    settings,
    stealthMode,
    success,
    updateSetting,
  } = usePrivacySettingsForm(initialSettings);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-border border-t-cta-start"
          aria-label="Loading privacy settings"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {(success || error) && (
        <div
          role={error ? "alert" : "status"}
          className={cn(
            "rounded-2xl border px-4 py-3 text-sm font-semibold",
            error
              ? "border-error/20 bg-error/10 text-error"
              : "border-success/20 bg-success/10 text-success",
          )}
        >
          {error ?? success}
        </div>
      )}

      <PrivacySettingsCards
        saving={saving}
        settings={settings}
        stealthMode={stealthMode}
        onReset={resetSettings}
        onSettingChange={updateSetting}
      />
    </div>
  );
}
