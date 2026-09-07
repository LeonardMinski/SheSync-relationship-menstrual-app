import { supabase } from "@/lib/supabase/client";
import type { CoachContextSelection, CoachConversationDetail, CoachConversationSummary, CoachMessage } from "@/types/coach";

type ApiResult<T> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: string };

type ApiResponse<T> = {
  data?: T;
  error?: string;
};

async function getAccessToken(): Promise<string | null> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) {
    console.error("[coach] failed to read Supabase session", error);
    return null;
  }
  return session?.access_token || null;
}

async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: "Authentication required" };
  }

  try {
    const response = await fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...init?.headers,
      },
    });

    const json = (await response.json().catch(() => ({}))) as ApiResponse<T>;

    if (!response.ok) {
      return { success: false, error: json.error || "Request failed" };
    }
    if (json.data === undefined) {
      return { success: false, error: "Malformed response from server" };
    }

    return { success: true, data: json.data };
  } catch (error) {
    console.error(`[coach] request failed: ${path}`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function listConversations(): Promise<ApiResult<CoachConversationSummary[]>> {
  const result = await request<{ conversations: CoachConversationSummary[] }>("/api/coach/conversations", { method: "GET" });
  if (!result.success) return result;
  return { success: true, data: result.data.conversations };
}

export async function createConversation(): Promise<ApiResult<CoachConversationSummary>> {
  const result = await request<{ conversation: CoachConversationSummary }>("/api/coach/conversations", { method: "POST", body: "{}" });
  if (!result.success) return result;
  return { success: true, data: result.data.conversation };
}

export async function getConversation(id: string): Promise<ApiResult<CoachConversationDetail>> {
  const result = await request<{ conversation: CoachConversationDetail }>(`/api/coach/conversations/${id}`, { method: "GET" });
  if (!result.success) return result;
  return { success: true, data: result.data.conversation };
}

export async function deleteConversation(id: string): Promise<ApiResult<{ deleted: true }>> {
  return request(`/api/coach/conversations/${id}`, { method: "DELETE" });
}

export async function sendMessage(
  conversationId: string,
  content: string,
  context?: CoachContextSelection,
): Promise<ApiResult<{ userMessage: CoachMessage; assistantMessage: CoachMessage; title: string | null }>> {
  return request(`/api/coach/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content, ...(context ? { context } : {}) }),
  });
}
