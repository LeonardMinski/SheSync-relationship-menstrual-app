import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authenticateRequest, requireTrackingEnabled } from "@/lib/api/authentication";
import { createErrorResponse } from "@/lib/api/responses";

import { DELETE, GET } from "./route";

vi.mock("@/lib/api/authentication", () => ({
  authenticateRequest: vi.fn(),
  requireTrackingEnabled: vi.fn(() => null),
}));

const authenticateRequestMock = vi.mocked(authenticateRequest);
const CALLER = { id: "user-1", email: "person@example.com", name: "Person" };

function makeRequest(path: string, { method = "GET", authorized = true }: { method?: string; authorized?: boolean } = {}) {
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers: authorized ? { authorization: "Bearer token" } : {},
  });
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("GET /api/coach/conversations/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("rejects an unauthenticated request", async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null });

    const response = await GET(makeRequest("/api/coach/conversations/c1", { authorized: false }), makeParams("c1"));

    expect(response.status).toBe(401);
  });

  it("returns 404 for a conversation owned by someone else — the query is always scoped to the caller's own id, never trusts the URL alone", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eqOwner = vi.fn(() => ({ maybeSingle }));
    const eqId = vi.fn(() => ({ eq: eqOwner }));
    const select = vi.fn(() => ({ eq: eqId }));
    const from = vi.fn(() => ({ select }));
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    });

    const response = await GET(makeRequest("/api/coach/conversations/someone-elses-id"), makeParams("someone-elses-id"));

    expect(response.status).toBe(404);
    expect(eqOwner).toHaveBeenCalledWith("owner_user_id", "user-1");
  });

  it("returns the conversation with its messages in order for the real owner", async () => {
    const conversationSingle = vi
      .fn()
      .mockResolvedValue({ data: { id: "c1", title: "My conversation", created_at: "t0", updated_at: "t1" }, error: null });
    const messagesOrder = vi.fn().mockResolvedValue({
      data: [
        {
          id: "m1",
          conversation_id: "c1",
          role: "user",
          content: "Hi",
          from_logs: null,
          general_context: null,
          question_to_consider: null,
          optional_next_step: null,
          partner_translation_available: false,
          created_at: "t0",
        },
      ],
      error: null,
    });

    let call = 0;
    const from = vi.fn(() => {
      call += 1;
      if (call === 1) {
        return { select: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: conversationSingle })) })) })) };
      }
      return { select: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => ({ order: messagesOrder })) })) })) };
    });

    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    });

    const response = await GET(makeRequest("/api/coach/conversations/c1"), makeParams("c1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.conversation.title).toBe("My conversation");
    expect(body.data.conversation.messages).toHaveLength(1);
    expect(body.data.conversation.messages[0].role).toBe("user");
  });

  it("blocks a tracking-disabled (partner-only) account server-side — not just hidden navigation", async () => {
    const from = vi.fn();
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    });
    vi.mocked(requireTrackingEnabled).mockReturnValueOnce(createErrorResponse("Blocked", 403));

    const response = await GET(makeRequest("/api/coach/conversations/c1"), makeParams("c1"));

    expect(response.status).toBe(403);
    expect(from).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/coach/conversations/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("rejects an unauthenticated request", async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null });

    const response = await DELETE(makeRequest("/api/coach/conversations/c1", { method: "DELETE", authorized: false }), makeParams("c1"));

    expect(response.status).toBe(401);
  });

  it("returns 404 rather than deleting anything when the conversation isn't the caller's own", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const select = vi.fn(() => ({ maybeSingle }));
    const eqOwner = vi.fn(() => ({ select }));
    const eqId = vi.fn(() => ({ eq: eqOwner }));
    const del = vi.fn(() => ({ eq: eqId }));
    const from = vi.fn(() => ({ delete: del }));
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    });

    const response = await DELETE(makeRequest("/api/coach/conversations/someone-elses-id", { method: "DELETE" }), makeParams("someone-elses-id"));

    expect(response.status).toBe(404);
    expect(eqOwner).toHaveBeenCalledWith("owner_user_id", "user-1");
  });

  it("deletes the caller's own conversation (messages cascade via the DB FK)", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { id: "c1" }, error: null });
    const select = vi.fn(() => ({ maybeSingle }));
    const eqOwner = vi.fn(() => ({ select }));
    const eqId = vi.fn(() => ({ eq: eqOwner }));
    const del = vi.fn(() => ({ eq: eqId }));
    const from = vi.fn(() => ({ delete: del }));
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    });

    const response = await DELETE(makeRequest("/api/coach/conversations/c1", { method: "DELETE" }), makeParams("c1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.deleted).toBe(true);
  });
});
