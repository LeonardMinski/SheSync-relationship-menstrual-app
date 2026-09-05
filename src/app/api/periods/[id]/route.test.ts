import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authenticateRequest } from "@/lib/api/authentication";

import { PATCH } from "./route";

vi.mock("@/lib/api/authentication", () => ({
  authenticateRequest: vi.fn(),
}));

const authenticateRequestMock = vi.mocked(authenticateRequest);

function makeSupabaseMock(
  lookupResult: { data: unknown; error: unknown },
  updateResult?: { data: unknown; error: unknown },
) {
  const lookupMaybeSingle = vi.fn().mockResolvedValue(lookupResult);
  const lookupEqUser = vi.fn(() => ({ maybeSingle: lookupMaybeSingle }));
  const lookupEqId = vi.fn(() => ({ eq: lookupEqUser }));
  const selectForLookup = vi.fn(() => ({ eq: lookupEqId }));

  const updateSingle = vi.fn().mockResolvedValue(updateResult ?? { data: null, error: null });
  const updateSelect = vi.fn(() => ({ single: updateSingle }));
  const updateEqUser = vi.fn(() => ({ select: updateSelect }));
  const updateEqId = vi.fn(() => ({ eq: updateEqUser }));
  const update = vi.fn(() => ({ eq: updateEqId }));

  const from = vi.fn(() => ({ select: selectForLookup, update }));
  return { from, selectForLookup, lookupEqId, lookupEqUser, lookupMaybeSingle, update, updateEqId, updateEqUser, updateSelect, updateSingle };
}

function makeRequest(id: string, body: unknown, authorized = true) {
  return new NextRequest(`http://localhost/api/periods/${id}`, {
    method: "PATCH",
    headers: authorized
      ? { "content-type": "application/json", authorization: "Bearer token" }
      : { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("PATCH /api/periods/[id] (end period)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("rejects an unauthenticated request", async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null });

    const response = await PATCH(makeRequest("period-1", {}, false), params("period-1"));
    expect(response.status).toBe(401);
  });

  it("rejects a malformed end date", async () => {
    authenticateRequestMock.mockResolvedValue({
      user: { id: "user-1", email: "a@example.com", name: "A" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: {} as any,
    });

    const response = await PATCH(
      makeRequest("period-1", { endDate: "yesterday" }),
      params("period-1"),
    );
    expect(response.status).toBe(400);
  });

  it("returns 404 for a period that does not exist or is not owned by the caller", async () => {
    const supabase = makeSupabaseMock({ data: null, error: null });
    authenticateRequestMock.mockResolvedValue({
      user: { id: "user-1", email: "a@example.com", name: "A" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: supabase as any,
    });

    const response = await PATCH(makeRequest("someone-elses-period", {}), params("someone-elses-period"));
    const body = await response.json();

    expect(response.status).toBe(404);
    // Confirms the lookup was scoped to the caller's own id, not just the path id.
    expect(supabase.lookupEqUser).toHaveBeenCalledWith("user_id", "user-1");
    expect(body.error).not.toMatch(/postgres|rls|policy/i);
  });

  it("rejects ending a period that has already ended", async () => {
    const supabase = makeSupabaseMock({
      data: { id: "period-1", end_date: "2026-08-10" },
      error: null,
    });
    authenticateRequestMock.mockResolvedValue({
      user: { id: "user-1", email: "a@example.com", name: "A" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: supabase as any,
    });

    const response = await PATCH(makeRequest("period-1", {}), params("period-1"));
    expect(response.status).toBe(400);
  });

  it("ends an active period owned by the caller", async () => {
    const supabase = makeSupabaseMock(
      { data: { id: "period-1", end_date: null }, error: null },
      { data: { id: "period-1", end_date: "2026-09-05" }, error: null },
    );
    authenticateRequestMock.mockResolvedValue({
      user: { id: "user-1", email: "a@example.com", name: "A" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: supabase as any,
    });

    const response = await PATCH(makeRequest("period-1", {}), params("period-1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(supabase.updateEqUser).toHaveBeenCalledWith("user_id", "user-1");
    expect(body.data.end_date).toBe("2026-09-05");
  });
});
