import { describe, expect, it } from "vitest";

import { formatEvidenceCaption } from "./presentation";
import type { Observation } from "@/types/patterns";

function makeObservation(type: Observation["type"], evidence: Observation["evidence"]): Observation {
  return {
    id: type,
    type,
    title: "x",
    statement: "x",
    evidence,
    sufficiency: "sufficient",
    window: { description: "fallback description" },
    generatedAt: "2026-09-01T00:00:00.000Z",
  };
}

describe("formatEvidenceCaption — human-readable, never a black-box percentage", () => {
  it("period duration", () => {
    const caption = formatEvidenceCaption(makeObservation("period_duration_range", { periodsConsidered: 4, minDays: 4, maxDays: 5 }));
    expect(caption).toBe("Based on 4 recent logged periods");
    expect(caption).not.toMatch(/%/);
  });

  it("peak-day types use usablePeriods, not the raw window size", () => {
    const caption = formatEvidenceCaption(
      makeObservation("cramp_peak_day", { periodsConsidered: 6, usablePeriods: 4, days: [1], recurrenceCount: 3 }),
    );
    expect(caption).toBe("Based on 4 recent logged periods");
  });

  it("recurrence types", () => {
    const caption = formatEvidenceCaption(makeObservation("back_pain_recurrence", { periodsConsidered: 5, occurrences: 3 }));
    expect(caption).toBe("Based on 5 recent periods");
  });

  it("check-in consistency", () => {
    const caption = formatEvidenceCaption(makeObservation("checkin_consistency", { daysConsidered: 14, checkedInDays: 10 }));
    expect(caption).toBe("Based on the last 14 days");
  });

  it("mood trend", () => {
    const caption = formatEvidenceCaption(
      makeObservation("mood_trend", {
        recentWindowDays: 7,
        recentLoggedCount: 6,
        recentAverage: 4,
        priorWindowDays: 7,
        priorLoggedCount: 5,
        priorAverage: 7,
      }),
    );
    expect(caption).toBe("Based on 6 recent logged days vs 5 prior logged days");
  });
});
