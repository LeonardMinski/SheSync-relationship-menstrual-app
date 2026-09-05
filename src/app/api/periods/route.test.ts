import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authenticateRequest } from "@/lib/api/authentication";

import { GET, POST } from "./route";

vi.mock("@/lib/api/authentication", () => ({
  authenticateRequest: vi.fn(),
}));

const authenticateRequestMock = vi.mocked(authenticateRequest);

function makeGetSupabaseMock(activeResult: { data: unknown; error: unknown }) {
  const maybeSingle = vi.fn().mockResolvedValue(activeResult);
  const is = vi.fn(() => ({ maybeSingle }));
  const eqUser = vi.fn(() => ({ is }));
  const select = vi.fn(() => ({ eq: eqUser }));
  const from = vi.fn(() => ({ select }));
  return { from, select, eqUser, is, maybeSingle };
}

function makePostSupabaseMock(insertResult: { data: unknown; error: unknown }) {
  const single = vi.fn().mockResolvedValue(insertResult);
  const select = vi.fn(() => ({ single }));
  const insert = vi.fn(() => ({ select }));
  const from = vi.fn(() => ({ insert }));
  return { from, insert, select, single };
}

function makeGetRequest(authorized = true) {
  return new NextRequest("http://localhost/api/periods", {
    method: "GET",
    headers: authorized ? { authorization: "Bearer token" } : {},
  });
}

function makePostRequest(body: unknown, authorized = true) {
  return new NextRequest("http://localhost/api/periods", {
    method: "POST",
    headers: authorized
      ? { "content-type": "application/json", authorization: "Bearer token" }
      : { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/periods", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("rejects an unauthenticated request", async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null });

    const response = await GET(makeGetRequest(false));
    expect(response.status).toBe(401);
  });

  it("scopes the active-period lookup to the authenticated caller, not a client-supplied id", async () => {
    const supabase = makeGetSupabaseMock({ data: null, error: null });
    authenticateRequestMock.mockResolvedValue({
      user: { id: "user-1", email: "a@example.com", name: "A" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: supabase as any,
    });

    const response = await GET(makeGetRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(supabase.from).toHaveBeenCalledWith("periods");
    expect(supabase.eqUser).toHaveBeenCalledWith("user_id", "user-1");
    expect(body.data.active).toBeNull();
    expect(body.data.todayLog).toBeNull();
  });
});

describe("POST /api/periods (start period)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("rejects an unauthenticated request", async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null });

    const response = await POST(makePostRequest({}, false));
    expect(response.status).toBe(401);
  });

  it("rejects a malformed start date", async () => {
    authenticateRequestMock.mockResolvedValue({
      user: { id: "user-1", email: "a@example.com", name: "A" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: {} as any,
    });

    const response = await POST(makePostRequest({ startDate: "not-a-date" }));
    expect(response.status).toBe(400);
  });

  it("rejects an arbitrary user_id smuggled in the body", async () => {
    authenticateRequestMock.mockResolvedValue({
      user: { id: "user-1", email: "a@example.com", name: "A" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: {} as any,
    });

    const response = await POST(makePostRequest({ user_id: "someone-else" }));
    expect(response.status).toBe(400);
  });

  it("inserts using the authenticated caller's own id, and defaults startDate to today when omitted", async () => {
    const supabase = makePostSupabaseMock({
      data: { id: "period-1", user_id: "user-1", start_date: "2026-09-05", end_date: null },
      error: null,
    });
    authenticateRequestMock.mockResolvedValue({
      user: { id: "user-1", email: "a@example.com", name: "A" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: supabase as any,
    });

    const response = await POST(makePostRequest({}));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(supabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "user-1" }),
    );
    expect(body.data.id).toBe("period-1");
  });

  it("translates a duplicate-active-period DB error into a safe 409, not a raw Postgres error", async () => {
    const supabase = makePostSupabaseMock({
      data: null,
      error: { code: "23505", message: "duplicate key value violates unique constraint" },
    });
    authenticateRequestMock.mockResolvedValue({
      user: { id: "user-1", email: "a@example.com", name: "A" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: supabase as any,
    });

    const response = await POST(makePostRequest({}));
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).not.toMatch(/constraint|postgres/i);
    expect(body.error).toMatch(/already have an active period/i);
  });
});
