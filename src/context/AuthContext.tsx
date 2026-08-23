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
import type { AuthContextType, SignInInput, SignUpInput, User } from "@/types";

const mapDbUser = (
  rawUser: Record<string, unknown> | null | undefined,
): User | null => {
  if (!rawUser) return null;

  const privacySettings =
    (rawUser.privacy_settings as Record<string, unknown> | undefined) ?? {};

  return {
    id: String(rawUser.id ?? ""),
    email: String(rawUser.email ?? ""),
    name: String(rawUser.name ?? rawUser.email ?? "User"),
    subscriptionTier:
      (rawUser.subscription_tier as User["subscriptionTier"]) ?? "free",
    createdAt: rawUser.created_at
      ? new Date(String(rawUser.created_at))
      : new Date(),
    partnerId: rawUser.partner_id ? String(rawUser.partner_id) : undefined,
    privacySettings: {
      shareWithPartner: Boolean(privacySettings.share_with_partner),
      shareCyclePhase: Boolean(privacySettings.share_cycle_phase),
      shareMood: Boolean(privacySettings.share_mood),
      shareFantasyVault: Boolean(privacySettings.share_fantasy_vault),
      shareIntimacyDeck: Boolean(privacySettings.share_intimacy_deck),
    },
    profileImageUrl: rawUser.profileImageUrl
      ? String(rawUser.profileImageUrl)
      : undefined,
    app_metadata:
      (rawUser.app_metadata as Record<string, unknown> | undefined) ??
      undefined,
    user_metadata:
      (rawUser.user_metadata as Record<string, unknown> | undefined) ??
      undefined,
    aud: rawUser.aud ? String(rawUser.aud) : undefined,
    created_at: rawUser.created_at ? String(rawUser.created_at) : undefined,
  };
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const sessionResult = await supabase.auth.getSession?.();
      const data = sessionResult?.data;

      if (data?.session) {
        setSession(data.session);
      } else {
        setSession(null);
      }

      const result = await dbAuth.getCurrentUser();
      setUser(mapDbUser(result.user as Record<string, unknown> | null));
    } catch (error) {
      console.error("Auth refresh error:", error);
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await refreshUser();
    };

    void initialize();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        setSession(nextSession);

        if (!nextSession) {
          setUser(null);
          return;
        }

        const result = await dbAuth.getCurrentUser();
        setUser(mapDbUser(result.user as Record<string, unknown> | null));
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (data: SignUpInput) => {
    try {
      const result = await dbAuth.signUp({
        email: data.email,
        password: data.password,
        name: data.name,
      });

      if (result.error || !result.user) {
        return { success: false, error: result.error || "Signup failed" };
      }

      const nextUser = mapDbUser(
        result.user as unknown as Record<string, unknown> | null,
      );
      setUser(nextUser);

      const { data: sessionData } = await supabase.auth.getSession();
      setSession(sessionData.session);

      return { success: true, user: nextUser, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Signup failed";
      return { success: false, error: message };
    }
  };

  const signIn = async (data: SignInInput) => {
    try {
      const result = await dbAuth.signIn({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      });

      if (result.error || !result.user) {
        return { success: false, error: result.error || "Login failed" };
      }

      const nextUser = mapDbUser(
        result.user as unknown as Record<string, unknown> | null,
      );
      setUser(nextUser);

      const { data: sessionData } = await supabase.auth.getSession();
      setSession(sessionData.session);

      return { success: true, user: nextUser, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      return { success: false, error: message };
    }
  };

  const signOut = async () => {
    try {
      const result = await dbAuth.signOut();
      if (result?.error) {
        console.error("Signout error:", result.error);
      }
    } catch (error) {
      console.error("Signout error:", error);
    } finally {
      setUser(null);
      setSession(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
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
