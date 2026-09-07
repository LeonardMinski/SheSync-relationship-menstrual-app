import { getPeriodDay, getPeriodDuration } from "@/features/period/period.utils";
import { PATTERN_THRESHOLDS } from "./thresholds";
import type {
  Observation,
  ObservationType,
  PeakDayEvidence,
  PeriodDurationEvidence,
  RecurrenceEvidence,
} from "@/types/patterns";
import type { BleedingLevel, Period, PeriodDayLog } from "@/types/period";

export interface PeriodWithDayLogs {
  period: Pick<Period, "start_date" | "end_date">;
  logs: PeriodDayLog[];
}

const BLEEDING_LEVEL_RANK: Record<BleedingLevel, number> = {
  spotting: 0,
  light: 1,
  medium: 2,
  heavy: 3,
};

function nowIso(): string {
  return new Date().toISOString();
}

/** "Day 2" / "Days 1–2" (contiguous) / "Days 1, 3 and 5" (genuinely scattered). */
export function formatDayRange(days: number[]): string {
  const sorted = [...days].sort((a, b) => a - b);
  if (sorted.length === 1) return `Day ${sorted[0]}`;

  const isContiguous = sorted.every((day, index) => index === 0 || day === sorted[index - 1] + 1);
  if (isContiguous) return `Days ${sorted[0]}–${sorted[sorted.length - 1]}`;
  if (sorted.length === 2) return `Days ${sorted[0]} and ${sorted[1]}`;
  return `Days ${sorted.slice(0, -1).join(", ")} and ${sorted[sorted.length - 1]}`;
}

/**
 * Period Duration Range — the only V1 observation with a real
 * "insufficient" tier as opposed to simply returning null, per the task
 * spec: <2 completed periods -> no observation, 2 -> emerging, 3+ ->
 * sufficient. Uses every period in the window regardless of whether it
 * has day logs (duration only needs start_date/end_date).
 */
export function generatePeriodDurationObservation(
  periods: Pick<Period, "start_date" | "end_date">[],
): Observation<PeriodDurationEvidence> | null {
  const durations = periods
    .map((period) => getPeriodDuration(period))
    .filter((duration): duration is number => duration !== null);

  if (durations.length < PATTERN_THRESHOLDS.periodDuration.insufficientBelow) {
    return null;
  }

  const sufficiency = durations.length >= PATTERN_THRESHOLDS.periodDuration.sufficientAt ? "sufficient" : "emerging";
  const minDays = Math.min(...durations);
  const maxDays = Math.max(...durations);

  return {
    id: "period_duration_range",
    type: "period_duration_range",
    title: "Period duration",
    statement:
      minDays === maxDays
        ? `Your recent periods have lasted ${minDays} day${minDays === 1 ? "" : "s"}.`
        : `Your recent periods have lasted between ${minDays} and ${maxDays} days.`,
    evidence: { periodsConsidered: durations.length, minDays, maxDays },
    sufficiency,
    window: { description: `last ${durations.length} completed periods` },
    generatedAt: nowIso(),
  };
}

interface PeakDayConfig {
  type: ObservationType;
  title: string;
  getValue: (log: PeriodDayLog) => number;
  /** Skip a period's contribution entirely when its max value is at/below this (e.g. 0 cramps everywhere isn't a "peak"). Omit for fields with no such "no signal" value (e.g. bleeding level always ranks >= 0). */
  skipIfMaxAtOrBelow?: number;
  formatStatement: (dayLabel: string) => string;
}

function generatePeakDayObservation(periods: PeriodWithDayLogs[], config: PeakDayConfig): Observation<PeakDayEvidence> | null {
  const usable = periods.filter((entry) => entry.logs.length > 0);
  if (usable.length < PATTERN_THRESHOLDS.peakDay.minUsablePeriods) {
    return null;
  }

  const recurrenceByDay = new Map<number, number>();

  for (const { period, logs } of usable) {
    let maxValue = -Infinity;
    for (const log of logs) {
      const value = config.getValue(log);
      if (value > maxValue) maxValue = value;
    }
    if (config.skipIfMaxAtOrBelow !== undefined && maxValue <= config.skipIfMaxAtOrBelow) {
      continue;
    }

    const peakDaysThisPeriod = new Set<number>();
    for (const log of logs) {
      if (config.getValue(log) === maxValue) {
        peakDaysThisPeriod.add(getPeriodDay(period, log.date));
      }
    }
    for (const day of peakDaysThisPeriod) {
      recurrenceByDay.set(day, (recurrenceByDay.get(day) ?? 0) + 1);
    }
  }

  let maxRecurrence = 0;
  for (const count of recurrenceByDay.values()) {
    if (count > maxRecurrence) maxRecurrence = count;
  }
  if (maxRecurrence === 0) return null;

  const minRequired = Math.ceil(usable.length * PATTERN_THRESHOLDS.peakDay.minRecurrenceFraction);
  if (maxRecurrence < minRequired) return null;

  const winningDays = [...recurrenceByDay.entries()]
    .filter(([, count]) => count === maxRecurrence)
    .map(([day]) => day)
    .sort((a, b) => a - b);

  return {
    id: config.type,
    type: config.type,
    title: config.title,
    statement: config.formatStatement(formatDayRange(winningDays)),
    evidence: { periodsConsidered: periods.length, usablePeriods: usable.length, days: winningDays, recurrenceCount: maxRecurrence },
    sufficiency: "sufficient",
    window: { description: `last ${periods.length} completed periods` },
    generatedAt: nowIso(),
  };
}

export function generateHeaviestFlowDayObservation(periods: PeriodWithDayLogs[]): Observation<PeakDayEvidence> | null {
  return generatePeakDayObservation(periods, {
    type: "heaviest_flow_day",
    title: "Heaviest flow",
    getValue: (log) => BLEEDING_LEVEL_RANK[log.bleeding_level],
    formatStatement: (dayLabel) => `Your heaviest flow has most often been on ${dayLabel} in your recent logged periods.`,
  });
}

export function generateCrampPeakObservation(periods: PeriodWithDayLogs[]): Observation<PeakDayEvidence> | null {
  return generatePeakDayObservation(periods, {
    type: "cramp_peak_day",
    title: "Cramps",
    getValue: (log) => log.cramps,
    skipIfMaxAtOrBelow: 0,
    formatStatement: (dayLabel) => `Cramps have most often been strongest during ${dayLabel}.`,
  });
}

export function generateFatiguePeakObservation(periods: PeriodWithDayLogs[]): Observation<PeakDayEvidence> | null {
  return generatePeakDayObservation(periods, {
    type: "fatigue_peak_day",
    title: "Fatigue",
    getValue: (log) => log.fatigue,
    skipIfMaxAtOrBelow: 0,
    formatStatement: (dayLabel) => `Fatigue has most often been highest on ${dayLabel} in your recent periods.`,
  });
}

interface RecurrenceConfig {
  type: ObservationType;
  title: string;
  isOccurrence: (log: PeriodDayLog) => boolean;
  formatStatement: (occurrences: number, periodsConsidered: number) => string;
}

function generateRecurrenceObservation(periods: PeriodWithDayLogs[], config: RecurrenceConfig): Observation<RecurrenceEvidence> | null {
  if (periods.length < PATTERN_THRESHOLDS.recurrence.minPeriodsConsidered) {
    return null;
  }

  const occurrences = periods.filter(({ logs }) => logs.some(config.isOccurrence)).length;
  if (occurrences < PATTERN_THRESHOLDS.recurrence.minOccurrences) {
    return null;
  }

  return {
    id: config.type,
    type: config.type,
    title: config.title,
    statement: config.formatStatement(occurrences, periods.length),
    evidence: { periodsConsidered: periods.length, occurrences },
    sufficiency: "sufficient",
    window: { description: `last ${periods.length} completed periods` },
    generatedAt: nowIso(),
  };
}

export function generateBackPainRecurrenceObservation(periods: PeriodWithDayLogs[]): Observation<RecurrenceEvidence> | null {
  return generateRecurrenceObservation(periods, {
    type: "back_pain_recurrence",
    title: "Lower-back pain",
    isOccurrence: (log) => log.lower_back_pain > 0,
    formatStatement: (n, m) => `You logged lower-back pain during ${n} of your last ${m} periods.`,
  });
}

export function generateHeadacheRecurrenceObservation(periods: PeriodWithDayLogs[]): Observation<RecurrenceEvidence> | null {
  return generateRecurrenceObservation(periods, {
    type: "headache_recurrence",
    title: "Headaches",
    isOccurrence: (log) => log.headache !== "none",
    formatStatement: (n, m) => `You logged headaches during ${n} of your last ${m} periods.`,
  });
}

export function generateBloatingRecurrenceObservation(periods: PeriodWithDayLogs[]): Observation<RecurrenceEvidence> | null {
  return generateRecurrenceObservation(periods, {
    type: "bloating_recurrence",
    title: "Bloating",
    isOccurrence: (log) => log.bloating !== "none",
    formatStatement: (n, m) => `You logged bloating during ${n} of your last ${m} periods.`,
  });
}

export function generateNauseaRecurrenceObservation(periods: PeriodWithDayLogs[]): Observation<RecurrenceEvidence> | null {
  return generateRecurrenceObservation(periods, {
    type: "nausea_recurrence",
    title: "Nausea",
    isOccurrence: (log) => log.nausea !== "none",
    formatStatement: (n, m) => `You logged nausea during ${n} of your last ${m} periods.`,
  });
}

export function generateBowelChangeRecurrenceObservation(periods: PeriodWithDayLogs[]): Observation<RecurrenceEvidence> | null {
  return generateRecurrenceObservation(periods, {
    type: "bowel_change_recurrence",
    title: "Bowel changes",
    isOccurrence: (log) => log.bowel_changes !== "normal",
    formatStatement: (n, m) => `You logged bowel changes during ${n} of your last ${m} periods.`,
  });
}

export function generatePainReliefFrequencyObservation(periods: PeriodWithDayLogs[]): Observation<RecurrenceEvidence> | null {
  return generateRecurrenceObservation(periods, {
    type: "pain_relief_frequency",
    title: "Pain relief",
    isOccurrence: (log) => log.pain_relief_used,
    formatStatement: (n, m) => `You used pain relief during ${n} of your last ${m} logged periods.`,
  });
}

export function generateActivityImpactFrequencyObservation(periods: PeriodWithDayLogs[]): Observation<RecurrenceEvidence> | null {
  return generateRecurrenceObservation(periods, {
    type: "activity_impact_frequency",
    title: "Activity impact",
    isOccurrence: (log) => log.activity_impact === "some" || log.activity_impact === "significant",
    formatStatement: (n, m) => `Period symptoms affected your normal activities during ${n} of your last ${m} periods.`,
  });
}
