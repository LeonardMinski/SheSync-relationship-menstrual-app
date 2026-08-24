import type { ComponentType } from "react";
import { Activity, BatteryCharging, PenLine, Plus, Smile } from "lucide-react";

import {
  scoreToEnergy,
  scoreToMood,
  scoreToStress,
} from "@/features/dashboard/dashboard.utils";
import type { DashboardCycleLog } from "@/types/dashboard";
import { cn } from "@/utils/cn";

interface DailySnapshotProps {
  todaysData?: DashboardCycleLog;
  latestLog?: DashboardCycleLog;
}

export function DailySnapshot({ todaysData, latestLog }: DailySnapshotProps) {
  const log = todaysData ?? latestLog;

  return (
    <section className="rounded-[2rem] border border-border bg-bg-surface p-6 shadow-md">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Daily Snapshot</h2>
        <PenLine className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      </div>

      <div className="grid gap-3">
        <MetricTile
          label="Mood"
          value={scoreToMood(log?.mood) ?? "Not logged"}
          icon={Smile}
          accent="text-cta-start"
        />
        <MetricTile
          label="Energy"
          value={scoreToEnergy(log?.energy) ?? "Not logged"}
          icon={BatteryCharging}
          accent="text-info"
        />
        <MetricTile
          label="Stress"
          value={scoreToStress(log?.stress) ?? "Not logged"}
          icon={Activity}
          accent="text-[color:var(--accent-lilac)]"
        />
      </div>

      <div className="mt-4 rounded-2xl border border-dashed border-border bg-bg p-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
          Symptoms
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {log?.symptoms?.length ? (
            log.symptoms.slice(0, 3).map((symptom) => (
              <span
                key={symptom}
                className="rounded-full bg-bg-elevated px-3 py-1 text-sm font-semibold text-foreground"
              >
                {symptom}
              </span>
            ))
          ) : (
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Log Symptoms
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

function MetricTile({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <div className="rounded-2xl bg-bg p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {label === "Mood" ? "Logged today" : "Latest signal"}
          </p>
        </div>
        <Icon className={cn("h-5 w-5 shrink-0", accent)} aria-hidden="true" />
      </div>
    </div>
  );
}
