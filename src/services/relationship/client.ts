import { supabase } from "@/lib/supabase/client";

export type ApiResult<T> =
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
    console.error("[relationship] failed to read Supabase session", error);
    return null;
  }
  return session?.access_token || null;
}

export async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
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
    console.error(`[relationship] request failed: ${path}`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
