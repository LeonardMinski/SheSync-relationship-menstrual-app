import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authenticateRequest } from "@/lib/api/authentication";

import { GET, POST } from "./route";

vi.mock("@/lib/api/authentication", () => ({
  authenticateRequest: vi.fn(),
}));

const authenticateRequestMock = vi.mocked(authenticateRequest);
const CALLER = { id: "user-1", email: "person@example.com", name: "Person" };

function makeRequest(path: string, { method = "GET", authorized = true }: { method?: string; authorized?: boolean } = {}) {
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers: authorized ? { authorization: "Bearer token" } : {},
  });
}

describe("GET /api/coach/conversations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("rejects an unauthenticated request", async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null });

    const response = await GET(makeRequest("/api/coach/conversations", { authorized: false }));

    expect(response.status).toBe(401);
  });

  it("scopes the list to the caller's own conversations", async () => {
    const order = vi.fn().mockResolvedValue({ data: [], error: null });
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    });

    const response = await GET(makeRequest("/api/coach/conversations"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(eq).toHaveBeenCalledWith("owner_user_id", "user-1");
    expect(body.data.conversations).toEqual([]);
  });

  it("attaches a preview from the most recent message per conversation", async () => {
    const conversationsOrder = vi
      .fn()
      .mockResolvedValue({ data: [{ id: "c1", title: null, created_at: "t0", updated_at: "t1" }], error: null });
    const messagesOrder = vi.fn().mockResolvedValue({
      data: [{ conversation_id: "c1", content: "This is my most recent message about how I felt today" }],
      error: null,
    });

    let call = 0;
    const from = vi.fn(() => {
      call += 1;
      if (call === 1) {
        return { select: vi.fn(() => ({ eq: vi.fn(() => ({ order: conversationsOrder })) })) };
      }
      return {
        select: vi.fn(() => ({ eq: vi.fn(() => ({ in: vi.fn(() => ({ order: messagesOrder })) })) })),
      };
    });

    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    });

    const response = await GET(makeRequest("/api/coach/conversations"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.conversations[0].preview).toContain("most recent message");
  });
});

describe("POST /api/coach/conversations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("rejects an unauthenticated request", async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null });

    const response = await POST(makeRequest("/api/coach/conversations", { method: "POST", authorized: false }));

    expect(response.status).toBe(401);
  });

  it("creates an empty, untitled conversation owned by the authenticated caller", async () => {
    const single = vi.fn().mockResolvedValue({
      data: { id: "c1", title: null, created_at: "t0", updated_at: "t0" },
      error: null,
    });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    const from = vi.fn(() => ({ insert }));
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    });

    const response = await POST(makeRequest("/api/coach/conversations", { method: "POST" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(insert).toHaveBeenCalledWith({ owner_user_id: "user-1" });
    expect(body.data.conversation.title).toBeNull();
  });
});
