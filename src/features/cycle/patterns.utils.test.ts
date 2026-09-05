import { describe, expect, it } from "vitest";

import {
  countDaysLogged,
  findLowEnergyHighStressPattern,
  loggingConsistency,
  toTrendPoints,
} from "./patterns.utils";
import type { CycleEntry } from "@/types/cycle";

const TODAY = new Date("2026-09-10T00:00:00.000Z");

function entry(date: string, overrides: Partial<CycleEntry> = {}): CycleEntry {
  return {
    user_id: "user-1",
    date,
    phase: "luteal",
    mood: 5,
    energy: 5,
    sleep: 5,
    libido: 5,
    stress: 5,
    symptoms: [],
    ...overrides,
  };
}

describe("countDaysLogged", () => {
  it("counts only entries within the trailing window", () => {
    const cycles = [
      entry("2026-09-10"),
      entry("2026-09-05"),
      entry("2026-08-20"),
    ];

    expect(countDaysLogged(cycles, 7, TODAY)).toBe(2);
  });

  it("returns 0 for no entries", () => {
    expect(countDaysLogged([], 7, TODAY)).toBe(0);
  });
});

describe("loggingConsistency", () => {
  it("computes a real percentage from logged entries", () => {
    const cycles = [entry("2026-09-10"), entry("2026-09-09"), entry("2026-09-08")];
    expect(loggingConsistency(cycles, 6, TODAY)).toBe(50);
  });

  it("returns null for a zero-length window rather than dividing by zero", () => {
    expect(loggingConsistency([entry("2026-09-10")], 0, TODAY)).toBeNull();
  });
});

describe("toTrendPoints", () => {
  it("returns real mood/energy points sorted oldest first", () => {
    const cycles = [
      entry("2026-09-10", { mood: 8, energy: 7 }),
      entry("2026-09-08", { mood: 3, energy: 4 }),
    ];

    expect(toTrendPoints(cycles)).toEqual([
      { date: "2026-09-08", mood: 3, energy: 4 },
      { date: "2026-09-10", mood: 8, energy: 7 },
    ]);
  });

  it("returns an empty array for no entries (never fabricates points)", () => {
    expect(toTrendPoints([])).toEqual([]);
  });
});

describe("findLowEnergyHighStressPattern", () => {
  it("counts real co-occurrences of low energy and high stress", () => {
    const cycles = [
      entry("2026-09-10", { energy: 2, stress: 8 }),
      entry("2026-09-09", { energy: 2, stress: 8 }),
      entry("2026-09-08", { energy: 9, stress: 1 }),
    ];

    expect(findLowEnergyHighStressPattern(cycles)).toEqual({
      matchCount: 2,
      totalCount: 3,
    });
  });

  it("returns zero matches honestly when there are no logged entries", () => {
    expect(findLowEnergyHighStressPattern([])).toEqual({ matchCount: 0, totalCount: 0 });
  });
});
