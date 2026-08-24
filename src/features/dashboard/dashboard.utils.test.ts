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

  it("returns the only cycle when a single item is provided", () => {
    const cycles: DashboardCycleLog[] = [
      { date: "2026-08-24", phase: "follicular", mood: 7 },
    ];

    expect(getLatestCycle(cycles)).toBe(cycles[0]);
  });

  it("returns undefined when there are no cycles", () => {
    expect(getLatestCycle([])).toBeUndefined();
  });

  it("formats a known phase and keeps missing phase unknown", () => {
    expect(toPhaseLabel("follicular")).toBe("Follicular Phase");
    expect(toPhaseLabel(null)).toBeNull();
    expect(toPhaseLabel(undefined)).toBeNull();
  });

  it("maps mood scores at threshold boundaries and keeps missing scores unknown", () => {
    expect(scoreToMood(1)).toBe("Tender");
    expect(scoreToMood(4)).toBe("Tender");
    expect(scoreToMood(5)).toBe("Calm");
    expect(scoreToMood(7)).toBe("Calm");
    expect(scoreToMood(8)).toBe("Energetic");
    expect(scoreToMood(10)).toBe("Energetic");
    expect(scoreToMood(null)).toBeNull();
    expect(scoreToMood(undefined)).toBeNull();
  });

  it("maps energy scores at threshold boundaries and keeps missing scores unknown", () => {
    expect(scoreToEnergy(1)).toBe("Low");
    expect(scoreToEnergy(4)).toBe("Low");
    expect(scoreToEnergy(5)).toBe("Good");
    expect(scoreToEnergy(7)).toBe("Good");
    expect(scoreToEnergy(8)).toBe("High");
    expect(scoreToEnergy(10)).toBe("High");
    expect(scoreToEnergy(null)).toBeNull();
    expect(scoreToEnergy(undefined)).toBeNull();
  });

  it("maps stress scores at threshold boundaries and keeps missing scores unknown", () => {
    expect(scoreToStress(1)).toBe("Calm");
    expect(scoreToStress(4)).toBe("Calm");
    expect(scoreToStress(5)).toBe("Mild");
    expect(scoreToStress(7)).toBe("Mild");
    expect(scoreToStress(8)).toBe("Peak");
    expect(scoreToStress(10)).toBe("Peak");
    expect(scoreToStress(null)).toBeNull();
    expect(scoreToStress(undefined)).toBeNull();
  });

  it("builds a dashboard summary without fabricated fallback values", () => {
    expect(buildDashboardSummary([], "2026-08-24")).toEqual({
      todaysLog: undefined,
      latestLog: undefined,
      phaseLabel: null,
      cycleDay: null,
    });
  });

  it("prefers today's log over a newer historical latest log", () => {
    const cycles: DashboardCycleLog[] = [
      { date: "2026-08-25", phase: "luteal" },
      { date: "2026-08-24", phase: "follicular" },
    ];

    expect(buildDashboardSummary(cycles, "2026-08-24")).toEqual({
      todaysLog: cycles[1],
      latestLog: cycles[1],
      phaseLabel: "Follicular Phase",
      cycleDay: null,
    });
  });
});
