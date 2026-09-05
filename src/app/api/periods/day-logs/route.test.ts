import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authenticateRequest } from "@/lib/api/authentication";

import { POST } from "./route";

vi.mock("@/lib/api/authentication", () => ({
  authenticateRequest: vi.fn(),
}));

const authenticateRequestMock = vi.mocked(authenticateRequest);

function makeSupabaseMock(
  activeResult: { data: unknown; error: unknown },
  upsertResult?: { data: unknown; error: unknown },
) {
  const activeMaybeSingle = vi.fn().mockResolvedValue(activeResult);
  const activeIs = vi.fn(() => ({ maybeSingle: activeMaybeSingle }));
  const activeEqUser = vi.fn(() => ({ is: activeIs }));
  const activeSelect = vi.fn(() => ({ eq: activeEqUser }));

  const upsertSingle = vi.fn().mockResolvedValue(upsertResult ?? { data: null, error: null });
  const upsertSelect = vi.fn(() => ({ single: upsertSingle }));
  const upsert = vi.fn(() => ({ select: upsertSelect }));

  const from = vi.fn((table: string) => {
    if (table === "periods") return { select: activeSelect };
    return { upsert };
  });

  return { from, activeSelect, activeEqUser, activeIs, activeMaybeSingle, upsert, upsertSelect, upsertSingle };
}

const validBody = {
  bleedingLevel: "medium",
  cramps: 4,
  lowerBackPain: 2,
  headache: "mild",
  bloating: "mild",
  fatigue: 6,
  nausea: "none",
  bowelChanges: "normal",
  mood: 5,
  painReliefUsed: false,
  activityImpact: "none",
};

function makeRequest(body: unknown, authorized = true) {
  return new NextRequest("http://localhost/api/periods/day-logs", {
    method: "POST",
    headers: authorized
      ? { "content-type": "application/json", authorization: "Bearer token" }
      : { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/periods/day-logs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("rejects an unauthenticated request", async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null });

    const response = await POST(makeRequest(validBody, false));
    expect(response.status).toBe(401);
  });

  it("rejects an invalid body (cramps out of range)", async () => {
    authenticateRequestMock.mockResolvedValue({
      user: { id: "user-1", email: "a@example.com", name: "A" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: {} as any,
    });

    const response = await POST(makeRequest({ ...validBody, cramps: 11 }));
    expect(response.status).toBe(400);
  });

  it("rejects logging when there is no active period", async () => {
    const supabase = makeSupabaseMock({ data: null, error: null });
    authenticateRequestMock.mockResolvedValue({
      user: { id: "user-1", email: "a@example.com", name: "A" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: supabase as any,
    });

    const response = await POST(makeRequest(validBody));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/no active period/i);
  });

  it("rejects a client-supplied periodId outright — the schema has no such field", async () => {
    authenticateRequestMock.mockResolvedValue({
      user: { id: "user-1", email: "a@example.com", name: "A" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: {} as any,
    });

    // .strict() rejects unknown keys rather than silently ignoring them —
    // a client cannot smuggle a periodId (or a user_id) into this payload.
    const response = await POST(
      makeRequest({ ...validBody, periodId: "someone-elses-period" }),
    );
    expect(response.status).toBe(400);
  });

  it("attaches the log to the caller's own active period, looked up server-side", async () => {
    const supabase = makeSupabaseMock(
      { data: { id: "active-period-1" }, error: null },
      { data: { id: "log-1", period_id: "active-period-1" }, error: null },
    );
    authenticateRequestMock.mockResolvedValue({
      user: { id: "user-1", email: "a@example.com", name: "A" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: supabase as any,
    });

    const response = await POST(makeRequest(validBody));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(supabase.activeEqUser).toHaveBeenCalledWith("user_id", "user-1");
    expect(supabase.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ period_id: "active-period-1", user_id: "user-1" }),
      { onConflict: "period_id,date" },
    );
    expect(body.data.period_id).toBe("active-period-1");
  });

  it("upserts rather than duplicates (same call handles create and update)", async () => {
    const supabase = makeSupabaseMock(
      { data: { id: "active-period-1" }, error: null },
      { data: { id: "log-1" }, error: null },
    );
    authenticateRequestMock.mockResolvedValue({
      user: { id: "user-1", email: "a@example.com", name: "A" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: supabase as any,
    });

    await POST(makeRequest(validBody));

    expect(supabase.upsert).toHaveBeenCalledTimes(1);
    const [, options] = supabase.upsert.mock.calls[0];
    expect(options).toEqual({ onConflict: "period_id,date" });
  });
});
