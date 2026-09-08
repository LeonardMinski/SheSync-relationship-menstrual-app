import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authenticateRequest } from "@/lib/api/authentication";

import { GET, POST } from "./route";

vi.mock("@/lib/api/authentication", () => ({
  authenticateRequest: vi.fn(),
}));

const authenticateRequestMock = vi.mocked(authenticateRequest);
const CALLER = { id: "user-1", email: "person@example.com", name: "Person" };

function makeGetRequest(query = "") {
  return new NextRequest(`http://localhost/api/vault/sparks${query}`, {
    method: "GET",
    headers: { authorization: "Bearer real-user-token" },
  });
}

function makePostRequest(body: unknown) {
  return new NextRequest("http://localhost/api/vault/sparks", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer real-user-token" },
    body: JSON.stringify(body),
  });
}

function makeSupabaseStub({ selectResult = { data: [], error: null }, insertResult = { data: null, error: null } } = {}) {
  const eq = vi.fn().mockReturnThis();
  const order = vi.fn().mockResolvedValue(selectResult);
  const select = vi.fn().mockReturnValue({ eq, order, single: vi.fn().mockResolvedValue(insertResult) });
  const insert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue(insertResult) }) });
  const from = vi.fn().mockReturnValue({ select, eq, order, insert });
  return { from };
}

describe("GET /api/vault/sparks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("rejects an unauthenticated request", async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null });

    const response = await GET(makeGetRequest());

    expect(response.status).toBe(401);
  });

  it("scopes the query to the caller's own user_id", async () => {
    const supabase = makeSupabaseStub();
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: supabase as any,
    });

    await GET(makeGetRequest());

    expect(supabase.from).toHaveBeenCalledWith("vault_sparks");
    const selectCall = supabase.from.mock.results[0].value.select;
    expect(selectCall).toHaveBeenCalledWith("*");
    const eqCall = supabase.from.mock.results[0].value.eq;
    expect(eqCall).toHaveBeenCalledWith("user_id", CALLER.id);
  });
});

describe("POST /api/vault/sparks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("rejects an unauthenticated request", async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null });

    const response = await POST(makePostRequest({ heatLevel: "warm", content: "test" }));

    expect(response.status).toBe(401);
  });

  it("rejects an invalid heat level", async () => {
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: makeSupabaseStub() as any,
    });

    const response = await POST(makePostRequest({ heatLevel: "spicy", content: "test" }));

    expect(response.status).toBe(400);
  });

  it("rejects empty content", async () => {
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: makeSupabaseStub() as any,
    });

    const response = await POST(makePostRequest({ heatLevel: "warm", content: "" }));

    expect(response.status).toBe(400);
  });

  it("rejects a client-supplied status or user_id (schema is .strict())", async () => {
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: makeSupabaseStub() as any,
    });

    const response = await POST(
      makePostRequest({ heatLevel: "warm", content: "test", status: "revealed", user_id: "someone-else" }),
    );

    expect(response.status).toBe(400);
  });

  it("creates the Spark scoped to the caller's own user_id, ignoring any client-supplied identity", async () => {
    const insertedRow = { id: "spark-1", user_id: CALLER.id, status: "private", content: "test" };
    const single = vi.fn().mockResolvedValue({ data: insertedRow, error: null });
    const insert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) });
    const supabase = { from: vi.fn().mockReturnValue({ insert }) };

    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: supabase as any,
    });

    const response = await POST(makePostRequest({ heatLevel: "hot", content: "  test  " }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: CALLER.id, heat_level: "hot", content: "test" }),
    );
    expect(body.data.status).toBe("private");
  });
});
