import type { ComponentType } from "react";
import { CalendarDays, Heart, NotebookPen, ShieldCheck, Smile } from "lucide-react";

import { Toggle } from "@/components/ui/Toggle";
import type { PrivacySettings } from "@/schemas/privacy";

interface SharingSettingsCardProps {
  saving: boolean;
  settings: PrivacySettings;
  stealthMode: boolean;
  onSettingChange: (key: keyof PrivacySettings, value: boolean) => void;
  onReset: () => void;
}

export function SharingSettingsCard({
  saving,
  settings,
  stealthMode,
  onSettingChange,
  onReset,
}: SharingSettingsCardProps) {
  return (
    <section className="rounded-[2rem] border border-border border-l-[6px] border-l-cta-start bg-bg-surface p-6 shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-7 w-7 text-[color:var(--accent-sage)]" aria-hidden="true" />
          <h2 className="text-2xl font-bold text-foreground">
            What You&apos;re Sharing
          </h2>
        </div>
        <button
          type="button"
          onClick={onReset}
          disabled={saving}
          className="text-sm font-semibold text-muted-foreground underline underline-offset-4 hover:text-foreground disabled:opacity-50"
        >
          Reset to private
        </button>
      </div>

      <div className="mt-7 divide-y divide-border rounded-2xl bg-bg p-4">
        <SharingRow
          icon={CalendarDays}
          title="Cycle Phase"
          description="Share your current cycle phase with your partner."
          checked={settings.share_cycle_phase}
          disabled={saving || stealthMode}
          onChange={(checked) => onSettingChange("share_cycle_phase", checked)}
        />
        <SharingRow
          icon={Smile}
          title="Mood & Energy"
          description="Share your logged mood and energy levels with your partner."
          checked={settings.share_mood}
          disabled={saving || stealthMode}
          onChange={(checked) => onSettingChange("share_mood", checked)}
        />
        <LockedRow
          icon={Heart}
          title="Symptoms"
          description="Physical symptoms remain private during the MVP phase."
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
    <div className="flex items-center gap-4 py-5 first:pt-0 last:pb-0">
      <Icon className="h-6 w-6 shrink-0 text-cta-start" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold text-foreground">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
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
    <div className="flex items-center gap-4 py-5 opacity-55 first:pt-0 last:pb-0">
      <Icon
        className="h-6 w-6 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold text-foreground">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      <span className="rounded-md bg-bg-elevated px-2 py-1 text-xs font-black uppercase tracking-[0.12em] text-info">
        Locked
      </span>
    </div>
  );
}
