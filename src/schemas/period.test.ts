import { describe, expect, it } from "vitest";

import {
  EndPeriodInputSchema,
  StartPeriodInputSchema,
  UpsertPeriodDayLogInputSchema,
} from "./period";

function validLog(overrides: Record<string, unknown> = {}) {
  return {
    bleedingLevel: "medium",
    cramps: 4,
    lowerBackPain: 2,
    headache: "mild",
    bloating: "mild",
    fatigue: 6,
    nausea: "none",
    bowelChanges: "normal",
    mood: 5,
    painReliefUsed: false,
    activityImpact: "none",
    ...overrides,
  };
}

describe("StartPeriodInputSchema / EndPeriodInputSchema", () => {
  it("accepts an empty body (defaults to today server-side)", () => {
    expect(StartPeriodInputSchema.safeParse({}).success).toBe(true);
    expect(EndPeriodInputSchema.safeParse({}).success).toBe(true);
  });

  it("accepts a valid YYYY-MM-DD date", () => {
    expect(StartPeriodInputSchema.safeParse({ startDate: "2026-09-01" }).success).toBe(true);
  });

  it("rejects a malformed date", () => {
    expect(StartPeriodInputSchema.safeParse({ startDate: "09/01/2026" }).success).toBe(false);
  });

  it("rejects an arbitrary user_id field", () => {
    expect(
      StartPeriodInputSchema.safeParse({ user_id: "someone-elses-id" }).success,
    ).toBe(false);
  });
});

describe("StartPeriodInputSchema — Add Past Period (startDate + endDate)", () => {
  it("accepts a startDate/endDate pair for a completed historical period", () => {
    const result = StartPeriodInputSchema.safeParse({ startDate: "2026-08-01", endDate: "2026-08-05" });
    expect(result.success).toBe(true);
  });

  it("accepts endDate equal to startDate (a one-day period)", () => {
    expect(
      StartPeriodInputSchema.safeParse({ startDate: "2026-08-01", endDate: "2026-08-01" }).success,
    ).toBe(true);
  });

  it("rejects an endDate before the startDate", () => {
    const result = StartPeriodInputSchema.safeParse({ startDate: "2026-08-05", endDate: "2026-08-01" });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed endDate", () => {
    expect(
      StartPeriodInputSchema.safeParse({ startDate: "2026-08-01", endDate: "08/05/2026" }).success,
    ).toBe(false);
  });
});

describe("UpsertPeriodDayLogInputSchema enums", () => {
  it("accepts every valid bleeding level", () => {
    for (const level of ["spotting", "light", "medium", "heavy"]) {
      expect(UpsertPeriodDayLogInputSchema.safeParse(validLog({ bleedingLevel: level })).success).toBe(true);
    }
  });

  it("rejects an invalid bleeding level", () => {
    expect(
      UpsertPeriodDayLogInputSchema.safeParse(validLog({ bleedingLevel: "torrential" })).success,
    ).toBe(false);
  });

  it("accepts every valid bleeding colour, and accepts it omitted", () => {
    for (const colour of ["bright_red", "dark_red", "brown"]) {
      expect(
        UpsertPeriodDayLogInputSchema.safeParse(validLog({ bleedingColour: colour })).success,
      ).toBe(true);
    }
    expect(UpsertPeriodDayLogInputSchema.safeParse(validLog()).success).toBe(true);
  });

  it("rejects an invalid bleeding colour", () => {
    expect(
      UpsertPeriodDayLogInputSchema.safeParse(validLog({ bleedingColour: "pink" })).success,
    ).toBe(false);
  });

  it("accepts every valid clot level, defaults when omitted", () => {
    for (const clots of ["none", "small", "medium", "large"]) {
      expect(UpsertPeriodDayLogInputSchema.safeParse(validLog({ clots })).success).toBe(true);
    }
  });

  it("accepts every valid symptom severity for headache/bloating/nausea", () => {
    for (const severity of ["none", "mild", "moderate", "severe"]) {
      expect(
        UpsertPeriodDayLogInputSchema.safeParse(
          validLog({ headache: severity, bloating: severity, nausea: severity }),
        ).success,
      ).toBe(true);
    }
  });

  it("rejects an invalid symptom severity", () => {
    expect(
      UpsertPeriodDayLogInputSchema.safeParse(validLog({ headache: "extreme" })).success,
    ).toBe(false);
  });

  it("accepts every valid bowel change", () => {
    for (const bowelChanges of ["normal", "loose", "constipated", "more_frequent"]) {
      expect(
        UpsertPeriodDayLogInputSchema.safeParse(validLog({ bowelChanges })).success,
      ).toBe(true);
    }
  });

  it("accepts every valid activity impact", () => {
    for (const activityImpact of ["none", "some", "significant"]) {
      expect(
        UpsertPeriodDayLogInputSchema.safeParse(validLog({ activityImpact })).success,
      ).toBe(true);
    }
  });
});

describe("UpsertPeriodDayLogInputSchema numeric ranges", () => {
  it("cramps: rejects -1, accepts 0, accepts 10, rejects 11", () => {
    expect(UpsertPeriodDayLogInputSchema.safeParse(validLog({ cramps: -1 })).success).toBe(false);
    expect(UpsertPeriodDayLogInputSchema.safeParse(validLog({ cramps: 0 })).success).toBe(true);
    expect(UpsertPeriodDayLogInputSchema.safeParse(validLog({ cramps: 10 })).success).toBe(true);
    expect(UpsertPeriodDayLogInputSchema.safeParse(validLog({ cramps: 11 })).success).toBe(false);
  });

  it("lowerBackPain: rejects -1, accepts 0, accepts 10, rejects 11", () => {
    expect(UpsertPeriodDayLogInputSchema.safeParse(validLog({ lowerBackPain: -1 })).success).toBe(false);
    expect(UpsertPeriodDayLogInputSchema.safeParse(validLog({ lowerBackPain: 0 })).success).toBe(true);
    expect(UpsertPeriodDayLogInputSchema.safeParse(validLog({ lowerBackPain: 10 })).success).toBe(true);
    expect(UpsertPeriodDayLogInputSchema.safeParse(validLog({ lowerBackPain: 11 })).success).toBe(false);
  });

  it("fatigue: rejects -1, accepts 0, accepts 10, rejects 11", () => {
    expect(UpsertPeriodDayLogInputSchema.safeParse(validLog({ fatigue: -1 })).success).toBe(false);
    expect(UpsertPeriodDayLogInputSchema.safeParse(validLog({ fatigue: 0 })).success).toBe(true);
    expect(UpsertPeriodDayLogInputSchema.safeParse(validLog({ fatigue: 10 })).success).toBe(true);
    expect(UpsertPeriodDayLogInputSchema.safeParse(validLog({ fatigue: 11 })).success).toBe(false);
  });

  it("sleepQuality: rejects 0, accepts 1, accepts 5, rejects 6, accepts omitted", () => {
    expect(UpsertPeriodDayLogInputSchema.safeParse(validLog({ sleepQuality: 0 })).success).toBe(false);
    expect(UpsertPeriodDayLogInputSchema.safeParse(validLog({ sleepQuality: 1 })).success).toBe(true);
    expect(UpsertPeriodDayLogInputSchema.safeParse(validLog({ sleepQuality: 5 })).success).toBe(true);
    expect(UpsertPeriodDayLogInputSchema.safeParse(validLog({ sleepQuality: 6 })).success).toBe(false);
    expect(UpsertPeriodDayLogInputSchema.safeParse(validLog()).success).toBe(true);
  });

  it("mood: rejects 0, accepts 1, accepts 10, rejects 11", () => {
    expect(UpsertPeriodDayLogInputSchema.safeParse(validLog({ mood: 0 })).success).toBe(false);
    expect(UpsertPeriodDayLogInputSchema.safeParse(validLog({ mood: 1 })).success).toBe(true);
    expect(UpsertPeriodDayLogInputSchema.safeParse(validLog({ mood: 10 })).success).toBe(true);
    expect(UpsertPeriodDayLogInputSchema.safeParse(validLog({ mood: 11 })).success).toBe(false);
  });
});

describe("UpsertPeriodDayLogInputSchema pain relief", () => {
  it("accepts None (painReliefUsed false, no medication)", () => {
    expect(
      UpsertPeriodDayLogInputSchema.safeParse(
        validLog({ painReliefUsed: false }),
      ).success,
    ).toBe(true);
  });

  it("accepts a predefined medication when painReliefUsed is true", () => {
    expect(
      UpsertPeriodDayLogInputSchema.safeParse(
        validLog({ painReliefUsed: true, painReliefMedication: "Ibuprofen" }),
      ).success,
    ).toBe(true);
  });

  it("accepts an 'Other' free-text medication when painReliefUsed is true", () => {
    expect(
      UpsertPeriodDayLogInputSchema.safeParse(
        validLog({ painReliefUsed: true, painReliefMedication: "Naproxen" }),
      ).success,
    ).toBe(true);
  });

  it("accepts an optional time only alongside painReliefUsed true", () => {
    expect(
      UpsertPeriodDayLogInputSchema.safeParse(
        validLog({ painReliefUsed: true, painReliefMedication: "Ibuprofen", painReliefTime: "09:30" }),
      ).success,
    ).toBe(true);
  });

  it("rejects a medication attached to painReliefUsed false", () => {
    expect(
      UpsertPeriodDayLogInputSchema.safeParse(
        validLog({ painReliefUsed: false, painReliefMedication: "Ibuprofen" }),
      ).success,
    ).toBe(false);
  });

  it("rejects a time attached to painReliefUsed false", () => {
    expect(
      UpsertPeriodDayLogInputSchema.safeParse(
        validLog({ painReliefUsed: false, painReliefTime: "09:30" }),
      ).success,
    ).toBe(false);
  });

  it("rejects a malformed time", () => {
    expect(
      UpsertPeriodDayLogInputSchema.safeParse(
        validLog({ painReliefUsed: true, painReliefMedication: "Ibuprofen", painReliefTime: "9:30am" }),
      ).success,
    ).toBe(false);
  });
});

describe("UpsertPeriodDayLogInputSchema text handling", () => {
  it("trims notes", () => {
    const result = UpsertPeriodDayLogInputSchema.safeParse(validLog({ notes: "  feeling okay  " }));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBe("feeling okay");
    }
  });

  it("rejects an unknown field (client cannot smuggle extra data)", () => {
    expect(
      UpsertPeriodDayLogInputSchema.safeParse(validLog({ user_id: "someone-else" })).success,
    ).toBe(false);
  });
});
