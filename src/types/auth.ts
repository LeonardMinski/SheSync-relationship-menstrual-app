export type SubscriptionTier = "free" | "premium" | "vip" | "lifetime";

export type UserRecord = {
  id: string;
  email: string;
  name: string;
  subscription_tier: SubscriptionTier;
  subscription_status?: "active" | "canceled" | "past_due" | null;
  stripe_subscription_id?: string | null;
  created_at: string;
  partner_id?: string;
  privacy_settings: {
    share_with_partner: boolean;
    share_cycle_phase: boolean;
    share_mood: boolean;
    share_fantasy_vault: boolean;
    share_intimacy_deck: boolean;
  };
};

export type CreateUserData = {
  email: string;
  password: string;
  name: string;
  privacy_settings?: {
    share_with_partner: boolean;
    share_cycle_phase: boolean;
    share_mood: boolean;
    share_fantasy_vault: boolean;
    share_intimacy_deck: boolean;
  };
};

export type LoginData = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export type SignUpInput = {
  email: string;
  password: string;
  name: string;
};

export type SignInInput = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

import type { Session } from "@supabase/supabase-js";
import type { User } from "@/types";

export type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    data: SignUpInput,
  ) => Promise<{ success: boolean; error?: string | null; user?: User | null }>;
  signIn: (
    data: SignInInput,
  ) => Promise<{ success: boolean; error?: string | null; user?: User | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};
