import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type {
  Session,
  User as SupabaseAuthUser,
} from "@supabase/supabase-js";
import { authenticateRequest } from "@/lib/api/authentication";

const DEFAULT_PRIVACY_SETTINGS = {
  share_with_partner: false,
  share_cycle_phase: false,
  share_mood: false,
  share_fantasy_vault: false,
  share_intimacy_deck: false,
};

function createAuthSupabaseClient(accessToken?: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: accessToken
        ? {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        : undefined,
    },
  );
}

function getSafeAuthError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message?: unknown }).message)
        : "";
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("invalid login credentials") ||
    normalizedMessage.includes("invalid credentials") ||
    normalizedMessage.includes("user not found")
  ) {
    return {
      error: "Incorrect email or password.",
      errorCode: "INVALID_CREDENTIALS",
    };
  }

  if (normalizedMessage.includes("email not confirmed")) {
    return {
      error: "Please verify your email before signing in.",
      errorCode: "EMAIL_NOT_CONFIRMED",
    };
  }

  if (
    normalizedMessage.includes("already registered") ||
    normalizedMessage.includes("already exists") ||
    normalizedMessage.includes("user already")
  ) {
    return {
      error:
        "An account may already exist for this email. Try signing in or resetting your password.",
      errorCode: "ACCOUNT_ALREADY_EXISTS",
    };
  }

  if (
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("too many")
  ) {
    return {
      error: "Too many attempts. Please wait a moment and try again.",
      errorCode: "RATE_LIMITED",
    };
  }

  return {
    error: "Something went wrong. Please try again.",
    errorCode: "UNKNOWN",
  };
}

function hasNoSignUpIdentities(user: SupabaseAuthUser) {
  return Array.isArray(user.identities) && user.identities.length === 0;
}

async function loadOrCreateProfile({
  session,
  user,
  name,
}: {
  session: Session;
  user: SupabaseAuthUser;
  name?: string;
}) {
  const authenticatedSupabase = createAuthSupabaseClient(session.access_token);

  const { data: profile, error: profileError } = await authenticatedSupabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return {
      profile: null,
      profileError: {
        error:
          "You're signed in, but we couldn't load your profile. Please try again.",
        errorCode: "PROFILE_ERROR",
      },
    };
  }

  if (profile) {
    return { profile, profileError: null };
  }

  const { error: createProfileError } = await authenticatedSupabase
    .from("users")
    .upsert(
      {
        id: user.id,
        email: user.email ?? "",
        name: name || user.user_metadata?.name || user.email || "User",
        subscription_tier: "free",
        profile_image_url: null,
        privacy_settings: DEFAULT_PRIVACY_SETTINGS,
      },
      { onConflict: "id", ignoreDuplicates: true },
    );

  if (createProfileError) {
    return {
      profile: null,
      profileError: {
        error:
          "You're signed in, but we couldn't create your profile. Please try again.",
        errorCode: "PROFILE_ERROR",
      },
    };
  }

  return {
    profile: {
      id: user.id,
      email: user.email ?? "",
      name: name || user.user_metadata?.name || user.email || "User",
      subscription_tier: "free",
      profile_image_url: null,
      privacy_settings: DEFAULT_PRIVACY_SETTINGS,
    },
    profileError: null,
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAuthSupabaseClient();
    const { action, email, password, name } = await request.json();

    if (action === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
          emailRedirectTo: `${request.nextUrl.origin}/auth/callback`,
        },
      });

      if (error) {
        return NextResponse.json(getSafeAuthError(error), { status: 400 });
      }

      if (!data.user) {
        return NextResponse.json(getSafeAuthError(null), { status: 400 });
      }

      if (hasNoSignUpIdentities(data.user)) {
        return NextResponse.json(
          {
            error:
              "An account may already exist for this email. Try signing in or resetting your password.",
            errorCode: "ACCOUNT_ALREADY_EXISTS",
          },
          { status: 400 },
        );
      }

      if (!data.session) {
        return NextResponse.json({
          message: "Signup successful. Please check your email for verification.",
          user: data.user,
          session: null,
          requiresEmailVerification: true,
        });
      }

      const { profile, profileError } = await loadOrCreateProfile({
        session: data.session,
        user: data.user,
        name,
      });

      return NextResponse.json({
        message: "Signup successful.",
        user: data.user,
        session: data.session,
        profile,
        profileError,
        requiresEmailVerification: false,
      });
    }

    if (action === "login") {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return NextResponse.json(getSafeAuthError(error), { status: 400 });
      }

      if (!data.session || !data.user) {
        return NextResponse.json(getSafeAuthError(null), { status: 400 });
      }

      const { profile, profileError } = await loadOrCreateProfile({
        session: data.session,
        user: data.user,
      });

      return NextResponse.json({
        message: "Login successful",
        user: data.user,
        session: data.session,
        profile,
        profileError,
      });
    }

    if (action === "logout") {
      return NextResponse.json({ message: "Logout successful" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user || !supabase) {
      return NextResponse.json({ user: null });
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
    }

    return NextResponse.json({
      user: {
        ...user,
        profile: profile || null,
      },
      profileError: profileError
        ? {
            error:
              "You're signed in, but we couldn't load your profile. Please try again.",
            errorCode: "PROFILE_ERROR",
          }
        : null,
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
