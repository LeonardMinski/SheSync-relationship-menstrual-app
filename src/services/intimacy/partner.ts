import { supabase } from "@/lib/supabase/client";

export async function getPartnerId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("partner_links")
    .select("partner_user_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (error || !data) {
    return null;
  }

  return data.partner_user_id;
}
