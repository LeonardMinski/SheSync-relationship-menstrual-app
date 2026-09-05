import { Droplet } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  MIN_COMPLETED_PERIODS_FOR_AVERAGE,
  getAverageCycleLength,
} from "@/features/period/period.utils";
import type { PeriodSummary } from "@/types/period";

function formatDate(dateKey: string): string {
  return format(new Date(`${dateKey}T00:00:00`), "MMM d");
}

export function NoActivePeriodView({
  history,
  onStartPeriod,
  starting,
}: {
  history: PeriodSummary[];
  onStartPeriod: () => void;
  starting: boolean;
}) {
  const lastPeriod = history[0] ?? null;
  const averageCycleLength = getAverageCycleLength(history);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black text-foreground sm:text-4xl">
            Your Cycle
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your period whenever it starts.
          </p>
        </div>
        <Button variant="cta" onClick={onStartPeriod} loading={starting}>
          Start Period
        </Button>
      </div>

      {history.length === 0 ? (
        <EmptyState
          icon={Droplet}
          title="No periods logged yet"
          description="When your period starts, tap Start Period to begin tracking it day by day."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-[2rem] border border-border bg-bg-surface p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Last Period
            </p>
            {lastPeriod && (
              <>
                <p className="mt-2 font-display text-lg font-bold text-foreground">
                  {formatDate(lastPeriod.start_date)}
                  {lastPeriod.end_date ? ` – ${formatDate(lastPeriod.end_date)}` : ""}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Duration: {lastPeriod.durationDays}{" "}
                  {lastPeriod.durationDays === 1 ? "day" : "days"}
                </p>
              </>
            )}
          </div>

          <div className="rounded-[2rem] border border-border bg-bg-surface p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Average Cycle Length
            </p>
            {averageCycleLength !== null ? (
              <>
                <p className="mt-2 font-display text-lg font-bold text-foreground">
                  {averageCycleLength} Days Avg
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Based on your last {history.length} completed periods
                </p>
              </>
            ) : (
              <>
                <p className="mt-2 font-display text-lg font-bold text-foreground">
                  Still learning your cycle
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Track {MIN_COMPLETED_PERIODS_FOR_AVERAGE} full periods to see an average.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
