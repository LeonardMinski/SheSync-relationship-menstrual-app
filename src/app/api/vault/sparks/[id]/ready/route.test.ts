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
  return new NextRequest("http://localhost/api/vault/sparks/spark-1/ready", {
    method: "POST",
    headers: { authorization: "Bearer real-user-token" },
  });
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("POST /api/vault/sparks/[id]/ready", () => {
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

  it("marks only the caller's own ready flag via the RPC — never sets revealed_at itself", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    });

    const response = await POST(makeRequest(), makeParams("spark-1"));

    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("mark_vault_spark_ready", { p_spark_id: "spark-1" });
  });

  it("maps 'not a participant in this spark's reveal' to 403", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: "not a participant in this spark's reveal" } });
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    });

    const response = await POST(makeRequest(), makeParams("spark-1"));

    expect(response.status).toBe(403);
  });
});
