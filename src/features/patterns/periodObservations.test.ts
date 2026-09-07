import { addDays, format } from "date-fns";
import { describe, expect, it } from "vitest";

import {
  formatDayRange,
  generateActivityImpactFrequencyObservation,
  generateBackPainRecurrenceObservation,
  generateBloatingRecurrenceObservation,
  generateBowelChangeRecurrenceObservation,
  generateCrampPeakObservation,
  generateFatiguePeakObservation,
  generateHeadacheRecurrenceObservation,
  generateHeaviestFlowDayObservation,
  generateNauseaRecurrenceObservation,
  generatePainReliefFrequencyObservation,
  generatePeriodDurationObservation,
  type PeriodWithDayLogs,
} from "./periodObservations";
import type { Period, PeriodDayLog } from "@/types/period";

function period(startDate: string, endDate: string | null): Pick<Period, "start_date" | "end_date"> {
  return { start_date: startDate, end_date: endDate };
}

function log(overrides: Partial<PeriodDayLog> & { date: string }): PeriodDayLog {
  return {
    id: `log-${overrides.date}`,
    period_id: "period-1",
    user_id: "user-1",
    bleeding_level: "medium",
    bleeding_colour: null,
    clots: "none",
    cramps: 0,
    lower_back_pain: 0,
    headache: "none",
    bloating: "none",
    fatigue: 0,
    nausea: "none",
    bowel_changes: "normal",
    sleep_quality: null,
    mood: 5,
    pain_relief_used: false,
    pain_relief_medication: null,
    pain_relief_time: null,
    activity_impact: "none",
    notes: null,
    created_at: `${overrides.date}T00:00:00.000Z`,
    updated_at: `${overrides.date}T00:00:00.000Z`,
    ...overrides,
  };
}

/** Builds a 5-day period (Aug 1-5) with logs for the given day->overrides map (1-indexed). */
function periodWithLogs(
  startDate: string,
  endDate: string,
  dayOverrides: Record<number, Partial<PeriodDayLog>> = {},
): PeriodWithDayLogs {
  const start = new Date(`${startDate}T00:00:00`);
  const logs: PeriodDayLog[] = Object.entries(dayOverrides).map(([dayStr, overrides]) => {
    const dayIndex = Number(dayStr) - 1;
    const dateKey = format(addDays(start, dayIndex), "yyyy-MM-dd");
    return log({ date: dateKey, ...overrides });
  });
  return { period: period(startDate, endDate), logs };
}

describe("formatDayRange", () => {
  it("formats a single day", () => {
    expect(formatDayRange([2])).toBe("Day 2");
  });

  it("formats a contiguous range", () => {
    expect(formatDayRange([1, 2])).toBe("Days 1–2");
    expect(formatDayRange([2, 3, 4])).toBe("Days 2–4");
  });

  it("formats two non-contiguous days", () => {
    expect(formatDayRange([1, 4])).toBe("Days 1 and 4");
  });

  it("formats three or more non-contiguous days", () => {
    expect(formatDayRange([1, 3, 5])).toBe("Days 1, 3 and 5");
  });
});

describe("generatePeriodDurationObservation", () => {
  it("returns null (insufficient) with fewer than 2 completed periods", () => {
    expect(generatePeriodDurationObservation([period("2026-08-01", "2026-08-05")])).toBeNull();
    expect(generatePeriodDurationObservation([])).toBeNull();
  });

  it("returns an 'emerging' observation with exactly 2 completed periods", () => {
    const result = generatePeriodDurationObservation([
      period("2026-08-01", "2026-08-05"),
      period("2026-07-01", "2026-07-04"),
    ]);

    expect(result?.sufficiency).toBe("emerging");
    expect(result?.evidence.periodsConsidered).toBe(2);
  });

  it("returns a 'sufficient' observation with 3+ completed periods", () => {
    const result = generatePeriodDurationObservation([
      period("2026-08-01", "2026-08-05"),
      period("2026-07-01", "2026-07-05"),
      period("2026-06-01", "2026-06-04"),
    ]);

    expect(result?.sufficiency).toBe("sufficient");
    expect(result?.evidence).toEqual({ periodsConsidered: 3, minDays: 4, maxDays: 5 });
    expect(result?.statement).toBe("Your recent periods have lasted between 4 and 5 days.");
  });

  it("computes duration inclusively (start and end date both count)", () => {
    const result = generatePeriodDurationObservation([
      period("2026-08-01", "2026-08-01"),
      period("2026-07-01", "2026-07-01"),
    ]);

    expect(result?.evidence.minDays).toBe(1);
    expect(result?.evidence.maxDays).toBe(1);
  });

  it("excludes an incomplete (still-active) period from the evidence", () => {
    const result = generatePeriodDurationObservation([
      period("2026-08-01", "2026-08-05"),
      period("2026-07-01", "2026-07-05"),
      period("2026-09-01", null), // active — no end_date
    ]);

    expect(result?.evidence.periodsConsidered).toBe(2);
    expect(result?.sufficiency).toBe("emerging");
  });

  it("states a single-day duration without a range when min equals max", () => {
    const result = generatePeriodDurationObservation([
      period("2026-08-01", "2026-08-04"),
      period("2026-07-01", "2026-07-04"),
      period("2026-06-01", "2026-06-04"),
    ]);

    expect(result?.statement).toBe("Your recent periods have lasted 4 days.");
  });
});

describe("generateHeaviestFlowDayObservation", () => {
  it("ranks bleeding levels correctly (spotting < light < medium < heavy)", () => {
    const periods: PeriodWithDayLogs[] = [
      periodWithLogs("2026-08-01", "2026-08-04", {
        1: { bleeding_level: "light" },
        2: { bleeding_level: "heavy" },
        3: { bleeding_level: "medium" },
        4: { bleeding_level: "spotting" },
      }),
      periodWithLogs("2026-07-01", "2026-07-04", { 1: { bleeding_level: "light" }, 2: { bleeding_level: "heavy" } }),
      periodWithLogs("2026-06-01", "2026-06-04", { 1: { bleeding_level: "light" }, 2: { bleeding_level: "heavy" } }),
    ];

    const result = generateHeaviestFlowDayObservation(periods);
    expect(result?.evidence.days).toEqual([2]);
  });

  it("produces a clear-recurrence observation when one day wins across a majority of usable periods", () => {
    const periods: PeriodWithDayLogs[] = [
      periodWithLogs("2026-08-01", "2026-08-03", { 1: { bleeding_level: "heavy" }, 2: { bleeding_level: "medium" } }),
      periodWithLogs("2026-07-01", "2026-07-03", { 1: { bleeding_level: "heavy" }, 2: { bleeding_level: "light" } }),
      periodWithLogs("2026-06-01", "2026-06-03", { 1: { bleeding_level: "medium" }, 2: { bleeding_level: "light" } }),
    ];

    const result = generateHeaviestFlowDayObservation(periods);
    expect(result?.evidence.days).toEqual([1]);
    expect(result?.evidence.recurrenceCount).toBe(3);
    expect(result?.statement).toBe("Your heaviest flow has most often been on Day 1 in your recent logged periods.");
  });

  it("reports a tie honestly instead of inventing a unique winner", () => {
    const periods: PeriodWithDayLogs[] = [
      periodWithLogs("2026-08-01", "2026-08-03", { 1: { bleeding_level: "heavy" }, 2: { bleeding_level: "heavy" } }),
      periodWithLogs("2026-07-01", "2026-07-03", { 1: { bleeding_level: "heavy" }, 2: { bleeding_level: "heavy" } }),
      periodWithLogs("2026-06-01", "2026-06-03", { 1: { bleeding_level: "heavy" }, 2: { bleeding_level: "heavy" } }),
    ];

    const result = generateHeaviestFlowDayObservation(periods);
    expect(result?.evidence.days).toEqual([1, 2]);
    expect(result?.statement).toBe("Your heaviest flow has most often been on Days 1–2 in your recent logged periods.");
  });

  it("returns null when the evidence is too mixed to justify a statement", () => {
    const periods: PeriodWithDayLogs[] = [
      periodWithLogs("2026-08-01", "2026-08-03", { 1: { bleeding_level: "heavy" } }),
      periodWithLogs("2026-07-01", "2026-07-03", { 2: { bleeding_level: "heavy" } }),
      periodWithLogs("2026-06-01", "2026-06-03", { 3: { bleeding_level: "heavy" } }),
    ];

    expect(generateHeaviestFlowDayObservation(periods)).toBeNull();
  });

  it("skips periods with no day logs (missing logs) rather than crashing or fabricating", () => {
    const periods: PeriodWithDayLogs[] = [
      periodWithLogs("2026-08-01", "2026-08-03", { 1: { bleeding_level: "heavy" } }),
      periodWithLogs("2026-07-01", "2026-07-03", { 1: { bleeding_level: "heavy" } }),
      { period: period("2026-06-01", "2026-06-03"), logs: [] }, // unlogged period
    ];

    // Only 2 usable periods — below minUsablePeriods (3) — so no observation.
    expect(generateHeaviestFlowDayObservation(periods)).toBeNull();
  });

  it("returns null with fewer than 3 usable periods", () => {
    const periods: PeriodWithDayLogs[] = [
      periodWithLogs("2026-08-01", "2026-08-03", { 1: { bleeding_level: "heavy" } }),
      periodWithLogs("2026-07-01", "2026-07-03", { 1: { bleeding_level: "heavy" } }),
    ];

    expect(generateHeaviestFlowDayObservation(periods)).toBeNull();
  });
});

describe("generateCrampPeakObservation", () => {
  it("finds the peak day", () => {
    const periods: PeriodWithDayLogs[] = [
      periodWithLogs("2026-08-01", "2026-08-03", { 1: { cramps: 7 }, 2: { cramps: 3 } }),
      periodWithLogs("2026-07-01", "2026-07-03", { 1: { cramps: 8 }, 2: { cramps: 2 } }),
      periodWithLogs("2026-06-01", "2026-06-03", { 1: { cramps: 6 }, 2: { cramps: 1 } }),
    ];

    const result = generateCrampPeakObservation(periods);
    expect(result?.evidence.days).toEqual([1]);
    expect(result?.statement).toBe("Cramps have most often been strongest during Day 1.");
  });

  it("handles a genuine multi-day peak within a single period (both days tied at the max)", () => {
    const periods: PeriodWithDayLogs[] = [
      periodWithLogs("2026-08-01", "2026-08-03", { 1: { cramps: 7 }, 2: { cramps: 7 } }),
      periodWithLogs("2026-07-01", "2026-07-03", { 1: { cramps: 8 }, 2: { cramps: 8 } }),
      periodWithLogs("2026-06-01", "2026-06-03", { 1: { cramps: 6 }, 2: { cramps: 6 } }),
    ];

    const result = generateCrampPeakObservation(periods);
    expect(result?.evidence.days).toEqual([1, 2]);
    expect(result?.statement).toBe("Cramps have most often been strongest during Days 1–2.");
  });

  it("requires recurrence across a majority of usable periods", () => {
    const periods: PeriodWithDayLogs[] = [
      periodWithLogs("2026-08-01", "2026-08-03", { 1: { cramps: 7 } }),
      periodWithLogs("2026-07-01", "2026-07-03", { 1: { cramps: 8 } }),
      periodWithLogs("2026-06-01", "2026-06-03", { 2: { cramps: 6 } }),
      periodWithLogs("2026-05-01", "2026-05-03", { 3: { cramps: 6 } }),
    ];

    // Day 1 recurs twice out of 4 usable periods — exactly ceil(4*0.5)=2, meets the bar.
    const result = generateCrampPeakObservation(periods);
    expect(result?.evidence.days).toEqual([1]);
  });

  it("returns null with fewer than 3 usable periods (insufficient)", () => {
    const periods: PeriodWithDayLogs[] = [
      periodWithLogs("2026-08-01", "2026-08-03", { 1: { cramps: 7 } }),
      periodWithLogs("2026-07-01", "2026-07-03", { 1: { cramps: 8 } }),
    ];

    expect(generateCrampPeakObservation(periods)).toBeNull();
  });

  it("returns null (a tie with no clear winner) when cramps are scattered with no recurring day", () => {
    const periods: PeriodWithDayLogs[] = [
      periodWithLogs("2026-08-01", "2026-08-03", { 1: { cramps: 7 } }),
      periodWithLogs("2026-07-01", "2026-07-03", { 2: { cramps: 8 } }),
      periodWithLogs("2026-06-01", "2026-06-03", { 3: { cramps: 6 } }),
    ];

    expect(generateCrampPeakObservation(periods)).toBeNull();
  });

  it("does not treat an all-zero-cramps period as having a meaningful peak", () => {
    const periods: PeriodWithDayLogs[] = [
      periodWithLogs("2026-08-01", "2026-08-03", { 1: { cramps: 0 }, 2: { cramps: 0 } }),
      periodWithLogs("2026-07-01", "2026-07-03", { 1: { cramps: 0 }, 2: { cramps: 0 } }),
      periodWithLogs("2026-06-01", "2026-06-03", { 1: { cramps: 0 }, 2: { cramps: 0 } }),
    ];

    expect(generateCrampPeakObservation(periods)).toBeNull();
  });
});

describe("generateFatiguePeakObservation", () => {
  it("finds the peak day using fatigue values, independent of cramps", () => {
    const periods: PeriodWithDayLogs[] = [
      periodWithLogs("2026-08-01", "2026-08-03", { 1: { fatigue: 2, cramps: 9 }, 2: { fatigue: 8, cramps: 1 } }),
      periodWithLogs("2026-07-01", "2026-07-03", { 1: { fatigue: 1, cramps: 9 }, 2: { fatigue: 7, cramps: 1 } }),
      periodWithLogs("2026-06-01", "2026-06-03", { 1: { fatigue: 3, cramps: 9 }, 2: { fatigue: 6, cramps: 1 } }),
    ];

    const result = generateFatiguePeakObservation(periods);
    expect(result?.evidence.days).toEqual([2]);
    expect(result?.statement).toBe("Fatigue has most often been highest on Day 2 in your recent periods.");
  });
});

describe("recurring symptom observations", () => {
  it("back pain: counts periods with any day of lower_back_pain > 0", () => {
    const periods: PeriodWithDayLogs[] = [
      periodWithLogs("2026-08-01", "2026-08-03", { 1: { lower_back_pain: 3 } }),
      periodWithLogs("2026-07-01", "2026-07-03", { 1: { lower_back_pain: 0 } }),
      periodWithLogs("2026-06-01", "2026-06-03", { 1: { lower_back_pain: 5 } }),
      periodWithLogs("2026-05-01", "2026-05-03", { 1: { lower_back_pain: 2 } }),
      periodWithLogs("2026-04-01", "2026-04-03", { 1: { lower_back_pain: 0 } }),
    ];

    const result = generateBackPainRecurrenceObservation(periods);
    expect(result?.evidence).toEqual({ periodsConsidered: 5, occurrences: 3 });
    expect(result?.statement).toBe("You logged lower-back pain during 3 of your last 5 periods.");
  });

  it("headache: counts periods with any non-none headache entry", () => {
    const periods: PeriodWithDayLogs[] = [
      periodWithLogs("2026-08-01", "2026-08-03", { 1: { headache: "mild" } }),
      periodWithLogs("2026-07-01", "2026-07-03", { 1: { headache: "none" } }),
      periodWithLogs("2026-06-01", "2026-06-03", { 1: { headache: "severe" } }),
    ];

    const result = generateHeadacheRecurrenceObservation(periods);
    expect(result?.evidence.occurrences).toBe(2);
    expect(result?.statement).toBe("You logged headaches during 2 of your last 3 periods.");
  });

  it("bloating: counts periods with any non-none bloating entry", () => {
    const periods: PeriodWithDayLogs[] = [
      periodWithLogs("2026-08-01", "2026-08-03", { 1: { bloating: "moderate" } }),
      periodWithLogs("2026-07-01", "2026-07-03", { 1: { bloating: "none" } }),
      periodWithLogs("2026-06-01", "2026-06-03", { 1: { bloating: "mild" } }),
    ];

    expect(generateBloatingRecurrenceObservation(periods)?.evidence.occurrences).toBe(2);
  });

  it("nausea: counts periods with any non-none nausea entry", () => {
    const periods: PeriodWithDayLogs[] = [
      periodWithLogs("2026-08-01", "2026-08-03", { 1: { nausea: "mild" } }),
      periodWithLogs("2026-07-01", "2026-07-03", { 1: { nausea: "none" } }),
      periodWithLogs("2026-06-01", "2026-06-03", { 1: { nausea: "none" } }),
    ];

    expect(generateNauseaRecurrenceObservation(periods)?.evidence.occurrences).toBe(1);
  });

  it("bowel changes: counts periods with any non-normal entry", () => {
    const periods: PeriodWithDayLogs[] = [
      periodWithLogs("2026-08-01", "2026-08-03", { 1: { bowel_changes: "loose" } }),
      periodWithLogs("2026-07-01", "2026-07-03", { 1: { bowel_changes: "normal" } }),
      periodWithLogs("2026-06-01", "2026-06-03", { 1: { bowel_changes: "constipated" } }),
      periodWithLogs("2026-05-01", "2026-05-03", { 1: { bowel_changes: "normal" } }),
    ];

    const result = generateBowelChangeRecurrenceObservation(periods);
    expect(result?.evidence.occurrences).toBe(2);
    expect(result?.statement).toBe("You logged bowel changes during 2 of your last 4 periods.");
  });

  it("pain relief: counts periods where pain relief was used on any day", () => {
    const periods: PeriodWithDayLogs[] = [
      periodWithLogs("2026-08-01", "2026-08-03", { 1: { pain_relief_used: true } }),
      periodWithLogs("2026-07-01", "2026-07-03", { 1: { pain_relief_used: false } }),
      periodWithLogs("2026-06-01", "2026-06-03", { 1: { pain_relief_used: true } }),
      periodWithLogs("2026-05-01", "2026-05-03", { 1: { pain_relief_used: true } }),
      periodWithLogs("2026-04-01", "2026-04-03", { 1: { pain_relief_used: false } }),
    ];

    const result = generatePainReliefFrequencyObservation(periods);
    expect(result?.evidence.occurrences).toBe(3);
    expect(result?.statement).toBe("You used pain relief during 3 of your last 5 logged periods.");
  });

  it("activity impact: treats 'some' and 'significant' as an occurrence, 'none' as not", () => {
    const periods: PeriodWithDayLogs[] = [
      periodWithLogs("2026-08-01", "2026-08-03", { 1: { activity_impact: "some" } }),
      periodWithLogs("2026-07-01", "2026-07-03", { 1: { activity_impact: "none" } }),
      periodWithLogs("2026-06-01", "2026-06-03", { 1: { activity_impact: "significant" } }),
      periodWithLogs("2026-05-01", "2026-05-03", { 1: { activity_impact: "none" } }),
      periodWithLogs("2026-04-01", "2026-04-03", { 1: { activity_impact: "none" } }),
    ];

    const result = generateActivityImpactFrequencyObservation(periods);
    expect(result?.evidence.occurrences).toBe(2);
    expect(result?.statement).toBe("Period symptoms affected your normal activities during 2 of your last 5 periods.");
  });

  it("returns null with fewer than 3 periods considered (insufficient)", () => {
    const periods: PeriodWithDayLogs[] = [
      periodWithLogs("2026-08-01", "2026-08-03", { 1: { lower_back_pain: 5 } }),
      periodWithLogs("2026-07-01", "2026-07-03", { 1: { lower_back_pain: 5 } }),
    ];

    expect(generateBackPainRecurrenceObservation(periods)).toBeNull();
  });

  it("returns null when the symptom never occurred (0 of N isn't a useful recurrence claim)", () => {
    const periods: PeriodWithDayLogs[] = [
      periodWithLogs("2026-08-01", "2026-08-03", { 1: { lower_back_pain: 0 } }),
      periodWithLogs("2026-07-01", "2026-07-03", { 1: { lower_back_pain: 0 } }),
      periodWithLogs("2026-06-01", "2026-06-03", { 1: { lower_back_pain: 0 } }),
    ];

    expect(generateBackPainRecurrenceObservation(periods)).toBeNull();
  });
});
