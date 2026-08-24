import { describe, expect, it } from "vitest";

import {
  DEFAULT_PRIVACY_SETTINGS,
  PrivacySettingsSchema,
  UpdatePrivacySettingsSchema,
} from "./privacy";

describe("privacy schema", () => {
  it("keeps every privacy setting private by default", () => {
    expect(DEFAULT_PRIVACY_SETTINGS).toEqual({
      share_with_partner: false,
      share_cycle_phase: false,
      share_mood: false,
      share_fantasy_vault: false,
      share_intimacy_deck: false,
    });
  });

  it("applies safe defaults when parsing missing privacy settings", () => {
    expect(PrivacySettingsSchema.parse({})).toEqual(DEFAULT_PRIVACY_SETTINGS);
  });

  it("accepts partial privacy updates", () => {
    expect(
      UpdatePrivacySettingsSchema.parse({
        share_cycle_phase: true,
      }),
    ).toEqual({
      share_cycle_phase: true,
    });
  });

  it("rejects unknown persisted privacy keys", () => {
    expect(() =>
      PrivacySettingsSchema.parse({
        ...DEFAULT_PRIVACY_SETTINGS,
        share_private_notes: true,
      }),
    ).toThrow();
  });
});
