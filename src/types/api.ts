import type { SupabaseClient } from "@supabase/supabase-js";

export type AuthenticatedUser = {
  id: string;
  email: string | null;
  name: string;
  /**
   * Whether this account can use self-tracking features (Cycle, Coach,
   * Pattern Engine). `undefined` means the profile row failed to load —
   * treat that as unresolved, not "disabled". See
   * src/lib/api/authentication.ts and requireTrackingEnabled.
   */
  trackingEnabled?: boolean;
};

export type AuthenticatedRequest = {
  user: AuthenticatedUser | null;
  supabase: SupabaseClient | null;
};
