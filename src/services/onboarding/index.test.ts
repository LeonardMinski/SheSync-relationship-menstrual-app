import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

import { supabase } from "@/lib/supabase/client";

import { completeOnboarding } from "./index";

const getSession = supabase.auth.getSession as Mock;

const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockSession() {
  getSession.mockResolvedValue({
    data: { session: { access_token: "token-1" } },
    error: null,
  });
}

function mockJsonResponse({ ok, body }: { ok: boolean; body: unknown }) {
  return {
    ok,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe("completeOnboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockSession();
  });

  it("calls PUT /api/user with completeOnboarding: true and an auth header", async () => {
    mockFetch.mockResolvedValue(
      mockJsonResponse({
        ok: true,
        body: { data: { onboarding_completed_at: "2026-09-03T12:00:00.000Z" } },
      }),
    );

    const result = await completeOnboarding();

    expect(mockFetch).toHaveBeenCalledWith("/api/user", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-1",
      },
      body: JSON.stringify({ completeOnboarding: true }),
    });
    expect(result).toEqual({
      success: true,
      onboardingCompletedAt: "2026-09-03T12:00:00.000Z",
    });
  });

  it("fails without persisting anything when there is no session", async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null });

    const result = await completeOnboarding();

    expect(result).toEqual({
      success: false,
      error: "Authentication required",
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("surfaces the server error and does not report success on a failed request", async () => {
    mockFetch.mockResolvedValue(
      mockJsonResponse({
        ok: false,
        body: { error: "Profile update rejected" },
      }),
    );

    const result = await completeOnboarding();

    expect(result).toEqual({
      success: false,
      error: "Profile update rejected",
    });
  });

  it("does not report success if the server omits a completion timestamp", async () => {
    mockFetch.mockResolvedValue(
      mockJsonResponse({
        ok: true,
        body: { data: {} },
      }),
    );

    const result = await completeOnboarding();

    expect(result.success).toBe(false);
  });
});
