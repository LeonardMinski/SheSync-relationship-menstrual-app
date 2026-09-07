import { addDays, format, subDays } from "date-fns";
import { describe, expect, it } from "vitest";

import { generateObservations, selectHomeObservation } from "./engine";
import type { PeriodWithDayLogs } from "./periodObservations";
import type { Observation } from "@/types/patterns";
import type { Period, PeriodDayLog } from "@/types/period";

const TODAY = new Date("2026-09-15T12:00:00.000Z");

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

function periodWithLogs(
  startDate: string,
  endDate: string,
  dayOverrides: Record<number, Partial<PeriodDayLog>> = {},
): PeriodWithDayLogs {
  const start = new Date(`${startDate}T00:00:00`);
  const logs = Object.entries(dayOverrides).map(([dayStr, overrides]) => {
    const dateKey = format(addDays(start, Number(dayStr) - 1), "yyyy-MM-dd");
    return log({ date: dateKey, ...overrides });
  });
  return { period: period(startDate, endDate), logs };
}

function daysAgoKey(n: number): string {
  return subDays(TODAY, n).toISOString().split("T")[0];
}

describe("generateObservations", () => {
  it("returns an empty array for a brand-new user with no data — never fabricates", () => {
    expect(generateObservations({ periods: [], cycleEntries: [], today: TODAY })).toEqual([]);
  });

  it("combines every generator's real output, omitting anything null", () => {
    const periods: PeriodWithDayLogs[] = [
      periodWithLogs("2026-08-01", "2026-08-04", { 1: { cramps: 7, lower_back_pain: 4 } }),
      periodWithLogs("2026-07-01", "2026-07-04", { 1: { cramps: 8, lower_back_pain: 5 } }),
      periodWithLogs("2026-06-01", "2026-06-04", { 1: { cramps: 6, lower_back_pain: 3 } }),
    ];
    const cycleEntries = Array.from({ length: 14 }, (_, i) => ({ date: daysAgoKey(i), mood: 5 }));

    const observations = generateObservations({ periods, cycleEntries, today: TODAY });
    const types = observations.map((o) => o.type);

    expect(types).toContain("period_duration_range");
    expect(types).toContain("cramp_peak_day");
    expect(types).toContain("back_pain_recurrence");
    expect(types).toContain("checkin_consistency");
    // mood_trend never appears here — every entry has the same mood (5), no real trend.
    expect(types).not.toContain("mood_trend");
  });
});

function makeObservation(type: Observation["type"], sufficiency: Observation["sufficiency"] = "sufficient"): Observation {
  return {
    id: type,
    type,
    title: type,
    statement: `stub for ${type}`,
    evidence: { periodsConsidered: 3, occurrences: 2 },
    sufficiency,
    window: { description: "test window" },
    generatedAt: TODAY.toISOString(),
  };
}

describe("selectHomeObservation", () => {
  it("returns null (falls back to 'Still learning') when there are no observations at all", () => {
    expect(selectHomeObservation([], false)).toBeNull();
  });

  it("returns null when only insufficient/emerging evidence exists — Home's single slot needs sufficient evidence", () => {
    const observations = [makeObservation("period_duration_range", "emerging")];

    expect(selectHomeObservation(observations, false)).toBeNull();
  });

  it("active period: prioritises cramp peak over flow peak and fatigue peak", () => {
    const observations = [
      makeObservation("fatigue_peak_day"),
      makeObservation("heaviest_flow_day"),
      makeObservation("cramp_peak_day"),
    ];

    expect(selectHomeObservation(observations, true)?.type).toBe("cramp_peak_day");
  });

  it("active period: falls back to flow peak when no cramp peak observation exists", () => {
    const observations = [makeObservation("fatigue_peak_day"), makeObservation("heaviest_flow_day")];

    expect(selectHomeObservation(observations, true)?.type).toBe("heaviest_flow_day");
  });

  it("active period: falls back to the first recurring-symptom type in the fixed tie-break order", () => {
    const observations = [makeObservation("nausea_recurrence"), makeObservation("headache_recurrence")];

    expect(selectHomeObservation(observations, true)?.type).toBe("headache_recurrence");
  });

  it("between periods: prioritises duration range over everything else", () => {
    const observations = [makeObservation("mood_trend"), makeObservation("period_duration_range")];

    expect(selectHomeObservation(observations, false)?.type).toBe("period_duration_range");
  });

  it("between periods: falls back through recurring symptoms, then check-in consistency, then mood trend", () => {
    expect(selectHomeObservation([makeObservation("checkin_consistency"), makeObservation("mood_trend")], false)?.type).toBe(
      "checkin_consistency",
    );
    expect(selectHomeObservation([makeObservation("mood_trend")], false)?.type).toBe("mood_trend");
  });

  it("priority selection is deterministic — same input always yields the same output", () => {
    const observations = [makeObservation("mood_trend"), makeObservation("checkin_consistency"), makeObservation("period_duration_range")];

    const first = selectHomeObservation(observations, false);
    const second = selectHomeObservation(observations, false);

    expect(first).toEqual(second);
    expect(first?.type).toBe("period_duration_range");
  });
});
