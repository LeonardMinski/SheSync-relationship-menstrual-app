import { describe, expect, it } from "vitest";

import {
  getAverageCycleLength,
  getPeriodDay,
  getPeriodDuration,
  isPeriodActive,
  toPeriodSummary,
} from "./period.utils";
import type { Period } from "@/types/period";

function period(overrides: Partial<Period> = {}): Period {
  return {
    id: "period-1",
    user_id: "user-1",
    start_date: "2026-08-03",
    end_date: null,
    created_at: "2026-08-03T00:00:00.000Z",
    updated_at: "2026-08-03T00:00:00.000Z",
    ...overrides,
  };
}

describe("getPeriodDay", () => {
  it("returns day 1 on the start date", () => {
    expect(getPeriodDay(period(), "2026-08-03")).toBe(1);
  });

  it("returns day 3 two days after the start date", () => {
    expect(getPeriodDay(period(), "2026-08-05")).toBe(3);
  });
});

describe("getPeriodDuration", () => {
  it("is null while the period is still active", () => {
    expect(getPeriodDuration(period({ end_date: null }))).toBeNull();
  });

  it("is inclusive of both the start and end date", () => {
    // Aug 3 - Aug 7 is 5 days: 3, 4, 5, 6, 7.
    expect(
      getPeriodDuration(period({ start_date: "2026-08-03", end_date: "2026-08-07" })),
    ).toBe(5);
  });

  it("is 1 for a period that starts and ends the same day", () => {
    expect(
      getPeriodDuration(period({ start_date: "2026-08-03", end_date: "2026-08-03" })),
    ).toBe(1);
  });
});

describe("isPeriodActive", () => {
  it("is active when end_date is null", () => {
    expect(isPeriodActive(period({ end_date: null }))).toBe(true);
  });

  it("is not active once end_date is set", () => {
    expect(isPeriodActive(period({ end_date: "2026-08-07" }))).toBe(false);
  });
});

describe("toPeriodSummary", () => {
  it("counts logged days and derives duration/active state", () => {
    const summary = toPeriodSummary(
      period({ start_date: "2026-08-03", end_date: "2026-08-07" }),
      [{ id: "log-1" }, { id: "log-2" }],
    );

    expect(summary).toEqual({
      id: "period-1",
      start_date: "2026-08-03",
      end_date: "2026-08-07",
      isActive: false,
      durationDays: 5,
      loggedDayCount: 2,
    });
  });
});

describe("getAverageCycleLength", () => {
  it("returns null with fewer than 3 completed periods", () => {
    expect(
      getAverageCycleLength([
        period({ start_date: "2026-08-03" }),
        period({ start_date: "2026-07-01" }),
      ]),
    ).toBeNull();
  });

  it("averages start-to-start intervals across completed periods", () => {
    // Newest first, as history is normally ordered.
    const periods = [
      period({ start_date: "2026-09-05" }),
      period({ start_date: "2026-08-03" }), // 33-day interval to Sept 5
      period({ start_date: "2026-07-01" }), // 33-day interval to Aug 3
    ];

    expect(getAverageCycleLength(periods)).toBe(33);
  });

  it("rounds to one decimal place", () => {
    const periods = [
      period({ start_date: "2026-09-04" }), // 32-day interval from Aug 3
      period({ start_date: "2026-08-03" }), // 33-day interval from Jul 1
      period({ start_date: "2026-07-01" }),
    ];

    expect(getAverageCycleLength(periods)).toBe(32.5);
  });
});
