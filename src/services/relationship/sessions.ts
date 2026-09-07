import { request, type ApiResult } from "./client";
import type { RelationshipSession, RevealCategory, SessionAnswer, SessionType } from "@/types/relationship";

export async function listSessions(
  sessionType?: SessionType,
): Promise<ApiResult<{ sessions: RelationshipSession[] }>> {
  const query = sessionType ? `?type=${encodeURIComponent(sessionType)}` : "";
  return request(`/api/relationship-sessions${query}`, { method: "GET" });
}

export async function startSession(
  sessionType: SessionType,
  category?: RevealCategory,
): Promise<ApiResult<{ session: RelationshipSession }>> {
  return request("/api/relationship-sessions", {
    method: "POST",
    body: JSON.stringify({ sessionType, category }),
  });
}

export async function getSession(
  sessionId: string,
): Promise<ApiResult<{ session: RelationshipSession; answers: SessionAnswer[] }>> {
  return request(`/api/relationship-sessions/${sessionId}`, { method: "GET" });
}

export async function submitSessionAnswer(
  sessionId: string,
  promptKey: string,
  answerText: string,
): Promise<ApiResult<null>> {
  return request(`/api/relationship-sessions/${sessionId}/answers`, {
    method: "POST",
    body: JSON.stringify({ promptKey, answerText }),
  });
}

export async function markSessionReady(sessionId: string): Promise<ApiResult<null>> {
  return request(`/api/relationship-sessions/${sessionId}/ready`, { method: "POST" });
}

export async function revealSessionTogether(sessionId: string): Promise<ApiResult<null>> {
  return request(`/api/relationship-sessions/${sessionId}/reveal`, { method: "POST" });
}
