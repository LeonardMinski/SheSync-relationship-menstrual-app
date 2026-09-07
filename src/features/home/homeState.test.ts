import { describe, expect, it } from "vitest";

import { deriveHomeState, deriveObservation } from "./homeState";
import type { Period, PeriodSummary } from "@/types/period";

const FORBIDDEN_PHRASES = [
  /estrogen/i,
  /progesterone/i,
  /hormone/i,
  /biological (trend|model)/i,
  /natural peak/i,
  /natural dip/i,
  /high model confidence/i,
  /fully encrypted/i,
  /automated calendar buffer/i,
  /has been notified/i,
  /automatically updat/i,
  /translation engine/i,
  /fully in sync/i,
  /relationship (score|health)/i,
  /compatibility score/i,
];

function expectNoForbiddenLanguage(text: string) {
  for (const phrase of FORBIDDEN_PHRASES) {
    expect(text).not.toMatch(phrase);
  }
}

const TODAY = new Date("2026-09-06T12:00:00.000Z");

function makeActivePeriod(startDate: string): Period {
  return {
    id: "period-active",
    user_id: "user-1",
    start_date: startDate,
    end_date: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

function makeCompletedPeriod(
  startDate: string,
  endDate: string,
  overrides: Partial<PeriodSummary> = {},
): PeriodSummary {
  return {
    id: `period-${startDate}`,
    start_date: startDate,
    end_date: endDate,
    isActive: false,
    durationDays: 5,
    loggedDayCount: 5,
    ...overrides,
  };
}

describe("deriveHomeState", () => {
  it("returns 'new' when no periods have ever been logged and none is active", () => {
    const state = deriveHomeState({ activePeriod: null, periodHistory: [], today: TODAY });

    expect(state.variant).toBe("new");
    expect(state.loggedPeriodCount).toBe(0);
    expect(state.hasEnoughHistoryForObservation).toBe(false);
  });

  it("returns 'active_period' whenever a period is currently active, regardless of history", () => {
    const state = deriveHomeState({
      activePeriod: makeActivePeriod("2026-09-04"),
      periodHistory: [],
      today: TODAY,
    });

    expect(state.variant).toBe("active_period");
    expect(state.periodDay).toBe(3); // Sept 4 -> Sept 6 is day 3
  });

  it("computes periodDay as 1 on the start date itself", () => {
    const state = deriveHomeState({
      activePeriod: makeActivePeriod("2026-09-06"),
      periodHistory: [],
      today: TODAY,
    });

    expect(state.periodDay).toBe(1);
  });

  it("returns 'just_ended' when the most recent period ended today", () => {
    const state = deriveHomeState({
      activePeriod: null,
      periodHistory: [makeCompletedPeriod("2026-09-01", "2026-09-06")],
      today: TODAY,
    });

    expect(state.variant).toBe("just_ended");
    expect(state.justEndedPeriod?.end_date).toBe("2026-09-06");
  });

  it("returns 'just_ended' when the most recent period ended yesterday", () => {
    const state = deriveHomeState({
      activePeriod: null,
      periodHistory: [makeCompletedPeriod("2026-08-28", "2026-09-05")],
      today: TODAY,
    });

    expect(state.variant).toBe("just_ended");
  });

  it("returns 'between_periods' once the most recent period ended more than a day ago", () => {
    const state = deriveHomeState({
      activePeriod: null,
      periodHistory: [makeCompletedPeriod("2026-08-20", "2026-08-25")],
      today: TODAY,
    });

    expect(state.variant).toBe("between_periods");
  });

  it("does not require 'enough history' evidence gate to reach between_periods with only 1 period logged", () => {
    const state = deriveHomeState({
      activePeriod: null,
      periodHistory: [makeCompletedPeriod("2026-08-01", "2026-08-06")],
      today: TODAY,
    });

    expect(state.variant).toBe("between_periods");
    expect(state.hasEnoughHistoryForObservation).toBe(false);
    expect(state.averageCycleLength).toBeNull();
  });

  it("flags hasEnoughHistoryForObservation once 3+ periods are logged, matching MIN_COMPLETED_PERIODS_FOR_AVERAGE", () => {
    const state = deriveHomeState({
      activePeriod: null,
      periodHistory: [
        makeCompletedPeriod("2026-08-01", "2026-08-06"),
        makeCompletedPeriod("2026-07-01", "2026-07-06"),
        makeCompletedPeriod("2026-06-01", "2026-06-06"),
      ],
      today: TODAY,
    });

    expect(state.hasEnoughHistoryForObservation).toBe(true);
    expect(state.averageCycleLength).not.toBeNull();
  });

  it("prioritises active_period over just_ended when somehow both a completed and an active period exist", () => {
    const state = deriveHomeState({
      activePeriod: makeActivePeriod("2026-09-06"),
      periodHistory: [makeCompletedPeriod("2026-08-01", "2026-08-06")],
      today: TODAY,
    });

    expect(state.variant).toBe("active_period");
  });

  it("always reports loggedPeriodCount as the full history length", () => {
    const state = deriveHomeState({
      activePeriod: null,
      periodHistory: [
        makeCompletedPeriod("2026-08-01", "2026-08-06"),
        makeCompletedPeriod("2026-07-01", "2026-07-06"),
      ],
      today: TODAY,
    });

    expect(state.loggedPeriodCount).toBe(2);
  });
});

describe("deriveObservation", () => {
  it("produces a Day N observation for active_period without unsupported claims", () => {
    const state = deriveHomeState({
      activePeriod: makeActivePeriod("2026-09-04"),
      periodHistory: [],
      today: TODAY,
    });
    const observation = deriveObservation(state);

    expect(observation.title).toBe("Day 3");
    expectNoForbiddenLanguage(observation.title);
    expectNoForbiddenLanguage(observation.body);
  });

  it("cites real duration and logged-day count for just_ended", () => {
    const state = deriveHomeState({
      activePeriod: null,
      periodHistory: [makeCompletedPeriod("2026-09-01", "2026-09-06", { durationDays: 6, loggedDayCount: 4 })],
      today: TODAY,
    });
    const observation = deriveObservation(state);

    expect(observation.body).toContain("6 days");
    expect(observation.body).toContain("4 days logged");
    expectNoForbiddenLanguage(observation.body);
  });

  it("shows a 'still learning' state for between_periods with fewer than 3 periods logged", () => {
    const state = deriveHomeState({
      activePeriod: null,
      periodHistory: [makeCompletedPeriod("2026-08-01", "2026-08-06")],
      today: TODAY,
    });
    const observation = deriveObservation(state);

    expect(observation.title).toBe("Still learning your pattern");
    expectNoForbiddenLanguage(observation.body);
  });

  it("shows a real average once enough history exists for between_periods", () => {
    const state = deriveHomeState({
      activePeriod: null,
      periodHistory: [
        makeCompletedPeriod("2026-08-01", "2026-08-06"),
        makeCompletedPeriod("2026-07-01", "2026-07-06"),
        makeCompletedPeriod("2026-06-01", "2026-06-06"),
      ],
      today: TODAY,
    });
    const observation = deriveObservation(state);

    expect(observation.title).toBe("Based on your history");
    expect(observation.body).toContain(String(state.averageCycleLength));
    expectNoForbiddenLanguage(observation.body);
  });

  it("shows an honest learning state for a brand new user, with no fake analytics claims", () => {
    const state = deriveHomeState({ activePeriod: null, periodHistory: [], today: TODAY });
    const observation = deriveObservation(state);

    expect(observation.body).not.toMatch(/personalized biological model/i);
    expect(observation.body).not.toMatch(/deep biological analysis/i);
    expect(observation.body).not.toMatch(/over the next 14 days/i);
    expectNoForbiddenLanguage(observation.body);
  });
});
