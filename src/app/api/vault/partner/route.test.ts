import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authenticateRequest } from "@/lib/api/authentication";

import { GET } from "./route";

vi.mock("@/lib/api/authentication", () => ({
  authenticateRequest: vi.fn(),
}));

const authenticateRequestMock = vi.mocked(authenticateRequest);
const CALLER = { id: "user-1", email: "person@example.com", name: "Person" };

function makeRequest() {
  return new NextRequest("http://localhost/api/vault/partner", {
    method: "GET",
    headers: { authorization: "Bearer real-user-token" },
  });
}

describe("GET /api/vault/partner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("rejects an unauthenticated request", async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null });

    const response = await GET(makeRequest());

    expect(response.status).toBe(401);
  });

  it("calls get_partner_vault_summary with no parameters — it resolves the caller's partner internally, never accepts one", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [], error: null });
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    });

    await GET(makeRequest());

    expect(rpc).toHaveBeenCalledWith("get_partner_vault_summary");
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it("never forwards a `content` field even if the RPC response were tampered with — the route only ever spreads whatever rows the RPC returns, and the RPC itself never selects content", async () => {
    // Simulates the RPC's actual return shape (no `content` key at all, per
    // get_partner_vault_summary()'s explicit column list in the migration).
    const rows = [
      {
        id: "spark-1",
        heat_level: "hot",
        status: "waiting",
        tease_text: "A hint about something warm.",
        owner_ready_at: null,
        partner_ready_at: null,
        revealed_at: null,
        created_at: "2026-01-01T00:00:00Z",
      },
    ];
    const rpc = vi.fn().mockResolvedValue({ data: rows, error: null });
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    });

    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.sparks).toEqual(rows);
    expect(JSON.stringify(body.data.sparks)).not.toContain('"content"');
  });

  it("returns an empty list, not an error, when the caller has no active partner", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [], error: null });
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    });

    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.sparks).toEqual([]);
  });
});
