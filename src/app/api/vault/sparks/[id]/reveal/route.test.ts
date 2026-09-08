import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authenticateRequest } from "@/lib/api/authentication";

import { POST } from "./route";

vi.mock("@/lib/api/authentication", () => ({
  authenticateRequest: vi.fn(),
}));

const authenticateRequestMock = vi.mocked(authenticateRequest);
const CALLER = { id: "user-1", email: "person@example.com", name: "Person" };

function makeRequest() {
  return new NextRequest("http://localhost/api/vault/sparks/spark-1/reveal", {
    method: "POST",
    headers: { authorization: "Bearer real-user-token" },
  });
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("POST /api/vault/sparks/[id]/reveal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("rejects an unauthenticated request", async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null });

    const response = await POST(makeRequest(), makeParams("spark-1"));

    expect(response.status).toBe(401);
  });

  it("calls reveal_vault_spark_together, the only RPC allowed to set revealed_at via the ceremony path", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    });

    const response = await POST(makeRequest(), makeParams("spark-1"));

    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("reveal_vault_spark_together", { p_spark_id: "spark-1" });
  });

  it("maps 'both participants must be ready before revealing' to 409 — reveal cannot be forced by one side alone", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: "both participants must be ready before revealing" } });
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    });

    const response = await POST(makeRequest(), makeParams("spark-1"));

    expect(response.status).toBe(409);
  });

  it("maps 'relationship is no longer active' to 403 — a disconnect blocks reveal even mid-ceremony", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: "relationship is no longer active" } });
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    });

    const response = await POST(makeRequest(), makeParams("spark-1"));

    expect(response.status).toBe(403);
  });
});
