import { supabase } from "@/lib/supabase/client";
import type { CreateSession, IntimacySession } from "@/schemas/intimacy";

export async function getTodaySession(
  userId: string,
  date: string,
): Promise<IntimacySession | null> {
  try {
    const { data, error } = await supabase
      .from("intimacy_sessions")
      .select(
        `
        *,
        selected_card:selected_card_id (
          id,
          category,
          difficulty,
          text,
          phase_tags,
          active
        )
      `,
      )
      .eq("user_id", userId)
      .eq("date", date)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching today session:", error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error("Error fetching today session (table may not exist):", error);
    return null;
  }
}

export async function upsertSession(
  userId: string,
  input: CreateSession,
): Promise<IntimacySession | null> {
  const sessionData = {
    user_id: userId,
    date: input.date,
    selected_card_id: input.selectedCardId,
    shared_with_partner: input.share || false,
    reflection: input.reflection || null,
  };

  const { data, error } = await supabase
    .from("intimacy_sessions")
    .upsert(sessionData, {
      onConflict: "user_id,date",
      ignoreDuplicates: false,
    })
    .select(
      `
      *,
      selected_card:selected_card_id (
        id,
        category,
        difficulty,
        text,
        phase_tags,
        active
      )
    `,
    )
    .single();

  if (error) {
    console.error("Error upserting session:", error);
    return null;
  }

  return data;
}

export async function shareSession(
  userId: string,
  date: string,
  shared: boolean,
): Promise<boolean> {
  const { error } = await supabase
    .from("intimacy_sessions")
    .update({ shared_with_partner: shared })
    .eq("user_id", userId)
    .eq("date", date);

  if (error) {
    console.error("Error updating session share status:", error);
    return false;
  }

  return true;
}
