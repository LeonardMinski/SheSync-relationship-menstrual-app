import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Privileged, server-only Supabase client. Bypasses RLS entirely — the
 * ONLY caller today is the Stripe webhook, which has no end-user
 * session to authenticate with and must still be able to write
 * public.subscriptions and sync public.users.subscription_tier.
 *
 * Do not import this from anything that could ship in a browser bundle
 * (no "use client" file, no component). Do not use it in any route
 * that handles a normal user request — those must keep using
 * authenticateRequest()'s per-request client so RLS stays the
 * authority for user-initiated writes.
 */
export const createServiceSupabaseClient = () => {
  const secretKey = env.SUPABASE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "Missing SUPABASE_SECRET_KEY — required for server-only privileged operations (e.g. the Stripe webhook).",
    );
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export default createServiceSupabaseClient;
