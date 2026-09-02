import { supabase } from "@/lib/supabase/client";
import type {
  PartnerDataResponse,
  PartnerStatusResponse,
} from "@/types/partner";

async function authorizedFetch(path: string, init: RequestInit = {}) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("[partner] failed to read Supabase session", sessionError);
    throw new Error("Authentication required");
  }

  if (!session?.access_token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      ...(init.headers ?? {}),
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.error || "Request failed");
  }

  return body.data;
}

/** Fetches both directions of the caller's partner relationship. */
export async function getPartnerStatus(): Promise<PartnerStatusResponse> {
  const data = await authorizedFetch("/api/partner", { method: "GET" });
  return {
    ownerLink: data?.ownerLink ?? null,
    viewerLink: data?.viewerLink ?? null,
  };
}

/** Fetches the real, privacy-filtered data shared with the caller as viewer. */
export async function getPartnerSharedData(): Promise<PartnerDataResponse> {
  const data = await authorizedFetch("/api/partner/shared-data", {
    method: "GET",
  });

  return {
    sharedData: data?.sharedData ?? null,
    partnerLink: data?.partnerLink ?? null,
  };
}

/** Owner invites a viewer by email. */
export async function sendPartnerInvite(viewerEmail: string) {
  return authorizedFetch("/api/partner", {
    method: "POST",
    body: JSON.stringify({ viewerEmail }),
  });
}

/** Invited viewer accepts or declines a pending invite. */
export async function respondToInvite(
  linkId: string,
  action: "accept" | "decline",
) {
  return authorizedFetch("/api/partner", {
    method: "PATCH",
    body: JSON.stringify({ linkId, action }),
  });
}

/** Owner revokes their outgoing connection. */
export async function revokePartnerConnection() {
  return authorizedFetch("/api/partner", { method: "DELETE" });
}
