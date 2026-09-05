import type { ComponentType } from "react";
import { Brain, Droplet, Gauge, Heart, ListChecks, Moon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { CycleEntry } from "@/types";

export function CycleStatsGrid({
  selectedData,
}: {
  selectedData?: CycleEntry;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2" className="font-display text-xl">
          Today&apos;s Stats
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!selectedData ? (
          <p className="py-2 text-sm text-muted-foreground">
            No entry logged for this date yet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatTile
              label="Mood"
              value={selectedData.mood}
              icon={Heart}
              tone="text-[color:var(--accent-rose)]"
              toneBg="bg-[color:var(--accent-rose)]/15"
            />
            <StatTile
              label="Energy"
              value={selectedData.energy}
              icon={Gauge}
              tone="text-[color:var(--accent-amber)]"
              toneBg="bg-[color:var(--accent-amber-soft)]"
            />
            <StatTile
              label="Sleep"
              value={selectedData.sleep}
              icon={Moon}
              tone="text-[color:var(--accent-sage)]"
              toneBg="bg-[color:var(--accent-sage-soft)]"
            />
            <StatTile
              label="Libido"
              value={selectedData.libido}
              icon={Droplet}
              tone="text-[color:var(--accent-purple)]"
              toneBg="bg-[color:var(--accent-purple)]/15"
            />
            <StatTile
              label="Stress"
              value={selectedData.stress}
              icon={Brain}
              tone="text-[color:var(--accent-blue)]"
              toneBg="bg-[color:var(--accent-blue)]/15"
            />
            <StatTile
              label="Symptoms"
              value={selectedData.symptoms.length}
              suffix=""
              icon={ListChecks}
              tone="text-warning"
              toneBg="bg-warning/10"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
  tone,
  toneBg,
  suffix = "/10",
}: {
  label: string;
  value?: number;
  icon: ComponentType<{ className?: string }>;
  tone: string;
  toneBg: string;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-bg-surface p-4">
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${toneBg}`}
      >
        <Icon className={`h-5 w-5 ${tone}`} aria-hidden="true" />
      </span>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-lg font-bold text-foreground">
          {value ?? "—"}
          {suffix}
        </p>
      </div>
    </div>
  );
}
