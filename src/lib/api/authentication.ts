import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import type { AuthenticatedRequest } from "@/types";

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
      },
      supabase: authenticatedSupabase,
    };
  } catch (error) {
    console.error(`[auth] authentication error for ${routeName}`, error);
    return { user: null, supabase: null };
  }
}
