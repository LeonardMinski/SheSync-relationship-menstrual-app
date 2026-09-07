import { describe, expect, it } from "vitest";

import { findCycleForDate, toCycleDateKey } from "./cycle.utils";

import type { CycleEntry } from "@/types/cycle";

const cycles: CycleEntry[] = [
  {
    id: "1",
    user_id: "user-1",
    date: "2026-08-24",
    phase: "follicular",
    mood: 8,
    energy: 7,
    sleep: 6,
    libido: 6,
    stress: 2,
    symptoms: ["Cramps"],
    notes: "Logged",
  },
];

describe("cycle utils", () => {
  it("normalises dates to stable cycle date keys", () => {
    expect(toCycleDateKey("2026-08-24T13:00:00.000Z")).toBe("2026-08-24");
  });

  it("finds a cycle entry by calendar date", () => {
    expect(findCycleForDate(cycles, new Date("2026-08-24T13:00:00"))).toEqual(
      cycles[0],
    );
    expect(findCycleForDate(cycles, new Date("2026-08-25T13:00:00")))
      .toBeUndefined();
  });
});
