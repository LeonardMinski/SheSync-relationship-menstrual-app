import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authenticateRequest } from "@/lib/api/authentication";
import { buildCoachContext } from "@/features/coach/context";
import { generateCoachReply } from "@/features/coach/openaiClient";
import { DEFAULT_COACH_CONTEXT_SELECTION } from "@/types/coach";

import { POST } from "./route";

vi.mock("@/lib/api/authentication", () => ({ authenticateRequest: vi.fn() }));
vi.mock("@/features/coach/context", () => ({ buildCoachContext: vi.fn() }));
vi.mock("@/features/coach/openaiClient", () => ({ generateCoachReply: vi.fn() }));

const authenticateRequestMock = vi.mocked(authenticateRequest);
const CALLER = { id: "user-1", email: "person@example.com", name: "Person" };

function makeRequest(path: string, { body, authorized = true }: { body?: unknown; authorized?: boolean } = {}) {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: authorized
      ? { "content-type": "application/json", authorization: "Bearer token" }
      : { "content-type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

const ASSISTANT_REPLY = {
  message: "Here's what I'm noticing.",
  fromLogs: null,
  generalContext: null,
  questionToConsider: null,
  optionalNextStep: null,
  partnerTranslationAvailable: false,
};

function makeSupabase({
  conversation,
  priorMessages = [],
}: {
  conversation: { id: string; title: string | null } | null;
  priorMessages?: unknown[];
}) {
  const conversationSingle = vi.fn().mockResolvedValue({ data: conversation, error: null });
  const historyLimit = vi.fn().mockResolvedValue({ data: priorMessages, error: null });
  const insertUserSingle = vi.fn().mockResolvedValue({
    data: {
      id: "m-user",
      conversation_id: "c1",
      role: "user",
      content: "hello",
      from_logs: null,
      general_context: null,
      question_to_consider: null,
      optional_next_step: null,
      partner_translation_available: false,
      created_at: "t1",
    },
    error: null,
  });
  const insertAssistantSingle = vi.fn().mockResolvedValue({
    data: {
      id: "m-assistant",
      conversation_id: "c1",
      role: "assistant",
      content: ASSISTANT_REPLY.message,
      from_logs: null,
      general_context: null,
      question_to_consider: null,
      optional_next_step: null,
      partner_translation_available: false,
      created_at: "t2",
    },
    error: null,
  });
  const updateEq = vi.fn().mockResolvedValue({ data: null, error: null });

  let insertCall = 0;
  const from = vi.fn((table: string) => {
    if (table === "coach_conversations") {
      return {
        select: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: conversationSingle })) })) })),
        update: vi.fn(() => ({ eq: vi.fn(() => ({ eq: updateEq })) })),
      };
    }
    if (table === "coach_messages") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ eq: vi.fn(() => ({ order: vi.fn(() => ({ limit: historyLimit })) })) })),
        })),
        insert: vi.fn(() => {
          insertCall += 1;
          const single = insertCall === 1 ? insertUserSingle : insertAssistantSingle;
          return { select: vi.fn(() => ({ single })) };
        }),
      };
    }
    throw new Error(`unexpected table ${table}`);
  });

  return { from, insertUserSingle, insertAssistantSingle, updateEq, conversationSingle };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.mocked(buildCoachContext).mockResolvedValue({ contextText: "context", sourcesUsed: [] });
  vi.mocked(generateCoachReply).mockResolvedValue(ASSISTANT_REPLY);
});

describe("POST /api/coach/conversations/[id]/messages", () => {
  it("rejects an unauthenticated request", async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null });

    const response = await POST(makeRequest("/x", { authorized: false, body: { content: "hi" } }), makeParams("c1"));

    expect(response.status).toBe(401);
  });

  it("rejects an empty message", async () => {
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: {} as any,
    });

    const response = await POST(makeRequest("/x", { body: { content: "" } }), makeParams("c1"));

    expect(response.status).toBe(400);
    expect(generateCoachReply).not.toHaveBeenCalled();
  });

  it("returns 404 (wrong relationship) for a conversation that isn't the caller's own — never reachable by guessing an id", async () => {
    const { from } = makeSupabase({ conversation: null });
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    });

    const response = await POST(makeRequest("/x", { body: { content: "hi" } }), makeParams("someone-elses-conversation"));

    expect(response.status).toBe(404);
    expect(generateCoachReply).not.toHaveBeenCalled();
  });

  it("returns a safe error (never the raw provider error) when AI generation fails, and does not silently drop the user's message from the transcript", async () => {
    const { from, insertUserSingle } = makeSupabase({ conversation: { id: "c1", title: null } });
    vi.mocked(generateCoachReply).mockRejectedValue(new Error("OpenAI rate limit exceeded: sk-proj-abcdef"));
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    });

    const response = await POST(makeRequest("/x", { body: { content: "hi" } }), makeParams("c1"));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error).not.toMatch(/sk-proj|rate limit exceeded/i);
    // The user's message was already saved before the AI call — it isn't lost.
    expect(insertUserSingle).toHaveBeenCalled();
  });

  it("passes the client's requested recentObservations preference through to buildCoachContext unmodified", async () => {
    const { from } = makeSupabase({ conversation: { id: "c1", title: null } });
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    });

    await POST(
      makeRequest("/x", {
        body: { content: "hi", context: { dailyCheckIns: true, cycleContext: true, periodHistory: true, recentObservations: true } },
      }),
      makeParams("c1"),
    );

    const selectionArg = vi.mocked(buildCoachContext).mock.calls[0][2];
    expect(selectionArg.recentObservations).toBe(true);
  });

  it("merges an omitted recentObservations preference with the default selection rather than forcing it off", async () => {
    const { from } = makeSupabase({ conversation: { id: "c1", title: null } });
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    });

    await POST(makeRequest("/x", { body: { content: "hi" } }), makeParams("c1"));

    const selectionArg = vi.mocked(buildCoachContext).mock.calls[0][2];
    expect(selectionArg.recentObservations).toBe(DEFAULT_COACH_CONTEXT_SELECTION.recentObservations);
  });

  it("saves both the user message and the assistant reply, and sets the title only on the very first message", async () => {
    const { from, updateEq } = makeSupabase({ conversation: { id: "c1", title: null }, priorMessages: [] });
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    });

    const response = await POST(makeRequest("/x", { body: { content: "My very first message" } }), makeParams("c1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.userMessage.role).toBe("user");
    expect(body.data.assistantMessage.role).toBe("assistant");
    expect(body.data.title).toBe("My very first message");
    expect(updateEq).toHaveBeenCalledWith("owner_user_id", "user-1");
  });

  it("does not overwrite an existing title on a later message in the same conversation", async () => {
    const { from } = makeSupabase({
      conversation: { id: "c1", title: "Existing title" },
      priorMessages: [{ id: "m0", role: "user", content: "earlier" }],
    });
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    });

    const response = await POST(makeRequest("/x", { body: { content: "a follow-up message" } }), makeParams("c1"));
    const body = await response.json();

    expect(body.data.title).toBe("Existing title");
  });

  it("only sends this conversation's own prior messages as history — the route never reaches into other conversations", async () => {
    const { from } = makeSupabase({
      conversation: { id: "c1", title: "Existing" },
      priorMessages: [
        { id: "m0", conversation_id: "c1", role: "user", content: "earlier turn", from_logs: null, general_context: null, question_to_consider: null, optional_next_step: null, partner_translation_available: false, created_at: "t0" },
      ],
    });
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { from } as any,
    });

    await POST(makeRequest("/x", { body: { content: "hi" } }), makeParams("c1"));

    const historyArg = vi.mocked(generateCoachReply).mock.calls[0][0].history;
    expect(historyArg).toEqual([{ role: "user", content: "earlier turn" }]);
  });
});
