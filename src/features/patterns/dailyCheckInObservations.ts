import { format, subDays } from "date-fns";

import { PATTERN_THRESHOLDS } from "./thresholds";
import type { CheckInConsistencyEvidence, MoodTrendEvidence, Observation } from "@/types/patterns";
import type { CycleEntry } from "@/types/cycle";

function dateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function average(values: number[]): number {
  return Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 10) / 10;
}

/**
 * Daily Check-in Consistency — a plain engagement/data-quality fact, never
 * gamified (no streaks/XP, per the task spec). Counts distinct dates with a
 * real cycle_data row in the trailing window, ending today inclusive.
 */
export function generateCheckInConsistencyObservation(
  entries: Pick<CycleEntry, "date">[],
  today: Date = new Date(),
): Observation<CheckInConsistencyEvidence> | null {
  const windowDays = PATTERN_THRESHOLDS.checkInConsistency.windowDays;
  const windowStart = subDays(today, windowDays - 1);
  const windowStartKey = dateKey(windowStart);
  const todayKey = dateKey(today);

  const checkedInDays = new Set(
    entries.map((entry) => entry.date).filter((date) => date >= windowStartKey && date <= todayKey),
  ).size;

  if (checkedInDays < PATTERN_THRESHOLDS.checkInConsistency.minCheckedInDays) {
    return null;
  }

  return {
    id: "checkin_consistency",
    type: "checkin_consistency",
    title: "Daily check-ins",
    statement: `You checked in on ${checkedInDays} of the past ${windowDays} days.`,
    evidence: { daysConsidered: windowDays, checkedInDays },
    sufficiency: "sufficient",
    window: { description: `last ${windowDays} days`, since: windowStartKey, until: todayKey },
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Simple Recent Mood Trend — only valid because the canonical daily mood
 * (cycle_data.mood) is a real 1-10 numeric scale, not a categorical one
 * (see features/home/dailyCheckIn.ts). Compares two consecutive 7-day
 * calendar windows; purely comparative, never speculates why. Produces
 * nothing when the two averages are equal — there's no real trend to
 * state.
 */
export function generateMoodTrendObservation(
  entries: Pick<CycleEntry, "date" | "mood">[],
  today: Date = new Date(),
): Observation<MoodTrendEvidence> | null {
  const windowDays = PATTERN_THRESHOLDS.moodTrend.windowDays;
  const recentStartKey = dateKey(subDays(today, windowDays - 1));
  const todayKey = dateKey(today);
  const priorStartKey = dateKey(subDays(today, windowDays * 2 - 1));
  const priorEndKey = dateKey(subDays(today, windowDays));

  const recentMoods = entries
    .filter((entry) => entry.date >= recentStartKey && entry.date <= todayKey)
    .map((entry) => entry.mood);
  const priorMoods = entries
    .filter((entry) => entry.date >= priorStartKey && entry.date <= priorEndKey)
    .map((entry) => entry.mood);

  const { minLoggedPerWindow } = PATTERN_THRESHOLDS.moodTrend;
  if (recentMoods.length < minLoggedPerWindow || priorMoods.length < minLoggedPerWindow) {
    return null;
  }

  const recentAverage = average(recentMoods);
  const priorAverage = average(priorMoods);
  if (recentAverage === priorAverage) {
    return null;
  }

  const direction = recentAverage < priorAverage ? "lower" : "higher";

  return {
    id: "mood_trend",
    type: "mood_trend",
    title: "Mood",
    statement: `Your average mood was ${direction} over the last ${windowDays} logged days than the previous ${windowDays}.`,
    evidence: {
      recentWindowDays: windowDays,
      recentLoggedCount: recentMoods.length,
      recentAverage,
      priorWindowDays: windowDays,
      priorLoggedCount: priorMoods.length,
      priorAverage,
    },
    sufficiency: "sufficient",
    window: { description: `last ${windowDays * 2} days`, since: priorStartKey, until: todayKey },
    generatedAt: new Date().toISOString(),
  };
}
