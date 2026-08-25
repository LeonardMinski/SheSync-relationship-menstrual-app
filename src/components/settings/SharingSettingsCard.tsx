import type { ComponentType } from "react";
import {
  BatteryCharging,
  CalendarDays,
  Heart,
  NotebookPen,
  ShieldCheck,
  Smile,
} from "lucide-react";

import { Toggle } from "@/components/ui/Toggle";
import type { PrivacySettings } from "@/schemas/privacy";

interface SharingSettingsCardProps {
  saving: boolean;
  settings: PrivacySettings;
  stealthMode: boolean;
  onSettingChange: (key: keyof PrivacySettings, value: boolean) => void;
}

export function SharingSettingsCard({
  saving,
  settings,
  stealthMode,
  onSettingChange,
}: SharingSettingsCardProps) {
  return (
    <section className="ss-card border-l-[6px] border-l-[color:var(--design-peach)] p-6 sm:p-8 lg:col-span-1 lg:row-span-2">
      <div className="flex items-center gap-4 border-b border-[color:var(--design-border)] pb-6">
        <ShieldCheck
          className="h-7 w-7 text-[color:var(--design-sage)]"
          aria-hidden="true"
        />
        <h2 className="ss-display text-3xl font-bold text-[color:var(--design-ink)]">
          What You&apos;re Sharing
        </h2>
      </div>

      <div className="mt-7 divide-y divide-[color:var(--design-border)]">
        <SharingRow
          icon={CalendarDays}
          title="Phase & Cycle Day"
          description="Share your current phase and cycle day number."
          checked={settings.share_cycle_phase}
          disabled={saving || stealthMode}
          onChange={(checked) => onSettingChange("share_cycle_phase", checked)}
        />
        <SharingRow
          icon={Smile}
          title="Mood & Emotions"
          description="Share logged emotional states to foster understanding."
          checked={settings.share_mood}
          disabled={saving || stealthMode}
          onChange={(checked) => onSettingChange("share_mood", checked)}
        />
        <LockedRow
          icon={Heart}
          title="Specific Symptoms"
          description="Physical symptoms remain private during the MVP phase."
        />
        <LockedRow
          icon={BatteryCharging}
          title="Physical Readiness"
          description="Energy and readiness insights are not shared yet."
        />
        <LockedRow
          icon={NotebookPen}
          title="Private Notes"
          description="Journal entries are never shared."
        />
      </div>
    </section>
  );
}

interface SharingRowProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}

function SharingRow({
  icon: Icon,
  title,
  description,
  checked,
  disabled,
  onChange,
}: SharingRowProps) {
  return (
    <div className="flex flex-col gap-5 py-7 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
      <Icon
        className="h-6 w-6 shrink-0 text-[color:var(--design-sage)]"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="ss-display text-3xl font-bold text-[color:var(--design-ink)]">
          {title}
        </p>
        <p className="mt-2 text-base leading-relaxed text-[color:var(--design-muted)]">
          {description}
        </p>
      </div>
      <Toggle checked={checked} disabled={disabled} onChange={onChange} />
    </div>
  );
}

function LockedRow({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-5 py-7 opacity-55 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
      <Icon
        className="h-6 w-6 shrink-0 text-[color:var(--design-muted)]"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="ss-display text-3xl font-bold text-[color:var(--design-ink)]">
          {title}
        </p>
        <p className="mt-2 text-base leading-relaxed text-[color:var(--design-muted)]">
          {description}
        </p>
      </div>
      <span className="w-fit rounded-full bg-[color:var(--design-footer)] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[color:var(--design-sage)]">
        Locked
      </span>
    </div>
  );
}
