import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authenticateRequest } from "@/lib/api/authentication";

import { GET } from "./route";

vi.mock("@/lib/api/authentication", () => ({
  authenticateRequest: vi.fn(),
}));

const authenticateRequestMock = vi.mocked(authenticateRequest);
const CALLER = { id: "user-1", email: "person@example.com", name: "Person" };

function makeRequest(path = "/api/patterns", authorized = true) {
  return new NextRequest(`http://localhost${path}`, {
    headers: authorized ? { authorization: "Bearer token" } : {},
  });
}

function makeSupabase(periodsResult: { data: unknown; error: unknown }, cycleResult: { data: unknown; error: unknown }) {
  const periodsLimit = vi.fn().mockResolvedValue(periodsResult);
  const periodsOrder = vi.fn(() => ({ limit: periodsLimit }));
  const periodsNot = vi.fn(() => ({ order: periodsOrder }));
  const periodsEq = vi.fn(() => ({ not: periodsNot }));
  const periodsSelect = vi.fn(() => ({ eq: periodsEq }));

  const cycleOrder = vi.fn().mockResolvedValue(cycleResult);
  const cycleGte = vi.fn(() => ({ order: cycleOrder }));
  const cycleEq = vi.fn(() => ({ gte: cycleGte }));
  const cycleSelect = vi.fn(() => ({ eq: cycleEq }));

  const from = vi.fn((table: string) => {
    if (table === "periods") return { select: periodsSelect };
    if (table === "cycle_data") return { select: cycleSelect };
    throw new Error(`unexpected table ${table}`);
  });

  return { from, periodsEq, cycleEq };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /api/patterns", () => {
  it("rejects an unauthenticated request", async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null });

    const response = await GET(makeRequest("/api/patterns", false));

    expect(response.status).toBe(401);
  });

  it("scopes both queries to the authenticated caller's own id — never a client-supplied one", async () => {
    const { from, periodsEq, cycleEq } = makeSupabase({ data: [], error: null }, { data: [], error: null });
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    });

    // Even if a client tries to smuggle another user's id via a query param, the route never reads it.
    const response = await GET(makeRequest("/api/patterns?userId=someone-else"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(periodsEq).toHaveBeenCalledWith("user_id", "user-1");
    expect(cycleEq).toHaveBeenCalledWith("user_id", "user-1");
    expect(body.data.observations).toEqual([]);
  });

  it("returns a safe empty array (not an error) for a brand-new user with no data — the honest 'still learning' case", async () => {
    const { from } = makeSupabase({ data: [], error: null }, { data: [], error: null });
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    });

    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.observations).toEqual([]);
  });

  it("returns real observations computed from the caller's own logged periods and check-ins", async () => {
    const periodRows = [
      {
        id: "p3",
        user_id: "user-1",
        start_date: "2026-08-01",
        end_date: "2026-08-05",
        created_at: "",
        updated_at: "",
        period_day_logs: [],
      },
      {
        id: "p2",
        user_id: "user-1",
        start_date: "2026-07-01",
        end_date: "2026-07-05",
        created_at: "",
        updated_at: "",
        period_day_logs: [],
      },
      {
        id: "p1",
        user_id: "user-1",
        start_date: "2026-06-01",
        end_date: "2026-06-04",
        created_at: "",
        updated_at: "",
        period_day_logs: [],
      },
    ];
    const { from } = makeSupabase({ data: periodRows, error: null }, { data: [], error: null });
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    });

    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    const durationObservation = body.data.observations.find((o: { type: string }) => o.type === "period_duration_range");
    expect(durationObservation).toBeDefined();
    expect(durationObservation.sufficiency).toBe("sufficient");
  });

  it("returns a safe error (never a raw DB error) when the periods query fails", async () => {
    const { from } = makeSupabase({ data: null, error: { message: "connection reset" } }, { data: [], error: null });
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    });

    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).not.toContain("connection reset");
  });

  it("returns a safe error when the daily check-in query fails", async () => {
    const { from } = makeSupabase({ data: [], error: null }, { data: null, error: { message: "connection reset" } });
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    });

    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).not.toContain("connection reset");
  });

  it("only ever queries periods and cycle_data — no relationship, Vault, or Coach conversation tables", async () => {
    const { from } = makeSupabase({ data: [], error: null }, { data: [], error: null });
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    });

    await GET(makeRequest());

    const queriedTables = from.mock.calls.map((call) => call[0]);
    expect(queriedTables).toEqual(["periods", "cycle_data"]);
    expect(queriedTables).not.toContain("relationship_sessions");
    expect(queriedTables).not.toContain("coach_messages");
    expect(queriedTables).not.toContain("vault_entries");
    expect(queriedTables).not.toContain("partner_links");
  });
});
