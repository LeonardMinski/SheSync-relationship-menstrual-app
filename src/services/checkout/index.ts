import { supabase } from "@/lib/supabase/client";

type ApiResult<T> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: string };

async function getAccessToken(): Promise<string | null> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) {
    console.error("[checkout] failed to read Supabase session", error);
    return null;
  }
  return session?.access_token || null;
}

/** Starts a Stripe Checkout session for the caller's own account. Never accepts a user id — the server always derives identity from the auth token. */
export async function createCheckoutSession(priceId: string): Promise<ApiResult<{ url: string; sessionId: string }>> {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: "Authentication required" };
  }

  try {
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ priceId }),
    });

    const json = (await response.json().catch(() => ({}))) as { url?: string; sessionId?: string; error?: string };

    if (!response.ok || !json.url || !json.sessionId) {
      return { success: false, error: json.error || "Failed to create checkout session" };
    }

    return { success: true, data: { url: json.url, sessionId: json.sessionId } };
  } catch (error) {
    console.error("[checkout] request failed", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
