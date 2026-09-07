import { supabase } from "@/lib/supabase/client";
import type { Observation } from "@/types/patterns";

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
    console.error("[patterns] failed to read Supabase session", error);
    return null;
  }
  return session?.access_token || null;
}

/** The caller's own deterministic observations — see /api/patterns. Never accepts a user id; the server always derives identity from the auth token. */
export async function getObservations(): Promise<ApiResult<Observation[]>> {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: "Authentication required" };
  }

  try {
    const response = await fetch("/api/patterns", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const json = (await response.json().catch(() => ({}))) as ApiResponse<{ observations: Observation[] }>;

    if (!response.ok) {
      return { success: false, error: json.error || "Request failed" };
    }
    if (json.data === undefined) {
      return { success: false, error: "Malformed response from server" };
    }

    return { success: true, data: json.data.observations };
  } catch (error) {
    console.error("[patterns] request failed", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
