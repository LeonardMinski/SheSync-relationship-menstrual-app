import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCoachWorkspace } from "./useCoachWorkspace";
import {
  createConversation,
  deleteConversation,
  getConversation,
  listConversations,
  sendMessage,
} from "@/services/coach";

vi.mock("@/services/coach", () => ({
  createConversation: vi.fn(),
  deleteConversation: vi.fn(),
  getConversation: vi.fn(),
  listConversations: vi.fn(),
  sendMessage: vi.fn(),
}));

const ASSISTANT_MESSAGE = {
  id: "m-assistant",
  conversationId: "c1",
  role: "assistant" as const,
  content: "Here's what I noticed.",
  fromLogs: null,
  generalContext: null,
  questionToConsider: null,
  optionalNextStep: null,
  partnerTranslationAvailable: false,
  createdAt: "t2",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listConversations).mockResolvedValue({ success: true, data: [] });
});

describe("useCoachWorkspace — sending a message", () => {
  it("creates a conversation lazily on the first send, not on mount or 'New Conversation'", async () => {
    const { result } = renderHook(() => useCoachWorkspace());
    await waitFor(() => expect(result.current.loadingList).toBe(false));

    expect(createConversation).not.toHaveBeenCalled();

    vi.mocked(createConversation).mockResolvedValue({
      success: true,
      data: { id: "c1", title: null, createdAt: "t0", updatedAt: "t0", preview: null },
    });
    vi.mocked(sendMessage).mockResolvedValue({
      success: true,
      data: {
        userMessage: { id: "m-user", conversationId: "c1", role: "user", content: "hi", fromLogs: null, generalContext: null, questionToConsider: null, optionalNextStep: null, partnerTranslationAvailable: false, createdAt: "t1" },
        assistantMessage: ASSISTANT_MESSAGE,
        title: "hi",
      },
    });

    await act(async () => {
      await result.current.sendUserMessage("hi");
    });

    expect(createConversation).toHaveBeenCalledTimes(1);
    expect(result.current.activeConversationId).toBe("c1");
    expect(result.current.messages.map((m) => m.role)).toEqual(["user", "assistant"]);
  });

  it("shows the user's message immediately (optimistic), then reconciles with the server response", async () => {
    vi.mocked(createConversation).mockResolvedValue({
      success: true,
      data: { id: "c1", title: null, createdAt: "t0", updatedAt: "t0", preview: null },
    });
    let resolveSend: (value: unknown) => void = () => {};
    vi.mocked(sendMessage).mockReturnValue(new Promise((resolve) => (resolveSend = resolve)) as never);

    const { result } = renderHook(() => useCoachWorkspace());
    await waitFor(() => expect(result.current.loadingList).toBe(false));

    act(() => {
      void result.current.sendUserMessage("optimistic test");
    });

    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    expect(result.current.messages[0].content).toBe("optimistic test");
    expect(result.current.sending).toBe(true);

    await act(async () => {
      resolveSend({
        success: true,
        data: {
          userMessage: { id: "m-user", conversationId: "c1", role: "user", content: "optimistic test", fromLogs: null, generalContext: null, questionToConsider: null, optionalNextStep: null, partnerTranslationAvailable: false, createdAt: "t1" },
          assistantMessage: ASSISTANT_MESSAGE,
          title: "optimistic test",
        },
      });
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.sending).toBe(false);
  });

  it("removes the optimistic message and preserves the failed content for retry when sending fails", async () => {
    vi.mocked(createConversation).mockResolvedValue({
      success: true,
      data: { id: "c1", title: null, createdAt: "t0", updatedAt: "t0", preview: null },
    });
    vi.mocked(sendMessage).mockResolvedValue({ success: false, error: "network error" });

    const { result } = renderHook(() => useCoachWorkspace());
    await waitFor(() => expect(result.current.loadingList).toBe(false));

    await act(async () => {
      await result.current.sendUserMessage("this will fail");
    });

    expect(result.current.messages).toHaveLength(0);
    expect(result.current.error).toBe("network error");
    expect(result.current.pendingContent).toBe("this will fail");
  });

  it("retry resends the exact preserved content without requiring the user to retype it", async () => {
    vi.mocked(createConversation).mockResolvedValue({
      success: true,
      data: { id: "c1", title: null, createdAt: "t0", updatedAt: "t0", preview: null },
    });
    vi.mocked(sendMessage).mockResolvedValueOnce({ success: false, error: "network error" });

    const { result } = renderHook(() => useCoachWorkspace());
    await waitFor(() => expect(result.current.loadingList).toBe(false));

    await act(async () => {
      await result.current.sendUserMessage("retry me");
    });
    expect(result.current.pendingContent).toBe("retry me");

    vi.mocked(sendMessage).mockResolvedValueOnce({
      success: true,
      data: {
        userMessage: { id: "m-user", conversationId: "c1", role: "user", content: "retry me", fromLogs: null, generalContext: null, questionToConsider: null, optionalNextStep: null, partnerTranslationAvailable: false, createdAt: "t1" },
        assistantMessage: ASSISTANT_MESSAGE,
        title: "retry me",
      },
    });

    await act(async () => {
      result.current.retry();
      await Promise.resolve();
    });

    await waitFor(() => expect(result.current.pendingContent).toBeNull());
    expect(sendMessage).toHaveBeenCalledWith("c1", "retry me", undefined);
  });

  it("retry resends with the same context selection the original failed attempt used, not the defaults", async () => {
    vi.mocked(createConversation).mockResolvedValue({
      success: true,
      data: { id: "c1", title: null, createdAt: "t0", updatedAt: "t0", preview: null },
    });
    vi.mocked(sendMessage).mockResolvedValueOnce({ success: false, error: "network error" });

    const { result } = renderHook(() => useCoachWorkspace());
    await waitFor(() => expect(result.current.loadingList).toBe(false));

    const usedContext = { dailyCheckIns: true, cycleContext: false, periodHistory: false, recentObservations: false };
    await act(async () => {
      await result.current.sendUserMessage("retry me", usedContext);
    });
    expect(result.current.pendingContent).toBe("retry me");

    vi.mocked(sendMessage).mockResolvedValueOnce({
      success: true,
      data: {
        userMessage: { id: "m-user", conversationId: "c1", role: "user", content: "retry me", fromLogs: null, generalContext: null, questionToConsider: null, optionalNextStep: null, partnerTranslationAvailable: false, createdAt: "t1" },
        assistantMessage: ASSISTANT_MESSAGE,
        title: "retry me",
      },
    });

    await act(async () => {
      result.current.retry();
      await Promise.resolve();
    });

    await waitFor(() => expect(result.current.pendingContent).toBeNull());
    expect(sendMessage).toHaveBeenCalledWith("c1", "retry me", usedContext);
  });
});

describe("useCoachWorkspace — conversation list management", () => {
  it("startNewConversation resets local state without any API call", async () => {
    const { result } = renderHook(() => useCoachWorkspace());
    await waitFor(() => expect(result.current.loadingList).toBe(false));

    act(() => {
      result.current.startNewConversation();
    });

    expect(result.current.activeConversationId).toBeNull();
    expect(result.current.messages).toEqual([]);
    expect(createConversation).not.toHaveBeenCalled();
  });

  it("openConversation loads an existing conversation's messages", async () => {
    vi.mocked(getConversation).mockResolvedValue({
      success: true,
      data: { id: "c1", title: "Old chat", createdAt: "t0", updatedAt: "t0", messages: [ASSISTANT_MESSAGE] },
    });

    const { result } = renderHook(() => useCoachWorkspace());
    await waitFor(() => expect(result.current.loadingList).toBe(false));

    await act(async () => {
      await result.current.openConversation("c1");
    });

    expect(result.current.activeConversationId).toBe("c1");
    expect(result.current.messages).toEqual([ASSISTANT_MESSAGE]);
  });

  it("removeConversation deletes and drops it from the list, and resets active state if it was the open one", async () => {
    vi.mocked(listConversations).mockResolvedValue({
      success: true,
      data: [{ id: "c1", title: "Old chat", createdAt: "t0", updatedAt: "t0", preview: null }],
    });
    vi.mocked(deleteConversation).mockResolvedValue({ success: true, data: { deleted: true } });
    vi.mocked(getConversation).mockResolvedValue({
      success: true,
      data: { id: "c1", title: "Old chat", createdAt: "t0", updatedAt: "t0", messages: [] },
    });

    const { result } = renderHook(() => useCoachWorkspace());
    await waitFor(() => expect(result.current.conversations).toHaveLength(1));

    await act(async () => {
      await result.current.openConversation("c1");
    });
    expect(result.current.activeConversationId).toBe("c1");

    await act(async () => {
      await result.current.removeConversation("c1");
    });

    expect(result.current.conversations).toHaveLength(0);
    expect(result.current.activeConversationId).toBeNull();
  });
});
