import type { SupabaseClient } from "@supabase/supabase-js";

export type AuthenticatedUser = {
  id: string;
  email: string | null;
  name: string;
};

export type AuthenticatedRequest = {
  user: AuthenticatedUser | null;
  supabase: SupabaseClient | null;
};
