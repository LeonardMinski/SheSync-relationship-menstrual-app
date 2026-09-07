import { describe, expect, it } from "vitest";

import { DAILY_MOOD_OPTIONS, moodValueToLabel } from "./dailyCheckIn";

describe("DAILY_MOOD_OPTIONS", () => {
  it("uses real points on the existing 1-10 cycle_data mood scale, not a separate model", () => {
    for (const option of DAILY_MOOD_OPTIONS) {
      expect(option.value).toBeGreaterThanOrEqual(1);
      expect(option.value).toBeLessThanOrEqual(10);
      expect(Number.isInteger(option.value)).toBe(true);
    }
  });

  it("has exactly five distinct, ascending options", () => {
    expect(DAILY_MOOD_OPTIONS).toHaveLength(5);
    const values = DAILY_MOOD_OPTIONS.map((o) => o.value);
    expect(values).toEqual([...values].sort((a, b) => a - b));
    expect(new Set(values).size).toBe(5);
  });
});

describe("moodValueToLabel", () => {
  it("maps each anchor value back to its own label", () => {
    for (const option of DAILY_MOOD_OPTIONS) {
      expect(moodValueToLabel(option.value)).toBe(option.label);
    }
  });

  it("maps an unambiguous in-between value to the nearest anchor", () => {
    expect(moodValueToLabel(1)).toBe("Very low");
  });

  it("breaks an exact tie toward the lower (more cautious) label", () => {
    // Anchors are spaced by 2 (2/4/6/8/10), so every odd value between two
    // anchors is an exact tie — e.g. 5 is equidistant from Low(4) and
    // Okay(6). moodValueToLabel resolves ties to whichever anchor it visits
    // first in ascending order, i.e. the lower label.
    expect(moodValueToLabel(5)).toBe("Low");
    expect(moodValueToLabel(9)).toBe("Good");
  });
});
