import type { PrivacySettings } from "@/schemas/privacy";

import { ManagePartnerCard } from "./ManagePartnerCard";
import { SharingSettingsCard } from "./SharingSettingsCard";
import { StealthModeCard } from "./StealthModeCard";

interface PrivacySettingsCardsProps {
  saving: boolean;
  settings: PrivacySettings;
  stealthMode: boolean;
  onReset: () => void;
  onSettingChange: (key: keyof PrivacySettings, value: boolean) => void;
}

export function PrivacySettingsCards({
  saving,
  settings,
  stealthMode,
  onReset,
  onSettingChange,
}: PrivacySettingsCardsProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(280px,0.8fr)_minmax(320px,1fr)_minmax(280px,0.8fr)]">
      <ManagePartnerCard saving={saving} onReset={onReset} />
      <SharingSettingsCard
        saving={saving}
        settings={settings}
        stealthMode={stealthMode}
        onSettingChange={onSettingChange}
      />
      <StealthModeCard
        saving={saving}
        stealthMode={stealthMode}
        onChange={(checked) => onSettingChange("share_with_partner", !checked)}
      />
    </div>
  );
}
