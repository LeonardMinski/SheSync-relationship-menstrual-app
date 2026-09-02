import { describe, expect, it } from "vitest";

import {
  buildPartnerSharedDataDto,
  type RawPartnerSharedDataRow,
} from "./shared-data.utils";

function row(overrides: Partial<RawPartnerSharedDataRow> = {}): RawPartnerSharedDataRow {
  return {
    owner_name: "Jordan",
    share_with_partner: true,
    share_cycle_phase: false,
    share_mood: false,
    today_phase: null,
    today_mood: null,
    today_energy: null,
    recent_activity: [],
    ...overrides,
  };
}

describe("buildPartnerSharedDataDto", () => {
  it("shares nothing when master sharing is off, even if raw fields are present", () => {
    const dto = buildPartnerSharedDataDto(
      row({
        share_with_partner: false,
        share_cycle_phase: true,
        share_mood: true,
        today_phase: "luteal",
        today_mood: 7,
        today_energy: 4,
      }),
    );

    expect(dto.privacySettings.shareWithPartner).toBe(false);
    expect(dto.sharingSummary).toEqual([]);
    expect(dto.todayCycle).toBeUndefined();
    expect(dto.recentActivity).toEqual([]);
  });

  it("shares only the phase when only phase sharing is enabled", () => {
    const dto = buildPartnerSharedDataDto(
      row({
        share_cycle_phase: true,
        share_mood: false,
        today_phase: "follicular",
        today_mood: 8,
        today_energy: 9,
      }),
    );

    expect(dto.sharingSummary).toEqual(["Cycle Phase"]);
    expect(dto.todayCycle).toEqual({ phase: "follicular" });
  });

  it("shares mood and energy together when mood sharing is enabled", () => {
    const dto = buildPartnerSharedDataDto(
      row({
        share_cycle_phase: false,
        share_mood: true,
        today_phase: "luteal",
        today_mood: 6,
        today_energy: 5,
      }),
    );

    expect(dto.sharingSummary).toEqual(["Mood & Energy"]);
    expect(dto.todayCycle).toEqual({ mood: 6, energy: 5 });
  });

  it("shares both categories when both are enabled", () => {
    const dto = buildPartnerSharedDataDto(
      row({
        share_cycle_phase: true,
        share_mood: true,
        today_phase: "ovulation",
        today_mood: 9,
        today_energy: 8,
      }),
    );

    expect(dto.todayCycle).toEqual({ phase: "ovulation", mood: 9, energy: 8 });
  });

  it("never invents a value the row didn't actually provide", () => {
    const dto = buildPartnerSharedDataDto(
      row({ share_cycle_phase: true, share_mood: true, today_phase: null }),
    );

    // No entry logged today: nothing to show, not a fabricated default.
    expect(dto.todayCycle).toBeUndefined();
  });

  it("includes mood in recent-activity descriptions only when mood sharing is enabled", () => {
    const withMood = buildPartnerSharedDataDto(
      row({
        share_cycle_phase: true,
        share_mood: true,
        recent_activity: [{ date: "2026-08-20", phase: "luteal", mood: 5 }],
      }),
    );
    expect(withMood.recentActivity[0].description).toBe(
      "Logged luteal phase with mood 5/10",
    );

    const phaseOnly = buildPartnerSharedDataDto(
      row({
        share_cycle_phase: true,
        share_mood: false,
        recent_activity: [{ date: "2026-08-20", phase: "luteal", mood: 5 }],
      }),
    );
    expect(phaseOnly.recentActivity[0].description).toBe("Logged luteal phase");
  });

  it("regression: never leaks a recent phase when share_cycle_phase is off, even if the row carries one", () => {
    // This is the exact bug found in review: an entry that (incorrectly,
    // simulating an unsafe RPC response) still carries a raw phase value
    // must not be exposed by this layer either — it is not this layer's
    // job to trust an upstream flag, only to apply its own gate.
    const dto = buildPartnerSharedDataDto(
      row({
        share_cycle_phase: false,
        share_mood: true,
        recent_activity: [{ date: "2026-08-20", phase: "luteal", mood: 5 }],
      }),
    );

    expect(dto.recentActivity[0].description).not.toContain("luteal");
    expect(dto.recentActivity[0].description).toBe("Logged mood 5/10");
  });

  it("regression: never leaks a recent mood when share_mood is off, even if the row carries one", () => {
    const dto = buildPartnerSharedDataDto(
      row({
        share_cycle_phase: true,
        share_mood: false,
        recent_activity: [{ date: "2026-08-20", phase: "luteal", mood: 5 }],
      }),
    );

    expect(dto.recentActivity[0].description).not.toContain("5");
    expect(dto.recentActivity[0].description).toBe("Logged luteal phase");
  });

  it("shows an honest fallback when a recent entry has nothing permitted to show", () => {
    const dto = buildPartnerSharedDataDto(
      row({
        share_cycle_phase: false,
        share_mood: false,
        recent_activity: [],
      }),
    );

    expect(dto.recentActivity).toEqual([]);
  });
});
