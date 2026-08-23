import { supabase } from "@/lib/supabase/client";
import type { BoundaryItem, BoundaryItemRecord } from "@/schemas/intimacy";

export async function listBoundaries(
  userId: string,
): Promise<BoundaryItemRecord[]> {
  try {
    const { data, error } = await supabase
      .from("boundary_items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching boundaries:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching boundaries (table may not exist):", error);
    return [];
  }
}

export async function upsertBoundary(
  userId: string,
  input: BoundaryItem & { id?: string },
): Promise<BoundaryItemRecord | null> {
  const boundaryData = {
    user_id: userId,
    label: input.label,
    status: input.status,
    ...(input.id && { id: input.id }),
  };

  const { data, error } = await supabase
    .from("boundary_items")
    .upsert(boundaryData, {
      onConflict: "id",
      ignoreDuplicates: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Error upserting boundary:", error);
    return null;
  }

  return data;
}

export async function deleteBoundary(
  userId: string,
  boundaryId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("boundary_items")
    .delete()
    .eq("id", boundaryId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting boundary:", error);
    return false;
  }

  return true;
}
