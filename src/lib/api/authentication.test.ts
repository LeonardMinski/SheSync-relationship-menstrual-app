import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getUserMock = vi.fn();
const maybeSingleMock = vi.fn();
const createClientMock = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}));

import { authenticateRequest, requireTrackingEnabled } from "./authentication";

function makeFakeSupabase() {
  return {
    auth: { getUser: getUserMock },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle: maybeSingleMock })),
      })),
    })),
  };
}

function makeRequest(authorized = true) {
  return new NextRequest("http://localhost/api/whatever", {
    headers: authorized ? { authorization: "Bearer token" } : {},
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  createClientMock.mockReturnValue(makeFakeSupabase());
});

describe("authenticateRequest — trackingEnabled population", () => {
  it("returns a null user when no Bearer token is present", async () => {
    const result = await authenticateRequest(makeRequest(false));

    expect(result.user).toBeNull();
    expect(result.supabase).toBeNull();
  });

  it("returns a null user when the token fails verification", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: { message: "invalid token" } });

    const result = await authenticateRequest(makeRequest());

    expect(result.user).toBeNull();
  });

  it("sets trackingEnabled: true when the profile row says so — real Cycle/Coach/Pattern access is allowed", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-1", email: "a@example.com", user_metadata: {}, created_at: "" } },
      error: null,
    });
    maybeSingleMock.mockResolvedValue({ data: { name: "A", tracking_enabled: true }, error: null });

    const result = await authenticateRequest(makeRequest());

    expect(result.user?.trackingEnabled).toBe(true);
  });

  it("sets trackingEnabled: false when the profile row says so — a partner-only account", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-1", email: "a@example.com", user_metadata: {}, created_at: "" } },
      error: null,
    });
    maybeSingleMock.mockResolvedValue({ data: { name: "A", tracking_enabled: false }, error: null });

    const result = await authenticateRequest(makeRequest());

    expect(result.user?.trackingEnabled).toBe(false);
  });

  it("leaves trackingEnabled undefined (unresolved) rather than false when the profile row fails to load", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-1", email: "a@example.com", user_metadata: {}, created_at: "" } },
      error: null,
    });
    maybeSingleMock.mockResolvedValue({ data: null, error: { message: "connection reset" } });

    const result = await authenticateRequest(makeRequest());

    // Unresolved, not a known "disabled" state — a transient profile-load
    // failure must never be read as tracking_enabled = false. See
    // requireTrackingEnabled and features/account/capabilities.ts's
    // isWaitingForTrackingStatus for the identical client-side reasoning.
    expect(result.user?.trackingEnabled).toBeUndefined();
  });
});

describe("requireTrackingEnabled", () => {
  it("blocks with a safe 403 when trackingEnabled is explicitly false", async () => {
    const response = requireTrackingEnabled({ id: "u", email: null, name: "A", trackingEnabled: false });

    expect(response).not.toBeNull();
    expect(response?.status).toBe(403);
    const body = await response?.json();
    expect(body.error).not.toMatch(/postgres|supabase|stack/i);
  });

  it("allows (returns null) when trackingEnabled is true", () => {
    expect(requireTrackingEnabled({ id: "u", email: null, name: "A", trackingEnabled: true })).toBeNull();
  });

  it("fails open (returns null) when trackingEnabled is unresolved/undefined, not a known false", () => {
    expect(requireTrackingEnabled({ id: "u", email: null, name: "A" })).toBeNull();
  });
});
