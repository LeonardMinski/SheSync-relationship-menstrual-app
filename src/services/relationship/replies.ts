import { request, type ApiResult } from "./client";
import type { ReplySourceType, SharedReply } from "@/types/relationship";

export async function getReplies(
  sourceType: ReplySourceType,
  sourceId: string,
): Promise<ApiResult<{ replies: SharedReply[] }>> {
  return request(
    `/api/replies?sourceType=${encodeURIComponent(sourceType)}&sourceId=${encodeURIComponent(sourceId)}`,
    { method: "GET" },
  );
}

export async function addReply(
  sourceType: ReplySourceType,
  sourceId: string,
  content: string,
): Promise<ApiResult<{ reply: SharedReply }>> {
  return request("/api/replies", {
    method: "POST",
    body: JSON.stringify({ sourceType, sourceId, content }),
  });
}
