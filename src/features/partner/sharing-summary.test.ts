import { describe, expect, it } from "vitest";

import { getSharingSummaryLabels } from "./sharing-summary";

describe("getSharingSummaryLabels", () => {
  it("returns nothing when master sharing is off, even if categories are on", () => {
    expect(
      getSharingSummaryLabels({
        share_with_partner: false,
        share_cycle_phase: true,
        share_mood: true,
      }),
    ).toEqual([]);
  });

  it("returns nothing when master sharing is on but no category is enabled", () => {
    expect(
      getSharingSummaryLabels({
        share_with_partner: true,
        share_cycle_phase: false,
        share_mood: false,
      }),
    ).toEqual([]);
  });

  it("labels cycle phase sharing", () => {
    expect(
      getSharingSummaryLabels({
        share_with_partner: true,
        share_cycle_phase: true,
        share_mood: false,
      }),
    ).toEqual(["Cycle Phase"]);
  });

  it("labels mood sharing as 'Mood & Energy', not just 'Mood'", () => {
    expect(
      getSharingSummaryLabels({
        share_with_partner: true,
        share_cycle_phase: false,
        share_mood: true,
      }),
    ).toEqual(["Mood & Energy"]);
  });

  it("labels both categories together in a stable order", () => {
    expect(
      getSharingSummaryLabels({
        share_with_partner: true,
        share_cycle_phase: true,
        share_mood: true,
      }),
    ).toEqual(["Cycle Phase", "Mood & Energy"]);
  });
});
