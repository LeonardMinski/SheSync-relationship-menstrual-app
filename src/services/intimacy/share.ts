import { supabase } from "@/lib/supabase/client";
import type { IntimacySession as IntimacySchemaSession } from "@/schemas/intimacy";

export type IntimacySession = IntimacySchemaSession;

export async function getPartnerSharedSessions(
  partnerId: string,
): Promise<IntimacySession[]> {
  try {
    const { data, error } = await supabase
      .from("intimacy_sessions")
      .select("*, selected_card:intimacy_cards(*)")
      .eq("user_id", partnerId)
      .eq("shared_with_partner", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching shared intimacy sessions:", error);
      return [];
    }

    return (data as IntimacySession[]) || [];
  } catch (error) {
    console.error("Error fetching shared intimacy sessions:", error);
    return [];
  }
}
