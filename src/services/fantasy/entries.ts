import { supabase } from "@/lib/supabase/client";
import type {
  FantasyEntryRecord,
  FantasyEntry,
} from "@/schemas/fantasy";

// =====================================================
// FANTASY ENTRY SERVICES
// =====================================================

export async function listEntries(
  userId: string,
): Promise<FantasyEntryRecord[]> {
  try {
    const { data, error } = await supabase
      .from("fantasy_entries")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching fantasy entries:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error(
      "Error fetching fantasy entries (table may not exist):",
      error,
    );
    return [];
  }
}

export async function getEntry(
  userId: string,
  entryId: string,
): Promise<FantasyEntryRecord | null> {
  try {
    const { data, error } = await supabase
      .from("fantasy_entries")
      .select("*")
      .eq("id", entryId)
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching fantasy entry:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching fantasy entry (table may not exist):", error);
    return null;
  }
}

export async function createEntry(
  userId: string,
  input: FantasyEntry,
): Promise<FantasyEntryRecord | null> {
  const entryData = {
    user_id: userId,
    title: input.title,
    content_text: input.content_text,
    content_url: input.content_url,
    kind: input.kind,
    tags: input.tags,
    comfort: input.comfort,
    share_status: input.share_status,
    redacted: input.redacted,
  };

  const { data, error } = await supabase
    .from("fantasy_entries")
    .insert(entryData)
    .select()
    .single();

  if (error) {
    console.error("Error creating fantasy entry:", error);
    return null;
  }

  return data;
}

export async function updateEntry(
  userId: string,
  entryId: string,
  input: FantasyEntry,
): Promise<FantasyEntryRecord | null> {
  const entryData = {
    title: input.title,
    content_text: input.content_text,
    content_url: input.content_url,
    kind: input.kind,
    tags: input.tags,
    comfort: input.comfort,
    share_status: input.share_status,
    redacted: input.redacted,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("fantasy_entries")
    .update(entryData)
    .eq("id", entryId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating fantasy entry:", error);
    return null;
  }

  return data;
}

export async function deleteEntry(
  userId: string,
  entryId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("fantasy_entries")
    .delete()
    .eq("id", entryId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting fantasy entry:", error);
    return false;
  }

  return true;
}

// =====================================================
// SEED DATA
// =====================================================

const fantasySeedData = [
  {
    title: "Romantic Weekend Getaway",
    content_text:
      "A cozy cabin in the mountains with a fireplace, hot tub under the stars, and no distractions. Just us, good food, and each other.",
    kind: "text" as const,
    tags: ["romantic", "getaway", "intimate"],
    comfort: 3,
    share_status: "hidden" as const,
    redacted: false,
  },
  {
    title: "Dancing in the Rain",
    content_text:
      "Spontaneous dancing in the rain, laughing together, getting soaked but not caring because we're having so much fun.",
    kind: "text" as const,
    tags: ["spontaneous", "fun", "romantic"],
    comfort: 3,
    share_status: "hidden" as const,
    redacted: false,
  },
  {
    title: "Morning Coffee Ritual",
    content_text:
      "Starting every day with coffee together, sharing our dreams and plans, creating a peaceful morning routine that grounds us.",
    kind: "text" as const,
    tags: ["routine", "intimate", "peaceful"],
    comfort: 3,
    share_status: "hidden" as const,
    redacted: false,
  },
  {
    title: "Adventure Road Trip",
    content_text:
      "A spontaneous road trip with no destination, just exploring new places together, trying local food, and making memories.",
    kind: "text" as const,
    tags: ["adventure", "spontaneous", "exploration"],
    comfort: 3,
    share_status: "hidden" as const,
    redacted: false,
  },
  {
    title: "Cooking Together",
    content_text:
      "Learning a new recipe together, laughing at our mistakes, enjoying the process of creating something delicious as a team.",
    kind: "text" as const,
    tags: ["cooking", "teamwork", "fun"],
    comfort: 3,
    share_status: "hidden" as const,
    redacted: false,
  },
];

export async function seedFantasyEntries(
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user already has entries
    const existingEntries = await listEntries(userId);
    if (existingEntries.length > 0) {
      console.log("User already has fantasy entries, skipping seed");
      return { success: true };
    }

    // Create entries
    const promises = fantasySeedData.map((entry) => createEntry(userId, entry));
    const results = await Promise.all(promises);

    const successCount = results.filter(
      (result: FantasyEntryRecord | null) => result !== null,
    ).length;

    if (successCount === fantasySeedData.length) {
      console.log(`Successfully seeded ${successCount} fantasy entries`);
      return { success: true };
    } else {
      console.log(
        `Seeded ${successCount} out of ${fantasySeedData.length} fantasy entries`,
      );
      return { success: true }; // Partial success is still success
    }
  } catch (error) {
    console.error("Error seeding fantasy entries:", error);
    return { success: false, error: "Unknown error occurred" };
  }
}
