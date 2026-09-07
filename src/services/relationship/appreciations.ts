import { request, type ApiResult } from "./client";
import type { Appreciation } from "@/types/relationship";

export async function getAppreciations(): Promise<ApiResult<{ appreciations: Appreciation[] }>> {
  return request("/api/appreciations", { method: "GET" });
}

export async function sendAppreciation(
  content: string,
): Promise<ApiResult<{ appreciation: Appreciation }>> {
  return request("/api/appreciations", {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}
