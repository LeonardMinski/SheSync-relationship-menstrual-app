import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authenticateRequest } from "@/lib/api/authentication";
import { requireVaultAccess } from "@/lib/api/entitlement";

import { GET } from "./route";

vi.mock("@/lib/api/authentication", () => ({
  authenticateRequest: vi.fn(),
}));
vi.mock("@/lib/api/entitlement", () => ({
  requireVaultAccess: vi.fn(),
}));

const authenticateRequestMock = vi.mocked(authenticateRequest);
const requireVaultAccessMock = vi.mocked(requireVaultAccess);
const CALLER = { id: "user-1", email: "person@example.com", name: "Person" };

function makeRequest() {
  return new NextRequest("http://localhost/api/vault/for-tonight", {
    method: "GET",
    headers: { authorization: "Bearer real-user-token" },
  });
}

describe("GET /api/vault/for-tonight", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireVaultAccessMock.mockResolvedValue(null);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("rejects an unauthenticated request", async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null });

    const response = await GET(makeRequest());

    expect(response.status).toBe(401);
  });

  it("calls get_deck_prompt_matches with no parameters", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [], error: null });
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    });

    await GET(makeRequest());

    expect(rpc).toHaveBeenCalledWith("get_deck_prompt_matches");
  });

  it("never exposes a field that could carry the partner's content — only the caller's own spark_id and deck metadata", async () => {
    const rows = [
      {
        spark_id: "my-spark-1",
        deck_id: "curiosity",
        deck_prompt_id: "curiosity-1",
        heat_level: "warm",
        matched_at: "2026-01-01T00:00:00Z",
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
    expect(body.data.matches).toEqual(rows);
    expect(JSON.stringify(body.data.matches)).not.toContain('"content"');
    expect(JSON.stringify(body.data.matches)).not.toContain("interest_level");
  });
});
