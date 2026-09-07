import { describe, expect, it } from "vitest";

import { buildMonthGrid, buildMonthlySummary } from "./history.utils";
import type { CycleEntry } from "@/types/cycle";
import type { PeriodSummary } from "@/types/period";

const SEPT_2026 = new Date("2026-09-15T12:00:00.000Z");

function cycle(date: string, mood: number): CycleEntry {
  return {
    id: date,
    user_id: "user-1",
    date,
    phase: "follicular",
    mood,
    energy: 5,
    sleep: 5,
    libido: 5,
    stress: 5,
    symptoms: [],
  };
}

function period(startDate: string, endDate: string): PeriodSummary {
  return {
    id: `period-${startDate}`,
    start_date: startDate,
    end_date: endDate,
    isActive: false,
    durationDays: 3,
    loggedDayCount: 3,
  };
}

describe("buildMonthGrid", () => {
  it("pads to full Monday-Sunday weeks and marks days outside the month", () => {
    const days = buildMonthGrid({ monthDate: SEPT_2026, cycles: [], activePeriod: null, periodHistory: [], today: SEPT_2026 });

    expect(days.length % 7).toBe(0);
    expect(days[0].dateKey <= "2026-09-01").toBe(true);
    expect(days.some((d) => d.dateKey === "2026-09-01" && d.inCurrentMonth)).toBe(true);
    expect(days.some((d) => !d.inCurrentMonth)).toBe(true);
  });

  it("keeps mood and period-day as separate, independently-sourced fields", () => {
    const days = buildMonthGrid({
      monthDate: SEPT_2026,
      cycles: [cycle("2026-09-05", 6)],
      activePeriod: null,
      periodHistory: [period("2026-09-05", "2026-09-07")],
      today: SEPT_2026,
    });

    const day5 = days.find((d) => d.dateKey === "2026-09-05");
    const day6 = days.find((d) => d.dateKey === "2026-09-06");
    expect(day5?.mood).toBe(6);
    expect(day5?.isPeriodDay).toBe(true);
    expect(day5?.periodId).toBe("period-2026-09-05");
    expect(day6?.mood).toBeNull();
    expect(day6?.isPeriodDay).toBe(true);
  });

  it("marks days after today as future", () => {
    const days = buildMonthGrid({ monthDate: SEPT_2026, cycles: [], activePeriod: null, periodHistory: [], today: SEPT_2026 });
    const future = days.find((d) => d.dateKey === "2026-09-30");
    const past = days.find((d) => d.dateKey === "2026-09-01");

    expect(future?.isFuture).toBe(true);
    expect(past?.isFuture).toBe(false);
  });
});

describe("buildMonthlySummary", () => {
  it("returns zeroed/null stats with no real data", () => {
    const summary = buildMonthlySummary({ monthDate: SEPT_2026, cycles: [], activePeriod: null, periodHistory: [] });

    expect(summary.daysCheckedIn).toBe(0);
    expect(summary.averageMood).toBeNull();
    expect(summary.mostCommonMood).toBeNull();
    expect(summary.periodDaysLogged).toBe(0);
  });

  it("computes a true numeric average from the real 1-10 mood scale, not a fabricated conversion", () => {
    const summary = buildMonthlySummary({
      monthDate: SEPT_2026,
      cycles: [cycle("2026-09-01", 4), cycle("2026-09-02", 8)],
      activePeriod: null,
      periodHistory: [],
    });

    expect(summary.daysCheckedIn).toBe(2);
    expect(summary.averageMood).toBe(6);
  });

  it("only counts mood entries that actually fall within the displayed month", () => {
    const summary = buildMonthlySummary({
      monthDate: SEPT_2026,
      cycles: [cycle("2026-09-01", 10), cycle("2026-08-31", 2)],
      activePeriod: null,
      periodHistory: [],
    });

    expect(summary.daysCheckedIn).toBe(1);
    expect(summary.averageMood).toBe(10);
  });

  it("reports the most frequent mood label using the same five-label vocabulary as the check-in UI", () => {
    const summary = buildMonthlySummary({
      monthDate: SEPT_2026,
      cycles: [cycle("2026-09-01", 8), cycle("2026-09-02", 8), cycle("2026-09-03", 2)],
      activePeriod: null,
      periodHistory: [],
    });

    expect(summary.mostCommonMood).toBe("Good");
  });

  it("counts period days actually logged within the month only", () => {
    const summary = buildMonthlySummary({
      monthDate: SEPT_2026,
      cycles: [],
      activePeriod: null,
      periodHistory: [period("2026-08-30", "2026-09-02")],
    });

    // Aug 30-31 are outside September; only Sept 1-2 count.
    expect(summary.periodDaysLogged).toBe(2);
  });
});
