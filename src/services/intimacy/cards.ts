import { supabase } from "@/lib/supabase/client";
import type { GetTodayCardParams, IntimacyCard } from "@/schemas/intimacy";

export async function listCards(
  filters: {
    category?: string;
    difficulty?: number;
    phase?: string;
    active?: boolean;
  } = {},
): Promise<IntimacyCard[]> {
  try {
    let query = supabase.from("intimacy_cards").select("*");

    if (filters.category) {
      query = query.eq("category", filters.category);
    }

    if (filters.difficulty) {
      query = query.eq("difficulty", filters.difficulty);
    }

    if (filters.phase) {
      query = query.contains("phase_tags", [filters.phase]);
    }

    if (filters.active !== undefined) {
      query = query.eq("active", filters.active);
    }

    const { data, error } = await query.order("difficulty", {
      ascending: true,
    });

    if (error) {
      console.error("Error fetching cards:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching cards (table may not exist):", error);
    return [];
  }
}

export async function getTodayCard(
  userId: string,
  params: GetTodayCardParams = {},
): Promise<IntimacyCard | null> {
  void userId;

  const cards = await listCards({
    category: params.category,
    difficulty: params.difficulty,
    active: true,
  });

  if (cards.length === 0) {
    return getFallbackCard(params.category, params.difficulty);
  }

  if (params.phase) {
    const phaseMatchedCards = cards.filter(
      (card) =>
        card.phase_tags.includes(params.phase!) || card.phase_tags.length === 0,
    );

    if (phaseMatchedCards.length > 0) {
      const randomIndex = Math.floor(Math.random() * phaseMatchedCards.length);
      return phaseMatchedCards[randomIndex];
    }
  }

  const randomIndex = Math.floor(Math.random() * cards.length);
  return cards[randomIndex];
}

function getFallbackCard(
  category?: string,
  difficulty?: number,
): IntimacyCard {
  const fallbackCards: IntimacyCard[] = [
    {
      id: "fallback-1",
      category: "talk",
      difficulty: 1,
      text: "Share one highlight and one worry from your day.",
      phase_tags: ["any"],
      active: true,
    },
    {
      id: "fallback-2",
      category: "affection",
      difficulty: 1,
      text: "Give each other a 3-minute shoulder massage.",
      phase_tags: ["any"],
      active: true,
    },
    {
      id: "fallback-3",
      category: "quality_time",
      difficulty: 1,
      text: "Cook a simple meal together without distractions.",
      phase_tags: ["any"],
      active: true,
    },
    {
      id: "fallback-4",
      category: "desire_exploration",
      difficulty: 1,
      text: "Tell each other what makes you feel most attractive.",
      phase_tags: ["any"],
      active: true,
    },
    {
      id: "fallback-5",
      category: "acts",
      difficulty: 1,
      text: "Make their favourite drink and bring it to them.",
      phase_tags: ["any"],
      active: true,
    },
  ];

  let filteredCards = fallbackCards;
  if (category) {
    filteredCards = fallbackCards.filter((card) => card.category === category);
  }

  if (difficulty) {
    filteredCards = filteredCards.filter(
      (card) => card.difficulty === difficulty,
    );
  }

  const randomIndex = Math.floor(Math.random() * filteredCards.length);
  return filteredCards[randomIndex] || fallbackCards[0];
}
