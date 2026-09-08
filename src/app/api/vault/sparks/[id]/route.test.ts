import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authenticateRequest } from "@/lib/api/authentication";

import { DELETE, GET, PATCH } from "./route";

vi.mock("@/lib/api/authentication", () => ({
  authenticateRequest: vi.fn(),
}));

const authenticateRequestMock = vi.mocked(authenticateRequest);
const CALLER = { id: "user-1", email: "person@example.com", name: "Person" };

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function makeRequest(method: string, body?: unknown) {
  return new NextRequest("http://localhost/api/vault/sparks/spark-1", {
    method,
    headers: { "content-type": "application/json", authorization: "Bearer real-user-token" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

describe("GET /api/vault/sparks/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("rejects an unauthenticated request", async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null });

    const response = await GET(makeRequest("GET"), makeParams("spark-1"));

    expect(response.status).toBe(401);
  });

  it("returns 404 when RLS returns no row — owner-only access is enforced at the DB layer, not spoofable by id guessing", async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: "no rows" } });
    const eq = vi.fn().mockReturnValue({ single });
    const select = vi.fn().mockReturnValue({ eq });
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from: vi.fn().mockReturnValue({ select }) } as any,
    });

    const response = await GET(makeRequest("GET"), makeParams("someone-elses-spark"));

    expect(response.status).toBe(404);
  });
});

describe("PATCH /api/vault/sparks/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("rejects an unauthenticated request", async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null });

    const response = await PATCH(makeRequest("PATCH", { content: "updated" }), makeParams("spark-1"));

    expect(response.status).toBe(401);
  });

  it("rejects an empty patch body", async () => {
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: {} as any,
    });

    const response = await PATCH(makeRequest("PATCH", {}), makeParams("spark-1"));

    expect(response.status).toBe(400);
  });

  it("only edits a Spark whose status is still 'private' — the atomic status='private' filter rejects a teased/revealed Spark with 409, not silently editing it", async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } });
    const chain = {
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single,
    };
    const update = vi.fn().mockReturnValue(chain);
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from: vi.fn().mockReturnValue({ update }) } as any,
    });

    const response = await PATCH(makeRequest("PATCH", { content: "trying to edit a revealed spark" }), makeParams("spark-1"));

    expect(response.status).toBe(409);
    expect(chain.eq).toHaveBeenCalledWith("status", "private");
  });

  it("scopes the update to the caller's own user_id", async () => {
    const updatedRow = { id: "spark-1", user_id: CALLER.id, content: "updated" };
    const single = vi.fn().mockResolvedValue({ data: updatedRow, error: null });
    const chain = {
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single,
    };
    const update = vi.fn().mockReturnValue(chain);
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from: vi.fn().mockReturnValue({ update }) } as any,
    });

    const response = await PATCH(makeRequest("PATCH", { content: "updated" }), makeParams("spark-1"));

    expect(response.status).toBe(200);
    expect(chain.eq).toHaveBeenCalledWith("user_id", CALLER.id);
  });
});

describe("DELETE /api/vault/sparks/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("rejects an unauthenticated request", async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null });

    const response = await DELETE(makeRequest("DELETE"), makeParams("spark-1"));

    expect(response.status).toBe(401);
  });

  it("only deletes a Spark whose status is still 'private'", async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } });
    const chain = {
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single,
    };
    const del = vi.fn().mockReturnValue(chain);
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from: vi.fn().mockReturnValue({ delete: del }) } as any,
    });

    const response = await DELETE(makeRequest("DELETE"), makeParams("spark-1"));

    expect(response.status).toBe(409);
    expect(chain.eq).toHaveBeenCalledWith("status", "private");
  });
});
