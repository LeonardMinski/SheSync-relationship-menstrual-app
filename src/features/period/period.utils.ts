import { format } from "date-fns";

import type { BleedingLevel, Period, PeriodDayLog, PeriodSummary } from "@/types/period";

export const BLEEDING_LEVEL_LABEL: Record<BleedingLevel, string> = {
  spotting: "Spotting",
  light: "Light",
  medium: "Medium",
  heavy: "Heavy",
};

export function toDateKey(date: string | number | Date): string {
  return format(new Date(date), "yyyy-MM-dd");
}

function daysBetween(startDateKey: string, endDateKey: string): number {
  const start = new Date(`${startDateKey}T00:00:00`);
  const end = new Date(`${endDateKey}T00:00:00`);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

/**
 * 1-indexed day of the period a given date falls on. Not stored — always
 * derived from the period's start_date so correcting a start date never
 * requires a backfill.
 */
export function getPeriodDay(
  period: Pick<Period, "start_date">,
  dateKey: string,
): number {
  return daysBetween(period.start_date, dateKey) + 1;
}

/** Inclusive day count. Null while the period is still active. */
export function getPeriodDuration(
  period: Pick<Period, "start_date" | "end_date">,
): number | null {
  if (!period.end_date) return null;
  return daysBetween(period.start_date, period.end_date) + 1;
}

export function isPeriodActive(period: Pick<Period, "end_date">): boolean {
  return period.end_date === null;
}

export function toPeriodSummary(
  period: Period,
  logs: Pick<PeriodDayLog, "id">[],
): PeriodSummary {
  return {
    id: period.id,
    start_date: period.start_date,
    end_date: period.end_date,
    isActive: isPeriodActive(period),
    durationDays: getPeriodDuration(period),
    loggedDayCount: logs.length,
  };
}

/**
 * Average period-to-period interval (cycle length), calculated from
 * start-date to start-date across completed periods only. Requires at
 * least 3 completed periods (2 start-to-start intervals) — with fewer,
 * callers should show "Still learning your cycle" rather than a number.
 * See docs/period-tracking-ui-contract.md for the evidence threshold and
 * why it's set here.
 */
export const MIN_COMPLETED_PERIODS_FOR_AVERAGE = 3;

export function getAverageCycleLength(
  completedPeriodsNewestFirst: Pick<Period, "start_date">[],
): number | null {
  if (completedPeriodsNewestFirst.length < MIN_COMPLETED_PERIODS_FOR_AVERAGE) {
    return null;
  }

  const startsOldestFirst = [...completedPeriodsNewestFirst]
    .map((p) => p.start_date)
    .reverse();

  const intervals: number[] = [];
  for (let i = 1; i < startsOldestFirst.length; i += 1) {
    intervals.push(daysBetween(startsOldestFirst[i - 1], startsOldestFirst[i]));
  }

  const total = intervals.reduce((sum, days) => sum + days, 0);
  return Math.round((total / intervals.length) * 10) / 10;
}
