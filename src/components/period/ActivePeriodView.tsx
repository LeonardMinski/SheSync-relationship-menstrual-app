import { format } from "date-fns";

import { Button } from "@/components/ui/Button";
import { getPeriodDay } from "@/features/period/period.utils";
import type { Period, PeriodDayLog } from "@/types/period";

const BLEEDING_LABEL: Record<string, string> = {
  spotting: "Spotting",
  light: "Light",
  medium: "Medium",
  heavy: "Heavy",
};

export function ActivePeriodView({
  period,
  todayLog,
  onLogToday,
  onEndPeriod,
  ending,
}: {
  period: Period;
  todayLog: PeriodDayLog | null;
  onLogToday: () => void;
  onEndPeriod: () => void;
  ending: boolean;
}) {
  const todayKey = format(new Date(), "yyyy-MM-dd");
  const periodDay = getPeriodDay(period, todayKey);
  const startedLabel = format(new Date(`${period.start_date}T00:00:00`), "MMMM d");

  const timelineDays = Array.from({ length: periodDay }, (_, index) => index + 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black text-foreground sm:text-4xl">
            Your Cycle
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your period is currently in progress.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={onEndPeriod} loading={ending}>
            End Period
          </Button>
          <Button variant="cta" onClick={onLogToday}>
            {todayLog ? "Update Today's State" : "Log Today's State"}
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-[2rem] border border-border bg-bg-surface p-6">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[color:var(--accent-rose)]">
              <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
              Menstrual Phase
            </span>
            <span className="text-xs text-muted-foreground">
              Started {startedLabel}
            </span>
          </div>

          <div className="mt-5 flex items-center gap-5">
            <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full border-2 border-[color:var(--accent-rose)] text-center">
              <span className="text-3xl font-black text-foreground">{periodDay}</span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Day
              </span>
            </div>
            <div>
              <p className="font-display text-lg font-bold text-foreground">
                Period Day {periodDay}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {todayLog
                  ? "Today's log is complete."
                  : "You haven't logged today yet."}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Period Timeline
            </p>
            <div className="flex flex-wrap gap-2">
              {timelineDays.map((day) => (
                <div
                  key={day}
                  className={`min-w-[64px] rounded-xl border px-3 py-2 text-center ${
                    day === periodDay
                      ? "border-[color:var(--accent-rose)] bg-[color:var(--accent-rose)]/10"
                      : "border-border bg-bg-elevated"
                  }`}
                >
                  <p className="text-xs font-bold text-foreground">
                    Day {day}
                    {day === periodDay ? " (Today)" : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-border bg-bg-surface p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Today&apos;s Snapshot</h2>
            {todayLog && (
              <span className="rounded-full bg-[color:var(--accent-sage-soft)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[color:var(--accent-sage)]">
                Logged
              </span>
            )}
          </div>

          {todayLog ? (
            <div className="mt-4 space-y-3">
              <SnapshotRow label="Bleeding Level" value={BLEEDING_LABEL[todayLog.bleeding_level]} />
              <SnapshotRow label="Cramps" value={`${todayLog.cramps}/10`} />
              {todayLog.sleep_quality !== null && (
                <SnapshotRow label="Sleep Quality" value={`${todayLog.sleep_quality}/5`} />
              )}
              <SnapshotRow label="Mood Today" value={`${todayLog.mood}/10`} />
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Not logged yet today. Log today&apos;s state to see it here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SnapshotRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2 text-sm last:border-b-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold text-foreground">{value}</span>
    </div>
  );
}
