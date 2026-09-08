import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authenticateRequest } from "@/lib/api/authentication";

import { POST } from "./route";

vi.mock("@/lib/api/authentication", () => ({
  authenticateRequest: vi.fn(),
}));

const authenticateRequestMock = vi.mocked(authenticateRequest);
const CALLER = { id: "user-1", email: "person@example.com", name: "Person" };

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/vault/sparks/spark-1/reaction", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer real-user-token" },
    body: JSON.stringify(body),
  });
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("POST /api/vault/sparks/[id]/reaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("rejects an unauthenticated request", async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null });

    const response = await POST(makeRequest({ reaction: "love_this" }), makeParams("spark-1"));

    expect(response.status).toBe(401);
  });

  it.each(["love_this", "curious", "lets_talk_first", "not_tonight", "not_for_me"])(
    "accepts the valid post-reveal reaction '%s' (a distinct 5-way vocabulary from the tease-response set)",
    async (value) => {
      const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
      authenticateRequestMock.mockResolvedValue({
        user: CALLER,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        supabase: { rpc } as any,
      });

      const response = await POST(makeRequest({ reaction: value }), makeParams("spark-1"));

      expect(response.status).toBe(200);
      expect(rpc).toHaveBeenCalledWith("react_to_revealed_vault_spark", { p_spark_id: "spark-1", p_reaction: value });
    },
  );

  it("rejects a tease-response value ('maybe_later') here — the two rating vocabularies are not interchangeable", async () => {
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: {} as any,
    });

    const response = await POST(makeRequest({ reaction: "maybe_later" }), makeParams("spark-1"));

    expect(response.status).toBe(400);
  });

  it("maps 'this spark has not been revealed yet' to 409 — cannot react before reveal", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: "this spark has not been revealed yet" } });
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    });

    const response = await POST(makeRequest({ reaction: "love_this" }), makeParams("spark-1"));

    expect(response.status).toBe(409);
  });
});
