import { describe, expect, it } from "vitest";

import { buildWeekStrip } from "./weekStrip";
import type { CycleEntry } from "@/types/cycle";
import type { Period, PeriodSummary } from "@/types/period";

// Wednesday, matching the Mon-Sun week 2026-08-31 .. 2026-09-06.
const TODAY = new Date("2026-09-02T12:00:00.000Z");

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

function completedPeriod(startDate: string, endDate: string): PeriodSummary {
  return {
    id: `period-${startDate}`,
    start_date: startDate,
    end_date: endDate,
    isActive: false,
    durationDays: 3,
    loggedDayCount: 3,
  };
}

describe("buildWeekStrip", () => {
  it("returns the Monday-Sunday calendar week containing today", () => {
    const days = buildWeekStrip({ cycles: [], activePeriod: null, periodHistory: [], today: TODAY });

    expect(days).toHaveLength(7);
    expect(days[0].dateKey).toBe("2026-08-31"); // Monday
    expect(days[6].dateKey).toBe("2026-09-06"); // Sunday
    expect(days.map((d) => d.dayLabel)).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
  });

  it("marks today and future days correctly", () => {
    const days = buildWeekStrip({ cycles: [], activePeriod: null, periodHistory: [], today: TODAY });
    const todayCell = days.find((d) => d.dateKey === "2026-09-02");
    const futureCell = days.find((d) => d.dateKey === "2026-09-06");

    expect(todayCell?.isToday).toBe(true);
    expect(futureCell?.isFuture).toBe(true);
  });

  it("reads mood strictly from cycle_data entries, independent of period status", () => {
    const days = buildWeekStrip({
      cycles: [cycle("2026-09-01", 8)],
      activePeriod: null,
      periodHistory: [],
      today: TODAY,
    });

    const day = days.find((d) => d.dateKey === "2026-09-01");
    expect(day?.mood).toBe(8);
    expect(day?.isPeriodDay).toBe(false);
  });

  it("reads period-day status strictly from period ranges, independent of mood", () => {
    const days = buildWeekStrip({
      cycles: [],
      activePeriod: null,
      periodHistory: [completedPeriod("2026-08-31", "2026-09-01")],
      today: TODAY,
    });

    const periodDay = days.find((d) => d.dateKey === "2026-09-01");
    const nonPeriodDay = days.find((d) => d.dateKey === "2026-09-02");
    expect(periodDay?.isPeriodDay).toBe(true);
    expect(periodDay?.mood).toBeNull();
    expect(nonPeriodDay?.isPeriodDay).toBe(false);
  });

  it("shows a day as both a mood entry and a period day when both are real, without conflating the two values", () => {
    const days = buildWeekStrip({
      cycles: [cycle("2026-09-01", 3)],
      activePeriod: null,
      periodHistory: [completedPeriod("2026-08-31", "2026-09-01")],
      today: TODAY,
    });

    const day = days.find((d) => d.dateKey === "2026-09-01");
    expect(day?.mood).toBe(3);
    expect(day?.isPeriodDay).toBe(true);
    expect(day?.hasData).toBe(true);
  });

  it("treats an active (unended) period as covering through today", () => {
    const activePeriod: Period = {
      id: "active-1",
      user_id: "user-1",
      start_date: "2026-09-01",
      end_date: null,
      created_at: "2026-09-01T00:00:00.000Z",
      updated_at: "2026-09-01T00:00:00.000Z",
    };
    const days = buildWeekStrip({ cycles: [], activePeriod, periodHistory: [], today: TODAY });

    expect(days.find((d) => d.dateKey === "2026-09-01")?.isPeriodDay).toBe(true);
    expect(days.find((d) => d.dateKey === "2026-09-02")?.isPeriodDay).toBe(true);
    // Future days within the active period's calendar week are not yet
    // "period days" — the period can't extend into a day that hasn't happened.
    expect(days.find((d) => d.dateKey === "2026-09-06")?.isPeriodDay).toBe(false);
  });

  it("has no data for an unlogged day", () => {
    const days = buildWeekStrip({ cycles: [], activePeriod: null, periodHistory: [], today: TODAY });
    const day = days.find((d) => d.dateKey === "2026-08-31");

    expect(day?.mood).toBeNull();
    expect(day?.isPeriodDay).toBe(false);
    expect(day?.hasData).toBe(false);
  });
});
