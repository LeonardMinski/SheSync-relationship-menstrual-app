import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { User } from "@/types";
import type { PrivacySettings } from "@/schemas/privacy";
import {
  defaultPrivacySettings,
  usePrivacySettingsForm,
} from "./usePrivacySettingsForm";
import { useAuth } from "@/context/AuthContext";
import {
  getPrivacySettings,
  updatePrivacySettings,
} from "@/services/privacy/settings";

vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/services/privacy/settings", () => ({
  getPrivacySettings: vi.fn(),
  updatePrivacySettings: vi.fn(),
}));

const user = {
  id: "user-1",
  email: "person@example.com",
  name: "Person",
  subscriptionTier: "free",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  privacySettings: {
    shareWithPartner: false,
    shareCyclePhase: false,
    shareMood: false,
    shareFantasyVault: false,
    shareIntimacyDeck: false,
  },
} satisfies User;

const sharedSettings: PrivacySettings = {
  ...defaultPrivacySettings,
  share_with_partner: true,
  share_cycle_phase: true,
};

function mockAuth(nextUser: User | null = user) {
  vi.mocked(useAuth).mockReturnValue({
    user: nextUser,
    session: null,
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    requestPasswordReset: vi.fn(),
    updatePassword: vi.fn(),
    refreshUser: vi.fn(),
  });
}

describe("usePrivacySettingsForm", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockAuth();
  });

  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers();
    });
    vi.useRealTimers();
    consoleErrorSpy.mockRestore();
  });

  it("uses initial settings without fetching them again", () => {
    const { result } = renderHook(() => usePrivacySettingsForm(sharedSettings));

    expect(result.current.settings).toEqual(sharedSettings);
    expect(result.current.stealthMode).toBe(false);
    expect(getPrivacySettings).not.toHaveBeenCalled();
  });

  it("uses private defaults when no initial settings are provided", () => {
    mockAuth(null);

    const { result } = renderHook(() => usePrivacySettingsForm());

    expect(result.current.settings).toEqual(defaultPrivacySettings);
    expect(result.current.stealthMode).toBe(true);
    expect(getPrivacySettings).not.toHaveBeenCalled();
  });

  it("loads settings for an authenticated user", async () => {
    vi.mocked(getPrivacySettings).mockResolvedValue(sharedSettings);

    const { result } = renderHook(() => usePrivacySettingsForm());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(getPrivacySettings).toHaveBeenCalledWith("user-1");
    expect(result.current.settings).toEqual(sharedSettings);
    expect(result.current.error).toBeNull();
  });

  it("does not fetch settings without an authenticated user", () => {
    mockAuth(null);

    renderHook(() => usePrivacySettingsForm());

    expect(getPrivacySettings).not.toHaveBeenCalled();
  });

  it("persists only the changed setting and updates local state after success", async () => {
    vi.mocked(updatePrivacySettings).mockResolvedValue({ success: true });

    const { result } = renderHook(() => usePrivacySettingsForm(sharedSettings));

    await act(async () => {
      await result.current.updateSetting("share_mood", true);
    });

    expect(updatePrivacySettings).toHaveBeenCalledWith("user-1", {
      share_mood: true,
    });
    expect(result.current.settings.share_mood).toBe(true);
    expect(result.current.success).toBe("Privacy settings updated");
    expect(result.current.error).toBeNull();
    expect(result.current.saving).toBe(false);
  });

  it("keeps the previous value when an update fails", async () => {
    vi.mocked(updatePrivacySettings).mockResolvedValue({
      success: false,
      error: "Denied",
    });

    const { result } = renderHook(() => usePrivacySettingsForm(sharedSettings));

    await act(async () => {
      await result.current.updateSetting("share_mood", true);
    });

    expect(result.current.settings.share_mood).toBe(false);
    expect(result.current.error).toBe("Denied");
    expect(result.current.success).toBeNull();
    expect(result.current.saving).toBe(false);
  });

  it("handles rejected update promises", async () => {
    vi.mocked(updatePrivacySettings).mockRejectedValue(new Error("Network"));

    const { result } = renderHook(() => usePrivacySettingsForm(sharedSettings));

    await act(async () => {
      await result.current.updateSetting("share_mood", true);
    });

    expect(result.current.settings.share_mood).toBe(false);
    expect(result.current.error).toBe("Failed to update privacy settings");
    expect(result.current.saving).toBe(false);
  });

  it("resets settings to private defaults after successful persistence", async () => {
    vi.mocked(updatePrivacySettings).mockResolvedValue({ success: true });

    const { result } = renderHook(() => usePrivacySettingsForm(sharedSettings));

    await act(async () => {
      await result.current.resetSettings();
    });

    expect(updatePrivacySettings).toHaveBeenCalledWith(
      "user-1",
      defaultPrivacySettings,
    );
    expect(result.current.settings).toEqual(defaultPrivacySettings);
    expect(result.current.success).toBe("Privacy settings reset");
    expect(result.current.stealthMode).toBe(true);
  });

  it("handles reset failure without changing local settings", async () => {
    vi.mocked(updatePrivacySettings).mockResolvedValue({
      success: false,
      error: "Reset rejected",
    });

    const { result } = renderHook(() => usePrivacySettingsForm(sharedSettings));

    await act(async () => {
      await result.current.resetSettings();
    });

    expect(result.current.settings).toEqual(sharedSettings);
    expect(result.current.error).toBe("Reset rejected");
    expect(result.current.saving).toBe(false);
  });

  it("clears success after the intended delay", async () => {
    vi.mocked(updatePrivacySettings).mockResolvedValue({ success: true });

    const { result } = renderHook(() => usePrivacySettingsForm(sharedSettings));

    await act(async () => {
      await result.current.updateSetting("share_mood", true);
    });

    expect(result.current.success).toBe("Privacy settings updated");

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(result.current.success).toBeNull();
  });

  it("cleans up a pending success timeout on unmount", async () => {
    vi.mocked(updatePrivacySettings).mockResolvedValue({ success: true });
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

    const { result, unmount } = renderHook(() =>
      usePrivacySettingsForm(sharedSettings),
    );

    await act(async () => {
      await result.current.updateSetting("share_mood", true);
    });

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});
