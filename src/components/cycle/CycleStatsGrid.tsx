import type { ComponentType } from "react";
import { Brain, Droplet, Heart, Moon, Zap } from "lucide-react";

import { Card, CardContent } from "@/components/ui/Card";
import type { CycleEntry } from "@/types";

export function CycleStatsGrid({
  selectedData,
}: {
  selectedData?: CycleEntry;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <StatCard
        label="Energy"
        value={selectedData?.energy}
        icon={Heart}
        iconClassName="text-[color:var(--accent-peach)]"
        iconBgClassName="bg-bg-elevated"
      />
      <StatCard
        label="Sleep"
        value={selectedData?.sleep}
        icon={Moon}
        iconClassName="text-[color:var(--accent-sage)]"
        iconBgClassName="bg-[color:var(--accent-sage-soft)]"
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
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg p-2 ${iconBgClassName}`}>
            <Icon className={`h-5 w-5 ${iconClassName}`} aria-hidden="true" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="text-lg font-semibold text-foreground">
              {value ?? "—"}
              {suffix}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
