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
  return new NextRequest("http://localhost/api/vault/sparks/spark-1/archive", {
    method: "POST",
    headers: { authorization: "Bearer real-user-token" },
  });
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("POST /api/vault/sparks/[id]/archive", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("rejects an unauthenticated request", async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null });

    const response = await POST(makeRequest(), makeParams("spark-1"));

    expect(response.status).toBe(401);
  });

  it("scopes the update to the caller's own user_id and excludes already-archived rows", async () => {
    const single = vi.fn().mockResolvedValue({
      data: { id: "spark-1", user_id: CALLER.id, status: "archived" },
      error: null,
    });
    const chain = { eq: vi.fn().mockReturnThis(), neq: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), single };
    const update = vi.fn().mockReturnValue(chain);
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from: vi.fn().mockReturnValue({ update }) } as any,
    });

    const response = await POST(makeRequest(), makeParams("spark-1"));

    expect(response.status).toBe(200);
    expect(chain.eq).toHaveBeenCalledWith("user_id", CALLER.id);
    expect(chain.neq).toHaveBeenCalledWith("status", "archived");
  });

  it("returns 409 for a not-found or already-archived Spark rather than a silent no-op success", async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } });
    const chain = { eq: vi.fn().mockReturnThis(), neq: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), single };
    const update = vi.fn().mockReturnValue(chain);
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from: vi.fn().mockReturnValue({ update }) } as any,
    });

    const response = await POST(makeRequest(), makeParams("spark-1"));

    expect(response.status).toBe(409);
  });
});
