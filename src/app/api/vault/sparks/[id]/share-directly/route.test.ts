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

function makeRequest() {
  return new NextRequest("http://localhost/api/vault/sparks/spark-1/share-directly", {
    method: "POST",
    headers: { authorization: "Bearer real-user-token" },
  });
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("POST /api/vault/sparks/[id]/share-directly", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireVaultAccessMock.mockResolvedValue(null);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("rejects an unauthenticated request", async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null });

    const response = await POST(makeRequest(), makeParams("spark-1"));

    expect(response.status).toBe(401);
  });

  it("maps 'no active partner relationship to share with' to 403 — cannot direct-share into a void", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: "no active partner relationship to share with" } });
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    });

    const response = await POST(makeRequest(), makeParams("spark-1"));

    expect(response.status).toBe(403);
  });

  it("calls share_vault_spark_directly, which reveals immediately and bypasses the ceremony", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    });

    const response = await POST(makeRequest(), makeParams("spark-1"));

    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("share_vault_spark_directly", { p_spark_id: "spark-1" });
  });
});
