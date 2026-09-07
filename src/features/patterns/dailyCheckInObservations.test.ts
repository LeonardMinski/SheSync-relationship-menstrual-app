import { subDays } from "date-fns";
import { describe, expect, it } from "vitest";

import { generateCheckInConsistencyObservation, generateMoodTrendObservation } from "./dailyCheckInObservations";

const TODAY = new Date("2026-09-15T12:00:00.000Z");

function daysAgoKey(n: number): string {
  return subDays(TODAY, n).toISOString().split("T")[0];
}

describe("generateCheckInConsistencyObservation", () => {
  it("counts distinct checked-in days within the last 14 days (complete window)", () => {
    const entries = Array.from({ length: 14 }, (_, i) => ({ date: daysAgoKey(i) }));

    const result = generateCheckInConsistencyObservation(entries, TODAY);

    expect(result?.evidence).toEqual({ daysConsidered: 14, checkedInDays: 14 });
    expect(result?.statement).toBe("You checked in on 14 of the past 14 days.");
  });

  it("counts a partial window correctly", () => {
    const entries = [daysAgoKey(0), daysAgoKey(1), daysAgoKey(3), daysAgoKey(13)].map((date) => ({ date }));

    const result = generateCheckInConsistencyObservation(entries, TODAY);

    expect(result?.evidence.checkedInDays).toBe(4);
    expect(result?.statement).toBe("You checked in on 4 of the past 14 days.");
  });

  it("ignores entries outside the 14-day window", () => {
    const entries = [daysAgoKey(0), daysAgoKey(20)].map((date) => ({ date }));

    const result = generateCheckInConsistencyObservation(entries, TODAY);

    expect(result?.evidence.checkedInDays).toBe(1);
  });

  it("returns null when there are zero check-ins in the window (missing days)", () => {
    expect(generateCheckInConsistencyObservation([], TODAY)).toBeNull();
  });

  it("de-duplicates by date rather than double counting", () => {
    const entries = [{ date: daysAgoKey(0) }, { date: daysAgoKey(0) }];

    expect(generateCheckInConsistencyObservation(entries, TODAY)?.evidence.checkedInDays).toBe(1);
  });
});

describe("generateMoodTrendObservation", () => {
  it("returns null when the recent window doesn't have enough logged days (insufficient)", () => {
    const entries = [
      { date: daysAgoKey(0), mood: 5 },
      { date: daysAgoKey(1), mood: 5 },
      // Only 2 of 7 recent days logged — below minLoggedPerWindow (4).
      ...[7, 8, 9, 10, 11, 12, 13].map((n) => ({ date: daysAgoKey(n), mood: 8 })),
    ];

    expect(generateMoodTrendObservation(entries, TODAY)).toBeNull();
  });

  it("returns null when the prior window doesn't have enough logged days (insufficient)", () => {
    const entries = [
      ...[0, 1, 2, 3, 4].map((n) => ({ date: daysAgoKey(n), mood: 5 })),
      { date: daysAgoKey(7), mood: 8 },
      { date: daysAgoKey(8), mood: 8 },
    ];

    expect(generateMoodTrendObservation(entries, TODAY)).toBeNull();
  });

  it("reports a real 'lower' trend using a true numeric average, both windows valid", () => {
    const recent = [0, 1, 2, 3].map((n) => ({ date: daysAgoKey(n), mood: 3 })); // avg 3
    const prior = [7, 8, 9, 10].map((n) => ({ date: daysAgoKey(n), mood: 7 })); // avg 7

    const result = generateMoodTrendObservation([...recent, ...prior], TODAY);

    expect(result?.evidence).toEqual({
      recentWindowDays: 7,
      recentLoggedCount: 4,
      recentAverage: 3,
      priorWindowDays: 7,
      priorLoggedCount: 4,
      priorAverage: 7,
    });
    expect(result?.statement).toBe("Your average mood was lower over the last 7 logged days than the previous 7.");
  });

  it("reports a real 'higher' trend the other direction", () => {
    const recent = [0, 1, 2, 3].map((n) => ({ date: daysAgoKey(n), mood: 9 }));
    const prior = [7, 8, 9, 10].map((n) => ({ date: daysAgoKey(n), mood: 4 }));

    const result = generateMoodTrendObservation([...recent, ...prior], TODAY);

    expect(result?.statement).toBe("Your average mood was higher over the last 7 logged days than the previous 7.");
  });

  it("returns null (no invalid categorical averaging, nothing to say) when both windows average the same", () => {
    const recent = [0, 1, 2, 3].map((n) => ({ date: daysAgoKey(n), mood: 5 }));
    const prior = [7, 8, 9, 10].map((n) => ({ date: daysAgoKey(n), mood: 5 }));

    expect(generateMoodTrendObservation([...recent, ...prior], TODAY)).toBeNull();
  });

  it("never says WHY the mood changed — the statement is purely comparative", () => {
    const recent = [0, 1, 2, 3].map((n) => ({ date: daysAgoKey(n), mood: 3 }));
    const prior = [7, 8, 9, 10].map((n) => ({ date: daysAgoKey(n), mood: 7 }));

    const result = generateMoodTrendObservation([...recent, ...prior], TODAY);

    expect(result?.statement).not.toMatch(/because|due to|caused|declining|improving/i);
  });
});
