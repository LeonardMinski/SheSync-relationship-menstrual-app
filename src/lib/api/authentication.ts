import { createClient } from "@supabase/supabase-js";
import type { NextRequest, NextResponse } from "next/server";
import { createErrorResponse } from "@/lib/api/responses";
import type { AuthenticatedRequest, AuthenticatedUser } from "@/types";

export async function authenticateRequest(
  request: NextRequest,
): Promise<AuthenticatedRequest> {
  const routeName = request.nextUrl?.pathname || "unknown route";

  try {
    const authHeader = request.headers.get("authorization");
    console.log("[auth]", {
      hasHeader: Boolean(authHeader),
    });

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error(`[auth] missing Bearer token for ${routeName}`);
      return { user: null, supabase: null };
    }

    const token = authHeader.substring(7);

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      console.error(`[auth] missing Supabase env vars for ${routeName}`);
      return { user: null, supabase: null };
    }

    const authenticatedSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      },
    );

    const {
      data: { user },
      error,
    } = await authenticatedSupabase.auth.getUser();

    if (error || !user) {
      console.error(`[auth] token verification failed for ${routeName}`, error);
      return { user: null, supabase: null };
    }

    const { data: profile, error: profileError } = await authenticatedSupabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error(
        `[auth] user profile lookup failed for ${routeName}`,
        profileError,
      );
    }

    return {
      user: {
        id: user.id,
        email: user.email ?? null,
        name: profile?.name || user.user_metadata?.name || "User",
        // undefined (not false) when the profile row itself failed to load —
        // requireTrackingEnabled treats that as unresolved and fails open,
        // mirroring isWaitingForTrackingStatus's client-side reasoning: a
        // transient profile lookup failure must never lock out a real
        // tracking-enabled user. tracking_enabled is NOT NULL DEFAULT true
        // in the database, so a successful profile fetch always yields a
        // real boolean here.
        trackingEnabled: profile ? Boolean(profile.tracking_enabled) : undefined,
      },
      supabase: authenticatedSupabase,
    };
  } catch (error) {
    console.error(`[auth] authentication error for ${routeName}`, error);
    return { user: null, supabase: null };
  }
}

/**
 * Server-side backstop for tracked-only routes (Cycle, Pattern Engine,
 * Coach — see TRACKED_ONLY_ROUTE_PREFIXES in
 * src/features/account/capabilities.ts). The app layout already redirects
 * a partner-only account away from these pages, but that is UX routing
 * only and never a security boundary — a direct API call bypasses it
 * entirely. Call this immediately after authenticateRequest in any
 * tracked-only route handler.
 *
 * Fails open (returns null, i.e. allowed) when trackingEnabled is
 * undefined — that means the profile row didn't load, and blocking a real
 * tracking-enabled user on a transient error would be worse than the
 * narrow window this leaves open. It only ever blocks a KNOWN
 * tracking_enabled = false account, mirroring the client-side
 * isWaitingForTrackingStatus/shouldBlockTrackedRoute reasoning exactly.
 */
export function requireTrackingEnabled(user: AuthenticatedUser): NextResponse | null {
  if (user.trackingEnabled === false) {
    return createErrorResponse("This feature isn't available for your account.", 403);
  }
  return null;
}
