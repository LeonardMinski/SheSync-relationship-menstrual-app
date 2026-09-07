import Link from "next/link";
import { format } from "date-fns";

import { BLEEDING_LEVEL_LABEL } from "@/features/period/period.utils";
import type { HomeState } from "@/features/home/homeState";
import type { PeriodDayLog } from "@/types/period";

function formatDate(dateKey: string): string {
  return format(new Date(`${dateKey}T00:00:00`), "MMM d");
}

/**
 * Section 1 on Home: "What's true right now" — read-only. No sliders or
 * inputs live here; editing always happens on the Cycle workspace, reached
 * via the link at the bottom of each variant below.
 */
export function CurrentCycleContext({
  homeState,
  todayLog,
}: {
  homeState: HomeState;
  todayLog: PeriodDayLog | null;
}) {
  if (homeState.variant === "active_period") {
    return (
      <div className="rounded-[1.5rem] border border-border bg-bg-surface p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--accent-rose)]">
          Period Day {homeState.periodDay}
        </p>
        {todayLog ? (
          <dl className="mt-2 space-y-1 text-sm text-foreground">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Flow</dt>
              <dd className="font-semibold">{BLEEDING_LEVEL_LABEL[todayLog.bleeding_level]}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Cramps</dt>
              <dd className="font-semibold">{todayLog.cramps}/10</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Fatigue</dt>
              <dd className="font-semibold">{todayLog.fatigue}/10</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Not logged yet today.</p>
        )}
        <Link
          href="/cycle"
          className="mt-3 inline-block text-sm font-semibold text-[color:var(--accent-rose)] hover:underline"
        >
          {todayLog ? "Update period log" : "Log today's period"} →
        </Link>
      </div>
    );
  }

  if (homeState.lastCompletedPeriod) {
    const { lastCompletedPeriod } = homeState;
    return (
      <div className="rounded-[1.5rem] border border-border bg-bg-surface p-5">
        {homeState.cycleDayEstimate !== undefined && (
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Cycle Day {homeState.cycleDayEstimate}
          </p>
        )}
        <p className="mt-2 text-sm text-foreground">
          <span className="text-muted-foreground">Last period </span>
          <span className="font-semibold">
            {formatDate(lastCompletedPeriod.start_date)}
            {lastCompletedPeriod.end_date ? ` – ${formatDate(lastCompletedPeriod.end_date)}` : ""}
          </span>
          {lastCompletedPeriod.durationDays !== null && (
            <span className="text-muted-foreground">
              {" · "}
              {lastCompletedPeriod.durationDays}{" "}
              {lastCompletedPeriod.durationDays === 1 ? "day" : "days"}
            </span>
          )}
        </p>
        <Link
          href="/cycle"
          className="mt-3 inline-block text-sm font-semibold text-[color:var(--accent-rose)] hover:underline"
        >
          View Cycle →
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-[1.5rem] border border-border bg-bg-surface p-5">
      <p className="text-sm text-muted-foreground">
        Track your period whenever it starts — SheSync+ will start learning your rhythm from there.
      </p>
      <Link
        href="/cycle"
        className="mt-3 inline-block text-sm font-semibold text-[color:var(--accent-rose)] hover:underline"
      >
        Go to Cycle →
      </Link>
    </div>
  );
}
