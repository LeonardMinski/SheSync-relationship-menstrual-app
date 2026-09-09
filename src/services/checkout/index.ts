import { supabase } from "@/lib/supabase/client";
import type { PurchasablePlan } from "@/lib/stripe/plans";

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

/**
 * Starts a Stripe Checkout session for the caller's own account. Never
 * accepts a user id — the server always derives identity from the auth
 * token. Sends an internal plan identifier, never a Stripe Price ID —
 * the server owns that mapping (src/lib/stripe/plans.ts) so the client
 * can never determine its own entitlement by supplying a price.
 */
export async function createCheckoutSession(plan: PurchasablePlan): Promise<ApiResult<{ url: string; sessionId: string }>> {
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
      body: JSON.stringify({ plan }),
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
