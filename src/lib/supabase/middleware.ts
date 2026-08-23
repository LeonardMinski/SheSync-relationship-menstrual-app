import { createServerSupabaseClient } from "@/lib/supabase/server";

export const createMiddlewareSupabaseClient = () =>
  createServerSupabaseClient();

export default createMiddlewareSupabaseClient;
