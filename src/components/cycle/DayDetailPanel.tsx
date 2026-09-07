import Link from "next/link";
import { format } from "date-fns";

import { BLEEDING_LEVEL_LABEL } from "@/features/period/period.utils";
import { toCycleDateKey } from "@/features/cycle/cycle.utils";
import type { HistoryDayCell } from "@/features/cycle/history.utils";
import type { CycleEntry } from "@/types/cycle";
import type { PeriodDayLog } from "@/types/period";

/**
 * Structured summary for one selected day. Daily check-in and period
 * sections read from their own separate real sources (cycle_data /
 * period_day_logs) and are shown as distinct sections — never merged into
 * one blended "state". Editing only links back to today's live surfaces;
 * past days are shown read-only rather than building new historical-edit
 * flows this pass.
 */
export function DayDetailPanel({
  day,
  cycleEntry,
  periodDayLog,
  loadingPeriodDetail,
}: {
  day: HistoryDayCell;
  cycleEntry: CycleEntry | null;
  periodDayLog: PeriodDayLog | null;
  loadingPeriodDetail: boolean;
}) {
  const isToday = day.dateKey === toCycleDateKey(new Date());

  return (
    <div data-testid="day-detail-panel" className="rounded-[1.5rem] border border-border bg-bg-surface p-5">
      <p className="font-display text-lg font-bold text-foreground">
        {format(new Date(`${day.dateKey}T00:00:00`), "MMMM d")}
      </p>

      <div className="mt-4">
        <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--accent-rose)]">Daily check-in</p>
        {cycleEntry ? (
          <dl className="mt-2 grid grid-cols-3 gap-3 text-sm">
            <DetailStat label="Mood" value={`${cycleEntry.mood}/10`} />
            <DetailStat label="Energy" value={typeof cycleEntry.energy === "number" ? `${cycleEntry.energy}/10` : "—"} />
            <DetailStat label="Stress" value={typeof cycleEntry.stress === "number" ? `${cycleEntry.stress}/10` : "—"} />
          </dl>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Not logged.</p>
        )}
        {isToday && (
          <Link href="/" className="mt-2 inline-block text-sm font-semibold text-[color:var(--accent-rose)] hover:underline">
            Edit daily check-in →
          </Link>
        )}
      </div>

      {day.isPeriodDay && (
        <div className="mt-5 border-t border-border pt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--accent-rose)]">Period</p>
          {loadingPeriodDetail ? (
            <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
          ) : periodDayLog ? (
            <dl className="mt-2 grid grid-cols-3 gap-3 text-sm">
              <DetailStat label="Flow" value={BLEEDING_LEVEL_LABEL[periodDayLog.bleeding_level]} />
              <DetailStat label="Cramps" value={`${periodDayLog.cramps}/10`} />
              <DetailStat label="Fatigue" value={`${periodDayLog.fatigue}/10`} />
            </dl>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">A period day, not yet logged in detail.</p>
          )}
          {isToday && (
            <Link
              href="/cycle"
              className="mt-2 inline-block text-sm font-semibold text-[color:var(--accent-rose)] hover:underline"
            >
              {periodDayLog ? "Update period log" : "Log today's period"} →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-semibold text-foreground">{value}</dd>
    </div>
  );
}
