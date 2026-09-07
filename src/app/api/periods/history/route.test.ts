import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authenticateRequest, requireTrackingEnabled } from "@/lib/api/authentication";
import { createErrorResponse } from "@/lib/api/responses";

import { GET } from "./route";

vi.mock("@/lib/api/authentication", () => ({
  authenticateRequest: vi.fn(),
  requireTrackingEnabled: vi.fn(() => null),
}));

const authenticateRequestMock = vi.mocked(authenticateRequest);
const CALLER = { id: "user-1", email: "person@example.com", name: "Person" };

function makeRequest(authorized = true) {
  return new NextRequest("http://localhost/api/periods/history", {
    headers: authorized ? { authorization: "Bearer token" } : {},
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /api/periods/history", () => {
  it("rejects an unauthenticated request", async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null });

    const response = await GET(makeRequest(false));

    expect(response.status).toBe(401);
  });

  it("scopes the query to the authenticated caller's own id", async () => {
    const order = vi.fn().mockResolvedValue({ data: [], error: null });
    const not = vi.fn(() => ({ order }));
    const eq = vi.fn(() => ({ not }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    });

    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(body.data.history).toEqual([]);
  });

  it("blocks a tracking-disabled (partner-only) account server-side — not just hidden navigation", async () => {
    const from = vi.fn();
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    });
    vi.mocked(requireTrackingEnabled).mockReturnValueOnce(createErrorResponse("Blocked", 403));

    const response = await GET(makeRequest());

    expect(response.status).toBe(403);
    expect(from).not.toHaveBeenCalled();
  });
});
