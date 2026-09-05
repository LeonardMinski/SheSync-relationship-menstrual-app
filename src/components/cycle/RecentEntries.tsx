import { format } from "date-fns";
import { Calendar } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricScale } from "@/components/ui/MetricScale";
import type { CycleEntry } from "@/types";
import { getRecentCycleEntries } from "@/features/cycle/cycle.utils";
import { PhaseIcon } from "./PhaseIcon";

interface RecentEntriesProps {
  cycles: CycleEntry[];
  onSelectCycle: (cycle: CycleEntry) => void;
}

export function RecentEntries({ cycles, onSelectCycle }: RecentEntriesProps) {
  const recent = getRecentCycleEntries(cycles);

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Recent Entries</CardTitle>
        <CardDescription>Your last {recent.length || 5} cycle entries</CardDescription>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No entries yet"
            description="Entries you log will show up here — date, phase, mood, energy, and symptoms."
          />
        ) : (
          <div className="space-y-3">
            {recent.map((cycle) => (
              <button
                key={cycle.id ?? cycle.date}
                type="button"
                className="flex w-full flex-col gap-3 rounded-2xl bg-bg-elevated p-4 text-left transition-colors hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
                onClick={() => onSelectCycle(cycle)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <PhaseIcon phase={cycle.phase} size="sm" />
                    <div>
                      <div className="font-semibold text-foreground">
                        {format(new Date(cycle.date), "MMM d")}
                      </div>
                      <div className="text-xs capitalize text-muted-foreground">
                        {cycle.phase}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <MetricScale label="Mood" value={cycle.mood} max={10} tone="rose" />
                  <MetricScale label="Energy" value={cycle.energy} max={10} tone="amber" />
                </div>

                {cycle.symptoms.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {cycle.symptoms.map((symptom) => (
                      <span
                        key={symptom}
                        className="rounded-full bg-bg-surface px-2.5 py-1 text-xs font-semibold text-foreground"
                      >
                        {symptom}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
