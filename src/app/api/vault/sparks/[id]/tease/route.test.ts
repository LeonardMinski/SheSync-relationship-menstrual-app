import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authenticateRequest } from "@/lib/api/authentication";
import { requireVaultAccess } from "@/lib/api/entitlement";

import { POST } from "./route";

vi.mock("@/lib/api/authentication", () => ({
  authenticateRequest: vi.fn(),
}));
vi.mock("@/lib/api/entitlement", () => ({
  requireVaultAccess: vi.fn(),
}));

const authenticateRequestMock = vi.mocked(authenticateRequest);
const requireVaultAccessMock = vi.mocked(requireVaultAccess);
const CALLER = { id: "user-1", email: "person@example.com", name: "Person" };

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/vault/sparks/spark-1/tease", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer real-user-token" },
    body: JSON.stringify(body),
  });
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("POST /api/vault/sparks/[id]/tease", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireVaultAccessMock.mockResolvedValue(null);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("rejects an unauthenticated request", async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null });

    const response = await POST(makeRequest({ teaseText: "a hint" }), makeParams("spark-1"));

    expect(response.status).toBe(401);
  });

  it("rejects empty tease text before it ever reaches the RPC", async () => {
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: {} as any,
    });

    const response = await POST(makeRequest({ teaseText: "" }), makeParams("spark-1"));

    expect(response.status).toBe(400);
  });

  it("maps 'a tease can only be created from a private spark' to 409 (can't re-tease an already-teased/revealed Spark)", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: "a tease can only be created from a private spark" } });
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    });

    const response = await POST(makeRequest({ teaseText: "a hint" }), makeParams("spark-1"));

    expect(response.status).toBe(409);
  });

  it("maps 'not the owner of this spark' to 403 — only the owner can tease their own Spark", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: "not the owner of this spark" } });
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    });

    const response = await POST(makeRequest({ teaseText: "a hint" }), makeParams("spark-1"));

    expect(response.status).toBe(403);
  });

  it("calls create_vault_tease scoped to the spark id in the URL with the tease text from the body", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    });

    const response = await POST(makeRequest({ teaseText: "A hint about something warm." }), makeParams("spark-1"));

    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("create_vault_tease", {
      p_spark_id: "spark-1",
      p_tease_text: "A hint about something warm.",
    });
  });
});
