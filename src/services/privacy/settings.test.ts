import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";

import { supabase } from "@/lib/supabase/client";
import { DEFAULT_PRIVACY_SETTINGS } from "@/schemas/privacy";

import {
  getPrivacySettings,
  isPrivacySettingEnabled,
  updatePrivacySettings,
} from "./settings";

const getSession = supabase.auth.getSession as Mock;

const mockFetch = vi.fn();
global.fetch = mockFetch;

const session = {
  access_token: "token-1",
};

const apiSettings = {
  share_with_partner: true,
  share_cycle_phase: true,
  share_mood: false,
  share_fantasy_vault: false,
  share_intimacy_deck: false,
};

function mockSession() {
  getSession.mockResolvedValue({
    data: { session },
    error: null,
  });
}

function mockJsonResponse({
  ok,
  body,
}: {
  ok: boolean;
  body: unknown;
}) {
  return {
    ok,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe("privacy settings service", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSession();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("loads privacy settings with an authenticated request", async () => {
    mockFetch.mockResolvedValue(
      mockJsonResponse({
        ok: true,
        body: {
          data: {
            privacy_settings: apiSettings,
          },
        },
      }),
    );

    await expect(getPrivacySettings("user-1")).resolves.toEqual(apiSettings);
    expect(mockFetch).toHaveBeenCalledWith("/api/user", {
      headers: {
        Authorization: "Bearer token-1",
      },
    });
  });

  it("falls back to safe privacy defaults when the API has no settings", async () => {
    mockFetch.mockResolvedValue(
      mockJsonResponse({
        ok: true,
        body: {
          data: {},
        },
      }),
    );

    await expect(getPrivacySettings("user-1")).resolves.toEqual(
      DEFAULT_PRIVACY_SETTINGS,
    );
  });

  it("fails closed when loading without an authenticated session", async () => {
    getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    await expect(getPrivacySettings("user-1")).rejects.toThrow(
      "Authentication required",
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("updates settings with the merged API payload", async () => {
    mockFetch
      .mockResolvedValueOnce(
        mockJsonResponse({
          ok: true,
          body: {
            data: {
              privacy_settings: {
                ...DEFAULT_PRIVACY_SETTINGS,
                share_with_partner: true,
              },
            },
          },
        }),
      )
      .mockResolvedValueOnce(
        mockJsonResponse({
          ok: true,
          body: {
            data: {
              privacy_settings: {
                ...DEFAULT_PRIVACY_SETTINGS,
                share_with_partner: true,
                share_cycle_phase: true,
              },
            },
          },
        }),
      );

    await expect(
      updatePrivacySettings("user-1", { share_cycle_phase: true }),
    ).resolves.toEqual({
      success: true,
      data: {
        ...DEFAULT_PRIVACY_SETTINGS,
        share_with_partner: true,
        share_cycle_phase: true,
      },
    });

    expect(mockFetch).toHaveBeenLastCalledWith("/api/user", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-1",
      },
      body: JSON.stringify({
        privacySettings: {
          shareWithPartner: true,
          shareCyclePhase: true,
          shareMood: false,
          shareFantasyVault: false,
          shareIntimacyDeck: false,
        },
      }),
    });
  });

  it("does not report success when the update request fails", async () => {
    mockFetch
      .mockResolvedValueOnce(
        mockJsonResponse({
          ok: true,
          body: {
            data: {
              privacy_settings: DEFAULT_PRIVACY_SETTINGS,
            },
          },
        }),
      )
      .mockResolvedValueOnce(
        mockJsonResponse({
          ok: false,
          body: {
            error: "Update rejected",
          },
        }),
      );

    await expect(
      updatePrivacySettings("user-1", { share_mood: true }),
    ).resolves.toEqual({
      success: false,
      error: "Update rejected",
    });
  });

  it("returns false when checking a setting fails", async () => {
    getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    await expect(
      isPrivacySettingEnabled("user-1", "share_cycle_phase"),
    ).resolves.toBe(false);
  });
});
