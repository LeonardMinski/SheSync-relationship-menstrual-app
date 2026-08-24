import { describe, expect, it } from "vitest";

import {
  buildDashboardSummary,
  getLatestCycle,
  scoreToEnergy,
  scoreToMood,
  scoreToStress,
  toPhaseLabel,
} from "./dashboard.utils";

import type { DashboardCycleLog } from "@/types/dashboard";

describe("dashboard utils", () => {
  it("returns the latest cycle without mutating the input array", () => {
    const cycles: DashboardCycleLog[] = [
      { date: "2026-08-20", phase: "menstrual", mood: 3 },
      { date: "2026-08-24", phase: "follicular", mood: 7 },
      { date: "2026-08-21", phase: "luteal", mood: 5 },
    ];
    const originalOrder = cycles.map((cycle) => cycle.date);

    expect(getLatestCycle(cycles)).toEqual(cycles[1]);
    expect(cycles.map((cycle) => cycle.date)).toEqual(originalOrder);
  });

  it("returns undefined when there are no cycles", () => {
    expect(getLatestCycle([])).toBeUndefined();
  });

  it("formats a known phase and keeps missing phase unknown", () => {
    expect(toPhaseLabel("follicular")).toBe("Follicular Phase");
    expect(toPhaseLabel(null)).toBeNull();
    expect(toPhaseLabel(undefined)).toBeNull();
  });

  it("maps scores to labels but keeps missing scores unknown", () => {
    expect(scoreToMood(8)).toBe("Energetic");
    expect(scoreToMood(5)).toBe("Calm");
    expect(scoreToMood(1)).toBe("Tender");
    expect(scoreToMood(null)).toBeNull();

    expect(scoreToEnergy(8)).toBe("High");
    expect(scoreToEnergy(5)).toBe("Good");
    expect(scoreToEnergy(1)).toBe("Low");
    expect(scoreToEnergy(undefined)).toBeNull();

    expect(scoreToStress(8)).toBe("Peak");
    expect(scoreToStress(5)).toBe("Mild");
    expect(scoreToStress(1)).toBe("Calm");
    expect(scoreToStress(null)).toBeNull();
  });

  it("builds a dashboard summary without fabricated fallback values", () => {
    expect(buildDashboardSummary([], "2026-08-24")).toEqual({
      todaysLog: undefined,
      latestLog: undefined,
      phaseLabel: null,
      cycleDay: null,
    });
  });
});
