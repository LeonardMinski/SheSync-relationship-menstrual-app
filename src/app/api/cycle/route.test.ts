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
  return new NextRequest("http://localhost/api/cycle", {
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

// This route is only reachable by tracking-enabled accounts via the app
// layout's client-side redirect — these tests confirm the server itself
// also refuses the request, since a direct API call bypasses that redirect
// entirely. See requireTrackingEnabled in src/lib/api/authentication.ts.
describe("Cycle API — server-side tracking-capability enforcement", () => {
  it("GET rejects an unauthenticated request", async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null });

    const response = await GET(makeRequest("GET", { authorized: false }));

    expect(response.status).toBe(401);
  });

  it("GET blocks a tracking-disabled (partner-only) account server-side — not just hidden navigation", async () => {
    const from = vi.fn();
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    });
    vi.mocked(requireTrackingEnabled).mockReturnValueOnce(createErrorResponse("Blocked", 403));

    const response = await GET(makeRequest("GET"));

    expect(response.status).toBe(403);
    expect(from).not.toHaveBeenCalled();
  });

  it("POST blocks a tracking-disabled (partner-only) account server-side", async () => {
    const from = vi.fn();
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    });
    vi.mocked(requireTrackingEnabled).mockReturnValueOnce(createErrorResponse("Blocked", 403));

    const response = await POST(makeRequest("POST", { body: { phase: "menstrual", mood: 5 } }));

    expect(response.status).toBe(403);
    expect(from).not.toHaveBeenCalled();
  });

  it("PUT blocks a tracking-disabled (partner-only) account server-side", async () => {
    const from = vi.fn();
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    });
    vi.mocked(requireTrackingEnabled).mockReturnValueOnce(createErrorResponse("Blocked", 403));

    const response = await PUT(makeRequest("PUT", { body: { id: "c1", mood: 5 } }));

    expect(response.status).toBe(403);
    expect(from).not.toHaveBeenCalled();
  });

  it("DELETE blocks a tracking-disabled (partner-only) account server-side", async () => {
    const from = vi.fn();
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    });
    vi.mocked(requireTrackingEnabled).mockReturnValueOnce(createErrorResponse("Blocked", 403));

    const response = await DELETE(makeRequest("DELETE"));

    expect(response.status).toBe(403);
    expect(from).not.toHaveBeenCalled();
  });

  it("GET proceeds normally for a tracking-enabled account", async () => {
    const order = vi.fn().mockResolvedValue({ data: [], error: null });
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    });

    const response = await GET(makeRequest("GET"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual([]);
  });
});

describe("Cycle API — error responses never leak raw database detail", () => {
  it("returns a safe generic message (never the raw Postgres error) on a query failure", async () => {
    const order = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "XX000", message: "relation \"cycle_data\" column \"foo\" does not exist", hint: "internal hint" },
    });
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    });

    const response = await GET(makeRequest("GET"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).not.toMatch(/relation|column|postgres|hint|internal/i);
    expect(body).not.toHaveProperty("code");
    expect(body).not.toHaveProperty("hint");
    expect(body).not.toHaveProperty("details");
  });

  it("returns a safe generic message on an RLS-denied error, without naming Supabase or RLS", async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: { code: "42501", message: "new row violates row-level security policy" } });
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    });

    const response = await GET(makeRequest("GET"));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).not.toMatch(/supabase|rls|row-level/i);
  });
});
