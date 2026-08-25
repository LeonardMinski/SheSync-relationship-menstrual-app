import type { ComponentType } from "react";
import { Brain, Droplet, Heart, Zap } from "lucide-react";

import type { CycleEntry } from "@/types";

export function CycleStatsGrid({
  selectedData,
}: {
  selectedData?: CycleEntry;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Energy"
        value={selectedData?.energy}
        icon={Heart}
        iconClassName="text-[color:var(--accent-peach)]"
        iconBgClassName="bg-bg-elevated"
      />
      <StatCard
        label="Libido"
        value={selectedData?.libido}
        icon={Zap}
        iconClassName="text-accent-purple"
        iconBgClassName="bg-accent-purple/10"
      />
      <StatCard
        label="Stress"
        value={selectedData?.stress}
        icon={Brain}
        iconClassName="text-warning"
        iconBgClassName="bg-warning/10"
      />
      <StatCard
        label="Symptoms"
        value={selectedData ? selectedData.symptoms.length : undefined}
        icon={Droplet}
        iconClassName="text-info"
        iconBgClassName="bg-info/10"
        suffix=""
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  iconClassName,
  iconBgClassName,
  suffix = "/10",
}: {
  label: string;
  value?: number;
  icon: ComponentType<{ className?: string }>;
  iconClassName: string;
  iconBgClassName: string;
  suffix?: string;
}) {
  return (
    <article className="ss-card p-5">
      <div className="flex items-center gap-3">
        <div className={`rounded-full p-3 ${iconBgClassName}`}>
          <Icon className={`h-5 w-5 ${iconClassName}`} aria-hidden="true" />
        </div>
        <div>
          <div className="text-sm font-bold uppercase tracking-[0.12em] text-[color:var(--design-muted)]">
            {label}
          </div>
          <div className="mt-1 text-2xl font-bold text-[color:var(--design-ink)]">
            {value ?? "—"}
            {suffix}
          </div>
        </div>
      </div>
    </article>
  );
}
