"use client";

import { PrivacySettingsCards } from "@/components/settings/PrivacySettingsCards";
import { InlineBanner } from "@/components/ui/InlineBanner";
import { usePartnerPortalData } from "@/hooks/usePartnerPortalData";
import { usePrivacySettingsForm } from "@/hooks/usePrivacySettingsForm";
import type { PrivacySettings } from "@/schemas/privacy";

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

  const { dataLoading, invitePartner, ownerLink, ownSharingSummary, revokeConnection } =
    usePartnerPortalData();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <div
          className="h-9 w-9 motion-reduce:animate-none animate-spin rounded-full border-2 border-border border-t-cta-start"
          aria-label="Loading privacy settings"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {(success || error) && (
        <InlineBanner tone={error ? "error" : "success"}>{error ?? success}</InlineBanner>
      )}

      <PrivacySettingsCards
        saving={saving}
        settings={settings}
        stealthMode={stealthMode}
        onReset={resetSettings}
        onSettingChange={updateSetting}
        ownerLink={ownerLink}
        ownerLinkLoading={dataLoading}
        ownSharingSummary={ownSharingSummary}
        onInvite={invitePartner}
        onRevokeConnection={revokeConnection}
      />
    </div>
  );
}
