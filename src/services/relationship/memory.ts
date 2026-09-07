import { request, type ApiResult } from "./client";
import type { RelationshipMemory, RelationshipMemorySourceType } from "@/types/relationship";

export async function getRelationshipMemory(): Promise<ApiResult<{ memories: RelationshipMemory[] }>> {
  return request("/api/relationship-memory", { method: "GET" });
}

export async function saveRelationshipMemory(input: {
  sourceType: RelationshipMemorySourceType;
  sourceId: string;
  title: string;
  content: string;
}): Promise<ApiResult<{ memory: RelationshipMemory }>> {
  return request("/api/relationship-memory", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
