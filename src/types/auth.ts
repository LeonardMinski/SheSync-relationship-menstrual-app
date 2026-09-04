export type SubscriptionTier = "free" | "premium" | "vip" | "lifetime";

export type PrivacySettingsRecord = {
  share_with_partner: boolean;
  share_cycle_phase: boolean;
  share_mood: boolean;
  share_fantasy_vault: boolean;
  share_intimacy_deck: boolean;
};

export type UserRecord = {
  id: string;
  email: string;
  name: string;
  subscription_tier: SubscriptionTier;
  subscription_status?: "active" | "canceled" | "past_due" | null;
  stripe_subscription_id?: string | null;
  created_at: string;
  partner_id?: string;
  profile_image_url?: string | null;
  privacy_settings: PrivacySettingsRecord;
  /** NULL = onboarding not completed; ISO timestamp = completed at that time. */
  onboarding_completed_at?: string | null;
};

export type CreateUserData = {
  email: string;
  password: string;
  name: string;
  privacy_settings?: PrivacySettingsRecord;
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

export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "EMAIL_NOT_CONFIRMED"
  | "ACCOUNT_ALREADY_EXISTS"
  | "RATE_LIMITED"
  | "WEAK_PASSWORD"
  | "PROFILE_ERROR"
  | "NETWORK_ERROR"
  | "UNKNOWN";

export type AuthResult =
  | {
      success: true;
      user: User | null;
      error: null;
      errorCode?: never;
      requiresEmailVerification?: boolean;
    }
  | {
      success: false;
      user?: null;
      error: string;
      errorCode: AuthErrorCode;
      requiresEmailVerification?: false;
    };

export type PasswordResetResult =
  | {
      success: true;
      error: null;
      errorCode?: never;
    }
  | {
      success: false;
      error: string;
      errorCode: AuthErrorCode;
    };

export type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** True only when we tried to load the real profile and it failed — not
   * merely "hasn't loaded yet." See onboarding.utils.ts for why this
   * distinction matters for onboarding routing. */
  profileError: boolean;

  signUp: (data: SignUpInput) => Promise<AuthResult>;
  signIn: (data: SignInInput) => Promise<AuthResult>;

  requestPasswordReset: (
    email: string,
    redirectTo?: string,
  ) => Promise<PasswordResetResult>;

  updatePassword: (password: string) => Promise<PasswordResetResult>;

  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};
