import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authenticateRequest } from "@/lib/api/authentication";

import { GET } from "./route";

vi.mock("@/lib/api/authentication", () => ({ authenticateRequest: vi.fn() }));

const authenticateRequestMock = vi.mocked(authenticateRequest);
const CALLER = { id: "user-1", email: "person@example.com", name: "Person" };

function makeRequest() {
  return new NextRequest("http://localhost/api/entitlement", {
    method: "GET",
    headers: { authorization: "Bearer real-user-token" },
  });
}

function makeSupabaseStub(row: unknown) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: row, error: null });
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  return { from };
}

describe("GET /api/entitlement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("rejects an unauthenticated request", async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null });

    const response = await GET(makeRequest());

    expect(response.status).toBe(401);
  });

  it("FREE: returns not-entitled when the caller has no subscription row", async () => {
    const supabase = makeSupabaseStub(null);
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: supabase as any,
    });

    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.tier).toBe("free");
    expect(body.data.hasVaultAccess).toBe(false);
    expect(supabase.from).toHaveBeenCalledWith("subscriptions");
  });

  it("PREMIUM: returns Vault access for an active caller, scoped to their own row", async () => {
    const supabase = makeSupabaseStub({
      plan: "premium",
      billing_type: "recurring",
      status: "active",
      current_period_end: null,
      cancel_at_period_end: false,
      grace_period_ends_at: null,
    });
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: supabase as any,
    });

    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.hasVaultAccess).toBe(true);
    const eqCall = supabase.from.mock.results[0].value.select.mock.results[0].value.eq;
    expect(eqCall).toHaveBeenCalledWith("user_id", CALLER.id);
  });
});
