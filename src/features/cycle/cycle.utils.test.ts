import { describe, expect, it } from "vitest";

import {
  defaultCycleLogFormState,
  findCycleForDate,
  getPhaseMarker,
  getRecentCycleEntries,
  toCycleDateKey,
  toCycleLogFormState,
  toCycleLogPayload,
} from "./cycle.utils";

import type { CycleEntry } from "@/types/cycle";

const cycles: CycleEntry[] = [
  {
    id: "1",
    user_id: "user-1",
    date: "2026-08-24",
    phase: "follicular",
    mood: 8,
    energy: 7,
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

  it("maps an existing entry into form state", () => {
    expect(toCycleLogFormState(cycles[0])).toEqual({
      phase: "follicular",
      mood: 8,
      energy: 7,
      libido: 6,
      stress: 2,
      symptoms: ["Cramps"],
      notes: "Logged",
    });
  });

  it("uses explicit form defaults when there is no existing entry", () => {
    expect(toCycleLogFormState()).toEqual(defaultCycleLogFormState);
  });

  it("returns recent entries without mutating the source array", () => {
    const entries = Array.from({ length: 6 }, (_, index) => ({
      ...cycles[0],
      id: String(index),
      date: `2026-08-${20 + index}`,
    }));
    const originalIds = entries.map((entry) => entry.id);

    expect(getRecentCycleEntries(entries)).toHaveLength(5);
    expect(entries.map((entry) => entry.id)).toEqual(originalIds);
  });

  it("keeps missing phase presentation unknown", () => {
    expect(getPhaseMarker("menstrual")).toBe("M");
    expect(getPhaseMarker("follicular")).toBe("F");
    expect(getPhaseMarker("ovulation")).toBe("O");
    expect(getPhaseMarker("luteal")).toBe("L");
    expect(getPhaseMarker(null)).toBeNull();
  });

  it("does not create a log payload without an explicit phase", () => {
    expect(
      toCycleLogPayload({
        selectedDate: new Date("2026-08-24T13:00:00"),
        formState: defaultCycleLogFormState,
      }),
    ).toBeNull();
  });

  it("uses the selected entry phase when the form phase is blank", () => {
    expect(
      toCycleLogPayload({
        selectedDate: new Date("2026-08-24T13:00:00"),
        selectedData: cycles[0],
        formState: {
          ...defaultCycleLogFormState,
          phase: "",
          symptoms: ["Fatigue"],
          notes: "Follow-up",
        },
      }),
    ).toEqual({
      date: "2026-08-24",
      phase: "follicular",
      mood: 5,
      energy: 5,
      libido: 5,
      stress: 5,
      symptoms: ["Fatigue"],
      notes: "Follow-up",
    });
  });
});
