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
  return new NextRequest("http://localhost/api/vault/sparks/spark-1/revealed", {
    method: "GET",
    headers: { authorization: "Bearer real-user-token" },
  });
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("GET /api/vault/sparks/[id]/revealed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireVaultAccessMock.mockResolvedValue(null);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("rejects an unauthenticated request", async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null });

    const response = await GET(makeRequest(), makeParams("spark-1"));

    expect(response.status).toBe(401);
  });

  it("pre-reveal isolation: maps 'this spark has not been revealed' to 409, never returning content", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: "this spark has not been revealed" } });
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    });

    const response = await GET(makeRequest(), makeParams("spark-1"));
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(JSON.stringify(body)).not.toContain("content");
  });

  it("maps 'not a participant in this spark' to 403 — a non-participant cannot read a revealed Spark by guessing its id", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: "not a participant in this spark" } });
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    });

    const response = await GET(makeRequest(), makeParams("spark-1"));

    expect(response.status).toBe(403);
  });

  it("returns full content once revealed, for either participant (post-reveal access)", async () => {
    const row = {
      id: "spark-1",
      heat_level: "hot",
      content: "the full spark content",
      revealed_at: "2026-01-01T00:00:00Z",
      owner_reaction: null,
      partner_reaction: null,
    };
    const rpc = vi.fn().mockResolvedValue({ data: [row], error: null });
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    });

    const response = await GET(makeRequest(), makeParams("spark-1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.content).toBe("the full spark content");
    expect(rpc).toHaveBeenCalledWith("get_revealed_vault_spark", { p_spark_id: "spark-1" });
  });
});
