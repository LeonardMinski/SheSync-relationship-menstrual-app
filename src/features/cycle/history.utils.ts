import { addDays, differenceInCalendarDays, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek } from "date-fns";

import { moodValueToLabel, type DailyMoodLabel } from "@/features/home/dailyCheckIn";
import { toCycleDateKey } from "@/features/cycle/cycle.utils";
import type { CycleEntry } from "@/types/cycle";
import type { Period, PeriodSummary } from "@/types/period";

export interface HistoryDayCell {
  dateKey: string;
  dayNumber: number;
  inCurrentMonth: boolean;
  isFuture: boolean;
  mood: number | null;
  isPeriodDay: boolean;
  /** Which period this date belongs to, if any — used to lazily fetch that period's day logs on selection. */
  periodId: string | null;
}

interface PeriodRange {
  id: string;
  start: string;
  end: string | null;
}

function buildPeriodRanges(activePeriod: Period | null, periodHistory: PeriodSummary[]): PeriodRange[] {
  const ranges: PeriodRange[] = periodHistory.map((p) => ({ id: p.id, start: p.start_date, end: p.end_date }));
  if (activePeriod) {
    ranges.push({ id: activePeriod.id, start: activePeriod.start_date, end: activePeriod.end_date });
  }
  return ranges;
}

function findPeriodForDate(dateKey: string, ranges: PeriodRange[], todayKey: string): PeriodRange | null {
  return ranges.find((range) => dateKey >= range.start && dateKey <= (range.end ?? todayKey)) ?? null;
}

/** Full calendar-week-padded grid for the month containing `monthDate`. */
export function buildMonthGrid({
  monthDate,
  cycles,
  activePeriod,
  periodHistory,
  today = new Date(),
}: {
  monthDate: Date;
  cycles: CycleEntry[];
  activePeriod: Period | null;
  periodHistory: PeriodSummary[];
  today?: Date;
}): HistoryDayCell[] {
  const todayKey = toCycleDateKey(today);
  const moodByDate = new Map<string, number>();
  for (const cycle of cycles) {
    const key = toCycleDateKey(cycle.date);
    if (typeof cycle.mood === "number") moodByDate.set(key, cycle.mood);
  }
  const ranges = buildPeriodRanges(activePeriod, periodHistory);

  const gridStart = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
  const cellCount = differenceInCalendarDays(gridEnd, gridStart) + 1;

  return Array.from({ length: cellCount }, (_, index) => {
    const date = addDays(gridStart, index);
    const dateKey = format(date, "yyyy-MM-dd");
    const period = findPeriodForDate(dateKey, ranges, todayKey);

    return {
      dateKey,
      dayNumber: date.getDate(),
      inCurrentMonth: isSameMonth(date, monthDate),
      isFuture: dateKey > todayKey,
      mood: moodByDate.get(dateKey) ?? null,
      isPeriodDay: period !== null,
      periodId: period?.id ?? null,
    };
  });
}

export interface MonthlySummary {
  daysCheckedIn: number;
  mostCommonMood: DailyMoodLabel | null;
  averageMood: number | null;
  periodDaysLogged: number;
}

/**
 * Factual monthly stats only — every number here is derived directly from
 * real logged values within the month. averageMood is a true numeric
 * average of the actual 1-10 cycle_data.mood values (never a fabricated
 * conversion from the 5-label UI vocabulary); mostCommonMood buckets those
 * same real values into that vocabulary only to report a mode.
 */
export function buildMonthlySummary({
  monthDate,
  cycles,
  activePeriod,
  periodHistory,
}: {
  monthDate: Date;
  cycles: CycleEntry[];
  activePeriod: Period | null;
  periodHistory: PeriodSummary[];
}): MonthlySummary {
  const monthMoods = cycles
    .filter((cycle) => isSameMonth(new Date(`${toCycleDateKey(cycle.date)}T00:00:00`), monthDate))
    .map((cycle) => cycle.mood)
    .filter((mood): mood is number => typeof mood === "number");

  const daysCheckedIn = monthMoods.length;
  const averageMood =
    monthMoods.length > 0
      ? Math.round((monthMoods.reduce((sum, mood) => sum + mood, 0) / monthMoods.length) * 10) / 10
      : null;

  let mostCommonMood: DailyMoodLabel | null = null;
  if (monthMoods.length > 0) {
    const counts = new Map<DailyMoodLabel, number>();
    for (const mood of monthMoods) {
      const label = moodValueToLabel(mood);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    let topCount = 0;
    for (const [label, count] of counts) {
      if (count > topCount) {
        topCount = count;
        mostCommonMood = label;
      }
    }
  }

  const monthStart = toCycleDateKey(startOfMonth(monthDate));
  const monthEnd = toCycleDateKey(endOfMonth(monthDate));
  const ranges = buildPeriodRanges(activePeriod, periodHistory);
  let periodDaysLogged = 0;
  for (let cursor = new Date(`${monthStart}T00:00:00`); toCycleDateKey(cursor) <= monthEnd; cursor = addDays(cursor, 1)) {
    const dateKey = toCycleDateKey(cursor);
    if (ranges.some((range) => dateKey >= range.start && dateKey <= (range.end ?? monthEnd))) {
      periodDaysLogged += 1;
    }
  }

  return { daysCheckedIn, mostCommonMood, averageMood, periodDaysLogged };
}
