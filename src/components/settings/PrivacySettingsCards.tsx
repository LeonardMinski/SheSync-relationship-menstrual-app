import type { PrivacySettings } from "@/schemas/privacy";
import type { PartnerLinkWithPerson } from "@/types/partner";

import { ManagePartnerCard } from "./ManagePartnerCard";
import { SharingSettingsCard } from "./SharingSettingsCard";
import { StealthModeCard } from "./StealthModeCard";

interface PrivacySettingsCardsProps {
  saving: boolean;
  settings: PrivacySettings;
  stealthMode: boolean;
  onSettingChange: (key: keyof PrivacySettings, value: boolean) => void;
  onReset: () => void;
  ownerLink: PartnerLinkWithPerson | null;
  ownerLinkLoading: boolean;
  ownSharingSummary: string[];
  onInvite: (email: string) => Promise<boolean>;
  onRevokeConnection: () => Promise<boolean>;
}

export function PrivacySettingsCards({
  saving,
  settings,
  stealthMode,
  onReset,
  onSettingChange,
  ownerLink,
  ownerLinkLoading,
  ownSharingSummary,
  onInvite,
  onRevokeConnection,
}: PrivacySettingsCardsProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(280px,0.8fr)_minmax(320px,1fr)_minmax(280px,0.8fr)]">
      <ManagePartnerCard
        ownerLink={ownerLink}
        loading={ownerLinkLoading}
        sharingSummary={ownSharingSummary}
        onInvite={onInvite}
        onRevoke={onRevokeConnection}
      />
      <SharingSettingsCard
        saving={saving}
        settings={settings}
        stealthMode={stealthMode}
        onSettingChange={onSettingChange}
        onReset={onReset}
      />
      <StealthModeCard
        saving={saving}
        stealthMode={stealthMode}
        onChange={(checked) => onSettingChange("share_with_partner", !checked)}
      />
    </div>
  );
}
