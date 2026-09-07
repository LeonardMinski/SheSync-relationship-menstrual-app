import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authenticateRequest, requireTrackingEnabled } from "@/lib/api/authentication";
import { createErrorResponse } from "@/lib/api/responses";

import { DELETE, GET, POST, PUT } from "./route";

vi.mock("@/lib/api/authentication", () => ({
  authenticateRequest: vi.fn(),
  requireTrackingEnabled: vi.fn(() => null),
}));

const authenticateRequestMock = vi.mocked(authenticateRequest);
const CALLER = { id: "user-1", email: "person@example.com", name: "Person" };

function makeRequest(method: string, { body, authorized = true }: { body?: unknown; authorized?: boolean } = {}) {
  return new NextRequest("http://localhost/api/intimacy", {
    method,
    headers: authorized
      ? { "content-type": "application/json", authorization: "Bearer token" }
      : { "content-type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

// Vault (intimacy cards) is a tracked-only feature per
// features/account/capabilities.ts (canUseVault = canUseTracking). These
// tests confirm the server itself enforces that, not just hidden
// navigation — a direct API call from a partner-only account must be
// refused server-side.
describe("Intimacy API — server-side tracking-capability enforcement", () => {
  it("GET rejects an unauthenticated request", async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null });

    const response = await GET(makeRequest("GET", { authorized: false }));

    expect(response.status).toBe(401);
  });

  it.each([
    ["GET", () => GET(makeRequest("GET"))],
    ["POST", () => POST(makeRequest("POST", { body: { cardData: {} } }))],
    ["PUT", () => PUT(makeRequest("PUT", { body: { id: "c1" } }))],
    ["DELETE", () => DELETE(makeRequest("DELETE"))],
  ] as const)("%s blocks a tracking-disabled (partner-only) account server-side", async (_method, call) => {
    const from = vi.fn();
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    });
    vi.mocked(requireTrackingEnabled).mockReturnValueOnce(createErrorResponse("Blocked", 403));

    const response = await call();

    expect(response.status).toBe(403);
    expect(from).not.toHaveBeenCalled();
  });
});
