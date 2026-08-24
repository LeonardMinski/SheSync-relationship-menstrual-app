"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase/client";
import { auth as dbAuth } from "@/services/auth/index";

import type {
  AuthResult,
  AuthContextType,
  PasswordResetResult,
  SignInInput,
  SignUpInput,
  User,
  UserRecord,
} from "@/types";

const mapDbUser = (rawUser: UserRecord | null | undefined): User | null => {
  if (!rawUser) {
    return null;
  }

  const privacySettings = rawUser.privacy_settings ?? {
    share_with_partner: false,
    share_cycle_phase: false,
    share_mood: false,
    share_fantasy_vault: false,
    share_intimacy_deck: false,
  };

  return {
    id: rawUser.id,
    email: rawUser.email,

    name: rawUser.name || rawUser.email || "User",

    subscriptionTier: rawUser.subscription_tier ?? "free",

    createdAt: new Date(rawUser.created_at),

    partnerId: rawUser.partner_id ?? undefined,

    privacySettings: {
      shareWithPartner: Boolean(privacySettings.share_with_partner),

      shareCyclePhase: Boolean(privacySettings.share_cycle_phase),

      shareMood: Boolean(privacySettings.share_mood),

      shareFantasyVault: Boolean(privacySettings.share_fantasy_vault),

      shareIntimacyDeck: Boolean(privacySettings.share_intimacy_deck),
    },

    profileImageUrl: rawUser.profile_image_url ?? undefined,

    created_at: rawUser.created_at,
  };
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const toAuthFailure = (
  error: NonNullable<Awaited<ReturnType<typeof dbAuth.signIn>>["error"]>,
): AuthResult => ({
  success: false,
  user: null,
  error: error.message,
  errorCode: error.code,
});

const toPasswordResetFailure = (
  error: NonNullable<
    Awaited<ReturnType<typeof dbAuth.requestPasswordReset>>["error"]
  >,
): PasswordResetResult => ({
  success: false,
  error: error.message,
  errorCode: error.code,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const [session, setSession] = useState<Session | null>(null);

  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const result = await dbAuth.getCurrentUser();

      setSession(result.session);
      setUser(result.user ? mapDbUser(result.user) : null);

      if (result.error) {
        console.error("Auth refresh error:", result.error);
      }
    } catch (error) {
      console.error("Auth refresh error:", error);
      setSession(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initialiseAuth = async () => {
      try {
        const result = await dbAuth.getCurrentUser();

        if (!mounted) {
          return;
        }

        setSession(result.session);

        setUser(result.user ? mapDbUser(result.user) : null);

        if (result.error) {
          console.error("Auth initialisation error:", result.error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void initialiseAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) {
        return;
      }

      setSession(nextSession);

      if (!nextSession) {
        setUser(null);
        setLoading(false);
        return;
      }

      /*
       * Don't perform a substantial awaited
       * database workflow directly inside the
       * Supabase callback.
       */

      void (async () => {
        const result = await dbAuth.getCurrentUser(nextSession);

        if (!mounted) {
          return;
        }

        setUser(result.user ? mapDbUser(result.user) : null);

        if (result.error) {
          console.error("Auth state refresh error:", result.error);
        }

        setLoading(false);
      })();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (data: SignUpInput): Promise<AuthResult> => {
    const result = await dbAuth.signUp({
      email: data.email,
      password: data.password,
      name: data.name,
    });

    if (result.error) {
      setSession(result.session);
      setUser(null);
      return toAuthFailure(result.error);
    }

    if (result.requiresEmailVerification) {
      setSession(null);
      setUser(null);

      return {
        success: true,
        user: null,
        error: null,
        requiresEmailVerification: true,
      };
    }

    setSession(result.session);

    const nextUser = mapDbUser(result.user);

    setUser(nextUser);

    return {
      success: true,
      user: nextUser,
      error: null,
      requiresEmailVerification: false,
    };
  };

  const signIn = async (data: SignInInput): Promise<AuthResult> => {
    const result = await dbAuth.signIn(data);

    /*
     * Profile errors require special handling.
     *
     * A valid session means authentication
     * succeeded even if profile loading had a
     * problem.
     */

    if (result.error && !result.session) {
      setSession(null);
      setUser(null);
      return toAuthFailure(result.error);
    }

    if (!result.session) {
      setSession(null);
      setUser(null);

      return {
        success: false,
        user: null,
        error: "We couldn't complete the sign-in process.",
        errorCode: "UNKNOWN",
      };
    }

    setSession(result.session);

    const nextUser = mapDbUser(result.user);

    setUser(nextUser);

    if (result.error) {
      console.error("Authenticated but profile loading failed:", result.error);
      return toAuthFailure(result.error);
    }

    return {
      success: true,
      user: nextUser,
      error: null,
    };
  };

  const requestPasswordReset = async (
    email: string,
  ): Promise<PasswordResetResult> => {
    const result = await dbAuth.requestPasswordReset(email);

    if (result.error) {
      return toPasswordResetFailure(result.error);
    }

    return {
      success: true,
      error: null,
    };
  };

  const updatePassword = async (
    password: string,
  ): Promise<PasswordResetResult> => {
    const result = await dbAuth.updatePassword(password);

    if (result.error) {
      return toPasswordResetFailure(result.error);
    }

    return {
      success: true,
      error: null,
    };
  };

  const signOut = async () => {
    const result = await dbAuth.signOut();

    if (result.error) {
      console.error("Signout error:", result.error);
    }

    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        requestPasswordReset,
        updatePassword,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
