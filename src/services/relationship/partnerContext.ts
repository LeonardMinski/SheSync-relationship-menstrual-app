import { request, type ApiResult } from "./client";
import type {
  PartnerContext,
  PartnerContextStatus,
  TranslationExclusionChoice,
  TranslationHelpChoice,
} from "@/types/relationship";

export async function getPartnerContext(
  partnerId?: string,
): Promise<ApiResult<{ own: PartnerContext | null; partner: PartnerContext | null }>> {
  const query = partnerId ? `?partnerId=${encodeURIComponent(partnerId)}` : "";
  return request(`/api/partner-context${query}`, { method: "GET" });
}

export async function upsertPartnerContext(input: {
  whatTheyShouldKnow: string;
  mightHelp: TranslationHelpChoice[];
  dontNeed: TranslationExclusionChoice[];
}): Promise<ApiResult<{ context: PartnerContext }>> {
  return request("/api/partner-context", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function setPartnerContextStatus(
  status: Extract<PartnerContextStatus, "shared" | "revoked">,
): Promise<ApiResult<{ context: PartnerContext }>> {
  return request("/api/partner-context", {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
