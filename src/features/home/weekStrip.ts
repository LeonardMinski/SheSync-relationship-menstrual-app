import { format, startOfWeek, addDays } from "date-fns";

import { toCycleDateKey } from "@/features/cycle/cycle.utils";
import type { CycleEntry } from "@/types/cycle";
import type { Period, PeriodSummary } from "@/types/period";

export interface WeekDay {
  dateKey: string;
  dayLabel: string;
  dayNumber: number;
  isToday: boolean;
  isFuture: boolean;
  /** Real logged mood (1-10), or null if no daily check-in exists for this date. */
  mood: number | null;
  /** Whether this date fell within a logged/active period — a separate fact from mood, never conflated with it. */
  isPeriodDay: boolean;
  hasData: boolean;
}

function fallsWithinPeriod(dateKey: string, startDate: string, endDate: string | null, todayKey: string): boolean {
  const end = endDate ?? todayKey;
  return dateKey >= startDate && dateKey <= end;
}

/**
 * Builds the calendar-week (Monday-Sunday) strip shown in Home's "Your
 * Week". Mood and period-day are derived independently from their own real
 * data sources (cycle_data / periods) — never inferred from one another.
 */
export function buildWeekStrip({
  cycles,
  activePeriod,
  periodHistory,
  today = new Date(),
}: {
  cycles: CycleEntry[];
  activePeriod: Period | null;
  periodHistory: PeriodSummary[];
  today?: Date;
}): WeekDay[] {
  const todayKey = toCycleDateKey(today);
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });

  const moodByDate = new Map<string, number>();
  for (const cycle of cycles) {
    const key = toCycleDateKey(cycle.date);
    if (typeof cycle.mood === "number") moodByDate.set(key, cycle.mood);
  }

  const periodRanges: { start: string; end: string | null }[] = periodHistory.map((p) => ({
    start: p.start_date,
    end: p.end_date,
  }));
  if (activePeriod) {
    periodRanges.push({ start: activePeriod.start_date, end: activePeriod.end_date });
  }

  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);
    const dateKey = format(date, "yyyy-MM-dd");
    const mood = moodByDate.get(dateKey) ?? null;
    const isPeriodDay = periodRanges.some((range) => fallsWithinPeriod(dateKey, range.start, range.end, todayKey));

    return {
      dateKey,
      dayLabel: format(date, "EEE"),
      dayNumber: date.getDate(),
      isToday: dateKey === todayKey,
      isFuture: dateKey > todayKey,
      mood,
      isPeriodDay,
      hasData: mood !== null || isPeriodDay,
    };
  });
}
