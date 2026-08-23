import { supabase } from "@/lib/supabase/client";
import type { SignInInput, SignUpInput, UserRecord } from "@/types";

export const auth = {
  async getCurrentUser(): Promise<{
    user: UserRecord | null;
    error: string | null;
  }> {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        return { user: null, error: sessionError.message };
      }

      if (!session?.user) {
        return { user: null, error: null };
      }

      const { data: userProfile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profileError) {
        const newUser: UserRecord = {
          id: session.user.id,
          email: session.user.email || "",
          name:
            session.user.user_metadata?.name ||
            session.user.email?.split("@")[0] ||
            "User",
          subscription_tier: "free",
          created_at: new Date().toISOString(),
          privacy_settings: {
            share_with_partner: false,
            share_cycle_phase: false,
            share_mood: false,
            share_fantasy_vault: false,
            share_intimacy_deck: false,
          },
        };

        const { error: insertError } = await supabase
          .from("users")
          .insert(newUser);

        if (insertError) {
          console.error("Error creating user profile:", insertError);
          return { user: newUser, error: null };
        }

        return { user: newUser, error: null };
      }

      return { user: userProfile, error: null };
    } catch (error) {
      console.error("Error getting current user:", error);
      return {
        user: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  async signUp(
    data: SignUpInput & { privacy_settings?: UserRecord["privacy_settings"] },
  ): Promise<{ user: UserRecord | null; error: string | null }> {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes("placeholder")) {
        return {
          user: null,
          error:
            "Supabase not configured. Please check your environment variables.",
        };
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
          },
        },
      });

      if (authError) {
        console.error("Supabase signup error:", authError);
        return { user: null, error: authError.message };
      }

      if (!authData.user) {
        return { user: null, error: "Signup failed" };
      }

      const newUser: UserRecord = {
        id: authData.user.id,
        email: data.email,
        name: data.name,
        subscription_tier: "free",
        created_at: new Date().toISOString(),
        privacy_settings: data.privacy_settings || {
          share_with_partner: false,
          share_cycle_phase: false,
          share_mood: false,
          share_fantasy_vault: false,
          share_intimacy_deck: false,
        },
      };

      const { error: profileError } = await supabase
        .from("users")
        .insert(newUser);

      if (profileError && Object.keys(profileError).length > 0) {
        console.error("Error creating user profile:", profileError);
        return { user: newUser, error: null };
      }

      return { user: newUser, error: null };
    } catch (error) {
      console.error("Error signing up:", error);
      return {
        user: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  async signIn(
    data: SignInInput,
  ): Promise<{ user: UserRecord | null; error: string | null }> {
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
        return { user: null, error: authError.message };
      }

      if (!authData.user) {
        return { user: null, error: "Signin failed" };
      }

      const { data: userProfile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (profileError) {
        console.error("Error getting user profile:", profileError);
        return { user: null, error: "User profile not found" };
      }

      return { user: userProfile, error: null };
    } catch (error) {
      console.error("Error signing in:", error);
      return {
        user: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  async signOut(): Promise<{ error: string | null }> {
    try {
      if (typeof window !== "undefined") {
        window.localStorage?.removeItem?.("supabase-remember-me");
      }

      const { error } = await supabase.auth.signOut();
      return { error: error?.message || null };
    } catch (error) {
      console.error("Error signing out:", error);
      return {
        error: error instanceof Error ? error.message : "Unknown error",
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
