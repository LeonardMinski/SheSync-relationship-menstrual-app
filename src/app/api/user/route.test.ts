import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authenticateRequest } from "@/lib/api/authentication";

import { PUT } from "./route";

vi.mock("@/lib/api/authentication", () => ({
  authenticateRequest: vi.fn(),
}));

const authenticateRequestMock = vi.mocked(authenticateRequest);

function makeSupabaseMock(updateResult: { data: unknown; error: { message: string } | null }) {
  const single = vi.fn().mockResolvedValue(updateResult);
  const select = vi.fn(() => ({ single }));
  const eq = vi.fn(() => ({ select }));
  const update = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ update }));
  return { from, update, eq, select, single };
}

function makeRequest(body: unknown, { authorized = true }: { authorized?: boolean } = {}) {
  return new NextRequest("http://localhost/api/user", {
    method: "PUT",
    headers: authorized
      ? { "content-type": "application/json", authorization: "Bearer real-user-token" }
      : { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PUT /api/user — onboarding completion trust boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("A: rejects an unauthenticated request", async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null });

    const response = await PUT(makeRequest({ completeOnboarding: true }, { authorized: false }));

    expect(response.status).toBe(401);
  });

  it("B: updates the authenticated caller's own row with a server-generated timestamp", async () => {
    const supabase = makeSupabaseMock({
      data: { id: "user-1", onboarding_completed_at: "2026-09-03T00:00:00.000Z" },
      error: null,
    });
    authenticateRequestMock.mockResolvedValue({
      user: { id: "user-1", email: "person@example.com", name: "Person" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: supabase as any,
    });

    const response = await PUT(makeRequest({ completeOnboarding: true }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(supabase.from).toHaveBeenCalledWith("users");
    expect(supabase.eq).toHaveBeenCalledWith("id", "user-1");
    expect(supabase.update).toHaveBeenCalledTimes(1);
    const updatePayload = supabase.update.mock.calls[0][0];
    expect(Object.keys(updatePayload)).toEqual(["onboarding_completed_at"]);
    expect(typeof updatePayload.onboarding_completed_at).toBe("string");
    expect(body.data.onboarding_completed_at).toBe("2026-09-03T00:00:00.000Z");
  });

  it("C: ignores an attacker-supplied id and timestamp — only the authenticated caller's row is targeted, with a server timestamp", async () => {
    const supabase = makeSupabaseMock({
      data: { id: "user-1", onboarding_completed_at: "2026-09-03T00:00:00.000Z" },
      error: null,
    });
    authenticateRequestMock.mockResolvedValue({
      user: { id: "user-1", email: "person@example.com", name: "Person" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: supabase as any,
    });

    await PUT(
      makeRequest({
        completeOnboarding: true,
        id: "victim-user-2",
        userId: "victim-user-2",
        onboarding_completed_at: "1999-01-01T00:00:00.000Z",
        onboardingCompletedAt: "1999-01-01T00:00:00.000Z",
      }),
    );

    // Target row is always the server-verified caller, never a body-supplied id.
    expect(supabase.eq).toHaveBeenCalledWith("id", "user-1");
    expect(supabase.eq).not.toHaveBeenCalledWith("id", "victim-user-2");

    // The only field written is the server-computed timestamp — the
    // attacker-supplied 1999 date and any id/userId fields never reach the
    // update payload.
    const updatePayload = supabase.update.mock.calls[0][0];
    expect(Object.keys(updatePayload)).toEqual(["onboarding_completed_at"]);
    expect(updatePayload.onboarding_completed_at).not.toBe("1999-01-01T00:00:00.000Z");
    expect(updatePayload).not.toHaveProperty("id");
    expect(updatePayload).not.toHaveProperty("userId");
  });

  it("D: returns an error response when the database update fails", async () => {
    const supabase = makeSupabaseMock({
      data: null,
      error: { message: "connection reset" },
    });
    authenticateRequestMock.mockResolvedValue({
      user: { id: "user-1", email: "person@example.com", name: "Person" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: supabase as any,
    });

    const response = await PUT(makeRequest({ completeOnboarding: true }));
    const body = await response.json();

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(body.error).toBe("connection reset");
  });

  it("E: rejects a completeOnboarding value that isn't literally true", async () => {
    const supabase = makeSupabaseMock({ data: {}, error: null });
    authenticateRequestMock.mockResolvedValue({
      user: { id: "user-1", email: "person@example.com", name: "Person" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: supabase as any,
    });

    const response = await PUT(makeRequest({ completeOnboarding: "true" }));

    expect(response.status).toBe(400);
    expect(supabase.update).not.toHaveBeenCalled();
  });

  it("E: rejects a body with no recognized fields rather than silently no-op updating", async () => {
    const supabase = makeSupabaseMock({ data: {}, error: null });
    authenticateRequestMock.mockResolvedValue({
      user: { id: "user-1", email: "person@example.com", name: "Person" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: supabase as any,
    });

    const response = await PUT(makeRequest({ somethingUnsupported: true }));

    expect(response.status).toBe(400);
    expect(supabase.update).not.toHaveBeenCalled();
  });
});

describe("PUT /api/user — trackingEnabled (account capabilities)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("allows the authenticated caller to set their own tracking_enabled", async () => {
    const supabase = makeSupabaseMock({
      data: { id: "user-1", tracking_enabled: true },
      error: null,
    });
    authenticateRequestMock.mockResolvedValue({
      user: { id: "user-1", email: "person@example.com", name: "Person" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: supabase as any,
    });

    const response = await PUT(makeRequest({ trackingEnabled: true }));

    expect(response.status).toBe(200);
    expect(supabase.eq).toHaveBeenCalledWith("id", "user-1");
    const updatePayload = supabase.update.mock.calls[0][0];
    expect(updatePayload).toEqual({ tracking_enabled: true });
  });

  it("rejects a non-boolean trackingEnabled value", async () => {
    const supabase = makeSupabaseMock({ data: {}, error: null });
    authenticateRequestMock.mockResolvedValue({
      user: { id: "user-1", email: "person@example.com", name: "Person" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: supabase as any,
    });

    const response = await PUT(makeRequest({ trackingEnabled: "true" }));

    expect(response.status).toBe(400);
    expect(supabase.update).not.toHaveBeenCalled();
  });
});
