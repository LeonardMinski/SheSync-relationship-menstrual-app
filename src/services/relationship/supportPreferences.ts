import { request, type ApiResult } from "./client";
import type {
  SupportBarrier,
  SupportChoice,
  SupportContext,
  SupportPreference,
} from "@/types/relationship";

export async function getSupportPreferences(
  partnerId?: string,
): Promise<ApiResult<{ own: SupportPreference[]; partner: SupportPreference[] }>> {
  const query = partnerId ? `?partnerId=${encodeURIComponent(partnerId)}` : "";
  return request(`/api/support-preferences${query}`, { method: "GET" });
}

export async function upsertSupportPreference(input: {
  context: SupportContext;
  preferredSupports: SupportChoice[];
  whatDoesNotHelp: SupportBarrier[];
  additionalContext?: string | null;
}): Promise<ApiResult<{ preference: SupportPreference }>> {
  return request("/api/support-preferences", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function setSupportPreferenceShared(
  context: SupportContext,
  isShared: boolean,
): Promise<ApiResult<{ preference: SupportPreference }>> {
  return request("/api/support-preferences", {
    method: "PATCH",
    body: JSON.stringify({ context, isShared }),
  });
}
