import { differenceInCalendarDays } from "date-fns";

import type { CycleEntry } from "@/types/cycle";

export interface TrendPoint {
  date: string;
  mood: number;
  energy: number;
}

/** How many real entries fall within the last `windowDays` days (inclusive of today). */
export function countDaysLogged(cycles: CycleEntry[], windowDays: number, today = new Date()): number {
  return cycles.filter((cycle) => {
    const diff = differenceInCalendarDays(today, new Date(cycle.date));
    return diff >= 0 && diff < windowDays;
  }).length;
}

/** Percentage (0-100) of the last `windowDays` days that have a real logged entry. */
export function loggingConsistency(cycles: CycleEntry[], windowDays: number, today = new Date()): number | null {
  if (windowDays <= 0) return null;
  const logged = countDaysLogged(cycles, windowDays, today);
  return Math.round((logged / windowDays) * 100);
}

/** Mood/energy trend points, oldest first, from real logged entries only. */
export function toTrendPoints(cycles: CycleEntry[]): TrendPoint[] {
  return [...cycles]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((cycle) => ({ date: cycle.date, mood: cycle.mood, energy: cycle.energy }));
}

export interface ObservedPattern {
  matchCount: number;
  totalCount: number;
}

/**
 * A simple, honest co-occurrence count — how many logged days had energy at
 * or below `lowEnergyThreshold` at the same time as stress at or above
 * `highStressThreshold`. This is a literal count over real logged rows, not
 * an inference — callers must phrase it as "appeared alongside", never as
 * causation ("caused by") or a diagnosis.
 */
export function findLowEnergyHighStressPattern(
  cycles: CycleEntry[],
  { lowEnergyThreshold = 4, highStressThreshold = 6 }: { lowEnergyThreshold?: number; highStressThreshold?: number } = {},
): ObservedPattern {
  const matchCount = cycles.filter(
    (cycle) => cycle.energy <= lowEnergyThreshold && cycle.stress >= highStressThreshold,
  ).length;

  return { matchCount, totalCount: cycles.length };
}
