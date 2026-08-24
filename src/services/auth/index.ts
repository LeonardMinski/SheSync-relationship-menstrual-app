import { supabase } from "@/lib/supabase/client";
import type {
  AuthErrorCode,
  PrivacySettingsRecord,
  SignInInput,
  SignUpInput,
  UserRecord,
} from "@/types";
import type { Session, User as SupabaseAuthUser } from "@supabase/supabase-js";

export type AuthServiceError = {
  code: AuthErrorCode;
  message: string;
  cause?: unknown;
};

export type AuthServiceResult = {
  session: Session | null;
  user: UserRecord | null;
  error: AuthServiceError | null;
  requiresEmailVerification?: boolean;
};

export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  INVALID_CREDENTIALS: "Incorrect email or password.",
  EMAIL_NOT_CONFIRMED: "Please verify your email before signing in.",
  ACCOUNT_ALREADY_EXISTS:
    "An account may already exist for this email. Try signing in or resetting your password.",
  RATE_LIMITED: "Too many attempts. Please wait a moment and try again.",
  WEAK_PASSWORD: "Password must be at least 8 characters.",
  PROFILE_ERROR:
    "You're signed in, but we couldn't load your profile. Please try again.",
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  UNKNOWN: "Something went wrong. Please try again.",
};

const DEFAULT_PRIVACY_SETTINGS: PrivacySettingsRecord = {
  share_with_partner: false,
  share_cycle_phase: false,
  share_mood: false,
  share_fantasy_vault: false,
  share_intimacy_deck: false,
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }

  if (typeof error === "string") return error;

  return "";
};

export const createAuthError = (
  code: AuthErrorCode,
  cause?: unknown,
  message = AUTH_ERROR_MESSAGES[code],
): AuthServiceError => ({
  code,
  message,
  cause,
});

export const translateAuthError = (
  error: unknown,
  fallbackCode: AuthErrorCode = "UNKNOWN",
): AuthServiceError => {
  const rawMessage = getErrorMessage(error);
  const message = rawMessage.toLowerCase();

  if (
    message.includes("invalid login credentials") ||
    message.includes("invalid credentials") ||
    message.includes("email not found") ||
    message.includes("user not found")
  ) {
    return createAuthError("INVALID_CREDENTIALS", error);
  }

  if (
    message.includes("email not confirmed") ||
    message.includes("email_not_confirmed") ||
    message.includes("not confirmed")
  ) {
    return createAuthError("EMAIL_NOT_CONFIRMED", error);
  }

  if (
    message.includes("already registered") ||
    message.includes("already exists") ||
    message.includes("user already")
  ) {
    return createAuthError("ACCOUNT_ALREADY_EXISTS", error);
  }

  if (
    message.includes("rate limit") ||
    message.includes("too many") ||
    message.includes("over request rate limit")
  ) {
    return createAuthError("RATE_LIMITED", error);
  }

  if (
    message.includes("weak password") ||
    message.includes("password should") ||
    message.includes("password must")
  ) {
    return createAuthError("WEAK_PASSWORD", error);
  }

  if (
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("fetch failed")
  ) {
    return createAuthError("NETWORK_ERROR", error);
  }

  return createAuthError(fallbackCode, error);
};

const getDisplayName = (user: SupabaseAuthUser) => {
  const metadataName = user.user_metadata?.name;

  if (typeof metadataName === "string" && metadataName.trim()) {
    return metadataName.trim();
  }

  return user.email?.split("@")[0] || "User";
};

const buildUserRecord = (
  user: SupabaseAuthUser,
  overrides: Partial<
    Pick<UserRecord, "email" | "name" | "created_at" | "privacy_settings">
  > = {},
): UserRecord => ({
  id: user.id,
  email: overrides.email ?? user.email ?? "",
  name: overrides.name ?? getDisplayName(user),
  subscription_tier: "free",
  created_at:
    overrides.created_at ?? user.created_at ?? new Date().toISOString(),
  profile_image_url: null,
  privacy_settings: overrides.privacy_settings ?? {
    ...DEFAULT_PRIVACY_SETTINGS,
  },
});

const hasNoSignUpIdentities = (user: SupabaseAuthUser) =>
  Array.isArray(user.identities) && user.identities.length === 0;

const createUserProfile = async (
  user: UserRecord,
): Promise<AuthServiceError | null> => {
  const { error } = await supabase.from("users").upsert(user);

  if (error) {
    return createAuthError("PROFILE_ERROR", error);
  }

  return null;
};

const loadOrCreateUserProfile = async (
  authUser: SupabaseAuthUser,
): Promise<{ user: UserRecord | null; error: AuthServiceError | null }> => {
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  if (profileError) {
    return {
      user: null,
      error: createAuthError("PROFILE_ERROR", profileError),
    };
  }

  if (profile) {
    return {
      user: profile as UserRecord,
      error: null,
    };
  }

  const newProfile = buildUserRecord(authUser);
  const createError = await createUserProfile(newProfile);

  if (createError) {
    return {
      user: null,
      error: createError,
    };
  }

  return {
    user: newProfile,
    error: null,
  };
};

export const auth = {
  async getCurrentUser(
    currentSession?: Session | null,
  ): Promise<AuthServiceResult> {
    try {
      const sessionResult =
        currentSession === undefined
          ? await supabase.auth.getSession()
          : { data: { session: currentSession }, error: null };
      const {
        data: { session },
        error: sessionError,
      } = sessionResult;

      if (sessionError) {
        return {
          session: null,
          user: null,
          error: translateAuthError(sessionError),
        };
      }

      if (!session?.user) {
        return { session: null, user: null, error: null };
      }

      const profileResult = await loadOrCreateUserProfile(session.user);

      return {
        session,
        user: profileResult.user,
        error: profileResult.error,
      };
    } catch (error) {
      console.error("Error getting current user:", error);
      return {
        session: null,
        user: null,
        error: translateAuthError(error),
      };
    }
  },

  async signUp(
    data: SignUpInput & { privacy_settings?: UserRecord["privacy_settings"] },
  ): Promise<AuthServiceResult> {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes("placeholder")) {
        return {
          session: null,
          user: null,
          error: createAuthError(
            "UNKNOWN",
            undefined,
            "Supabase not configured. Please check your environment variables.",
          ),
          requiresEmailVerification: false,
        };
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
          },
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/auth/callback`
              : undefined,
        },
      });

      if (authError) {
        console.error("Supabase signup error:", authError);
        return {
          session: null,
          user: null,
          error: translateAuthError(authError),
          requiresEmailVerification: false,
        };
      }

      if (!authData.user) {
        return {
          session: null,
          user: null,
          error: createAuthError("UNKNOWN"),
          requiresEmailVerification: false,
        };
      }

      if (hasNoSignUpIdentities(authData.user)) {
        return {
          session: null,
          user: null,
          error: createAuthError("ACCOUNT_ALREADY_EXISTS"),
          requiresEmailVerification: false,
        };
      }

      const requiresEmailVerification = !authData.session;

      if (requiresEmailVerification) {
        const pendingUser = buildUserRecord(authData.user, {
          email: data.email,
          name: data.name,
          created_at: new Date().toISOString(),
          privacy_settings: data.privacy_settings,
        });

        return {
          session: null,
          user: pendingUser,
          error: null,
          requiresEmailVerification: true,
        };
      }

      const profileResult = await loadOrCreateUserProfile(authData.user);

      return {
        session: authData.session,
        user: profileResult.user,
        error: profileResult.error,
        requiresEmailVerification: false,
      };
    } catch (error) {
      console.error("Error signing up:", error);
      return {
        session: null,
        user: null,
        error: translateAuthError(error),
        requiresEmailVerification: false,
      };
    }
  },

  async signIn(data: SignInInput): Promise<AuthServiceResult> {
    try {
      if (typeof window !== "undefined") {
        if (data.rememberMe) {
          window.localStorage?.setItem?.("supabase-remember-me", "true");
        } else {
          window.localStorage?.removeItem?.("supabase-remember-me");
        }
      }

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

      if (authError) {
        if (typeof window !== "undefined") {
          window.localStorage?.removeItem?.("supabase-remember-me");
        }

        return {
          session: null,
          user: null,
          error: translateAuthError(authError, "INVALID_CREDENTIALS"),
        };
      }

      if (!authData.session || !authData.user) {
        return {
          session: null,
          user: null,
          error: createAuthError("UNKNOWN"),
        };
      }

      const profileResult = await loadOrCreateUserProfile(authData.user);

      return {
        session: authData.session,
        user: profileResult.user,
        error: profileResult.error,
      };
    } catch (error) {
      console.error("Error signing in:", error);
      return {
        session: null,
        user: null,
        error: translateAuthError(error),
      };
    }
  },

  async requestPasswordReset(
    email: string,
    redirectTo?: string,
  ): Promise<{ error: AuthServiceError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo:
          redirectTo ??
          (typeof window !== "undefined"
            ? `${window.location.origin}/auth/reset-password`
            : undefined),
      });

      if (!error) {
        return { error: null };
      }

      const translatedError = translateAuthError(error);

      if (translatedError.code === "INVALID_CREDENTIALS") {
        return { error: null };
      }

      return { error: translatedError };
    } catch (error) {
      console.error("Error requesting password reset:", error);
      return { error: translateAuthError(error) };
    }
  },

  async updatePassword(password: string): Promise<{
    error: AuthServiceError | null;
  }> {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      return {
        error: error ? translateAuthError(error, "WEAK_PASSWORD") : null,
      };
    } catch (error) {
      console.error("Error updating password:", error);
      return { error: translateAuthError(error) };
    }
  },

  async signOut(): Promise<{ error: AuthServiceError | null }> {
    try {
      if (typeof window !== "undefined") {
        window.localStorage?.removeItem?.("supabase-remember-me");
      }

      const { error } = await supabase.auth.signOut();
      return { error: error ? translateAuthError(error) : null };
    } catch (error) {
      console.error("Error signing out:", error);
      return {
        error: translateAuthError(error),
      };
    }
  },
};

export const cycles = {
  async create(data: {
    user_id: string;
    phase: "menstrual" | "follicular" | "ovulation" | "luteal";
    mood: number;
    symptoms: string[];
  }): Promise<{ cycle: Record<string, unknown> | null; error: string | null }> {
    try {
      const { data: cycle, error } = await supabase
        .from("cycle_data")
        .insert({
          user_id: data.user_id,
          date: new Date().toISOString().split("T")[0],
          phase: data.phase,
          mood: data.mood,
          energy: 5,
          libido: 5,
          stress: 5,
          symptoms: data.symptoms,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating cycle entry:", error);
        return { cycle: null, error: error.message };
      }

      return { cycle, error: null };
    } catch (error) {
      return {
        cycle: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

export type { SignInInput, SignUpInput } from "@/types";
