import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authenticateRequest } from "@/lib/api/authentication";

import { POST } from "./route";

vi.mock("@/lib/api/authentication", () => ({
  authenticateRequest: vi.fn(),
}));

const authenticateRequestMock = vi.mocked(authenticateRequest);
const CALLER = { id: "partner-1", email: "partner@example.com", name: "Partner" };

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/vault/sparks/spark-1/tease-response", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer real-user-token" },
    body: JSON.stringify(body),
  });
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("POST /api/vault/sparks/[id]/tease-response", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("rejects an unauthenticated request", async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null });

    const response = await POST(makeRequest({ response: "curious" }), makeParams("spark-1"));

    expect(response.status).toBe(401);
  });

  it.each(["curious", "maybe_later", "not_tonight", "not_for_me"])(
    "accepts the valid response value '%s'",
    async (value) => {
      const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
      authenticateRequestMock.mockResolvedValue({
        user: CALLER,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        supabase: { rpc } as any,
      });

      const response = await POST(makeRequest({ response: value }), makeParams("spark-1"));

      expect(response.status).toBe(200);
      expect(rpc).toHaveBeenCalledWith("respond_to_vault_tease", { p_spark_id: "spark-1", p_response: value });
    },
  );

  it("rejects a response value outside the fixed 4-way vocabulary before it reaches the RPC", async () => {
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: {} as any,
    });

    const response = await POST(makeRequest({ response: "obsessed" }), makeParams("spark-1"));

    expect(response.status).toBe(400);
  });

  it("maps 'not the active partner of this spark's owner' to 403 — only the connected partner may respond, not an arbitrary caller guessing a spark id", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: "not the active partner of this spark's owner" } });
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    });

    const response = await POST(makeRequest({ response: "curious" }), makeParams("someone-elses-spark"));

    expect(response.status).toBe(403);
  });

  it("maps 'this spark is not awaiting a tease response' to 409 (already responded, or not teased)", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: "this spark is not awaiting a tease response" } });
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    });

    const response = await POST(makeRequest({ response: "curious" }), makeParams("spark-1"));

    expect(response.status).toBe(409);
  });
});
