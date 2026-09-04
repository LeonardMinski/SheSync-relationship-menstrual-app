"use client";

import { PrivacySettingsCards } from "@/components/settings/PrivacySettingsCards";
import { InlineBanner } from "@/components/ui/InlineBanner";
import { PrivacyPreview } from "@/components/ui/PrivacyPreview";
import { usePartnerPortalData } from "@/hooks/usePartnerPortalData";
import { usePrivacySettingsForm } from "@/hooks/usePrivacySettingsForm";
import type { PrivacySettings } from "@/schemas/privacy";

// Always-private list verified against src/app/api/partner/shared-data/route.ts
// and src/features/partner/sharing-summary.ts: the only fields the shared-data
// RPC can ever expose are cycle phase and mood/energy. Everything else —
// symptoms, notes, and features with no partner-sharing mechanism at all
// (Coach, Vault) — never leaves the owner's account.
const ALWAYS_PRIVATE = ["Symptoms", "Private notes", "Coach conversations", "Vault"];

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

      {ownerLink?.status === "active" && !dataLoading && (
        <PrivacyPreview
          partnerName={ownerLink.personName}
          visible={ownSharingSummary}
          hidden={ALWAYS_PRIVATE}
        />
      )}
    </div>
  );
}
