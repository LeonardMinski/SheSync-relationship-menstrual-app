import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export type Database = Record<string, unknown>;
export type SupabaseClient = ReturnType<typeof createClient>;

export const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: typeof window !== "undefined",
      autoRefreshToken: typeof window !== "undefined",
      storage:
        typeof window !== "undefined"
          ? {
              getItem: (key: string) => {
                const localValue = window.localStorage.getItem(key);
                if (localValue) return localValue;
                return window.sessionStorage.getItem(key);
              },
              setItem: (key: string, value: string) => {
                const rememberMe =
                  window.localStorage.getItem("supabase-remember-me") ===
                  "true";
                if (rememberMe) {
                  window.localStorage.setItem(key, value);
                } else {
                  window.sessionStorage.setItem(key, value);
                }
              },
              removeItem: (key: string) => {
                window.localStorage.removeItem(key);
                window.sessionStorage.removeItem(key);
              },
            }
          : undefined,
    },
  },
);

export default supabase;
