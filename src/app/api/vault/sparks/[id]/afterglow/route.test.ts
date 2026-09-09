import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authenticateRequest } from "@/lib/api/authentication";
import { requireVaultAccess } from "@/lib/api/entitlement";

import { GET, POST } from "./route";

vi.mock("@/lib/api/authentication", () => ({
  authenticateRequest: vi.fn(),
}));
vi.mock("@/lib/api/entitlement", () => ({
  requireVaultAccess: vi.fn(),
}));

const authenticateRequestMock = vi.mocked(authenticateRequest);
const requireVaultAccessMock = vi.mocked(requireVaultAccess);
const CALLER = { id: "user-1", email: "person@example.com", name: "Person" };

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function makeGetRequest() {
  return new NextRequest("http://localhost/api/vault/sparks/spark-1/afterglow", {
    method: "GET",
    headers: { authorization: "Bearer real-user-token" },
  });
}

function makePostRequest(body: unknown) {
  return new NextRequest("http://localhost/api/vault/sparks/spark-1/afterglow", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer real-user-token" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/vault/sparks/[id]/afterglow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireVaultAccessMock.mockResolvedValue(null);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("rejects an unauthenticated request", async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null });

    const response = await GET(makeGetRequest(), makeParams("spark-1"));

    expect(response.status).toBe(401);
  });

  it("maps 'not a participant in this spark' to 403 — no automatic disclosure to a non-participant", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: "not a participant in this spark" } });
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    });

    const response = await GET(makeGetRequest(), makeParams("spark-1"));

    expect(response.status).toBe(403);
  });

  it("returns both participants' reflections only via the RPC, once at least one exists", async () => {
    const rows = [{ author_id: CALLER.id, reaction: "loved_it", note: null, created_at: "2026-01-01T00:00:00Z" }];
    const rpc = vi.fn().mockResolvedValue({ data: rows, error: null });
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { rpc } as any,
    });

    const response = await GET(makeGetRequest(), makeParams("spark-1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.reflections).toEqual(rows);
    expect(rpc).toHaveBeenCalledWith("get_vault_afterglow_reflections", { p_spark_id: "spark-1" });
  });
});

describe("POST /api/vault/sparks/[id]/afterglow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireVaultAccessMock.mockResolvedValue(null);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("rejects an unauthenticated request", async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null });

    const response = await POST(makePostRequest({ reaction: "loved_it" }), makeParams("spark-1"));

    expect(response.status).toBe(401);
  });

  it("scopes the reflection to the caller as author_id — a private answer authored only by the caller, never on another user's behalf", async () => {
    const single = vi.fn().mockResolvedValue({
      data: { id: "reflection-1", spark_id: "spark-1", author_id: CALLER.id, reaction: "loved_it", note: null },
      error: null,
    });
    const select = vi.fn().mockReturnValue({ single });
    const upsert = vi.fn().mockReturnValue({ select });
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from: vi.fn().mockReturnValue({ upsert }) } as any,
    });

    const response = await POST(makePostRequest({ reaction: "loved_it", note: "it was good" }), makeParams("spark-1"));

    expect(response.status).toBe(200);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ spark_id: "spark-1", author_id: CALLER.id, reaction: "loved_it" }),
      expect.objectContaining({ onConflict: "spark_id,author_id" }),
    );
  });

  it("maps the validate-trigger's 'before it has been revealed' failure to 409 — cannot reflect before reveal", async () => {
    const single = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "cannot reflect on a Spark before it has been revealed" },
    });
    const select = vi.fn().mockReturnValue({ single });
    const upsert = vi.fn().mockReturnValue({ select });
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from: vi.fn().mockReturnValue({ upsert }) } as any,
    });

    const response = await POST(makePostRequest({ reaction: "loved_it" }), makeParams("spark-1"));

    expect(response.status).toBe(409);
  });

  it("maps the validate-trigger's 'is not the Spark owner or an active partner' failure to 409 — no automatic disclosure to a non-participant", async () => {
    const single = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "author_id is not the Spark owner or an active partner" },
    });
    const select = vi.fn().mockReturnValue({ single });
    const upsert = vi.fn().mockReturnValue({ select });
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from: vi.fn().mockReturnValue({ upsert }) } as any,
    });

    const response = await POST(makePostRequest({ reaction: "loved_it" }), makeParams("spark-1"));

    expect(response.status).toBe(409);
  });
});
