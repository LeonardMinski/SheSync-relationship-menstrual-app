import type { RevealCategory, SessionPrompt } from "@/types/relationship";

/**
 * Curated V1 prompt sets. Fixed, not user- or AI-authored. Snapshotted into
 * relationship_sessions.prompts at session-start time (see
 * services/relationship/sessions.ts) so a later copy change never alters
 * the prompts an already-answered session was actually asked.
 */

export const WEEKLY_US_PROMPTS: SessionPrompt[] = [
  { key: "felt_closest", text: "I felt closest to you this week when..." },
  { key: "appreciated", text: "Something I appreciated..." },
  { key: "more_next_week", text: "Something I'd like more of next week..." },
];

export const REPAIR_PROMPTS: SessionPrompt[] = [
  { key: "my_perspective", text: "What happened from my perspective?" },
  { key: "feeling_and_need", text: "What was I feeling, and what did I need?" },
  { key: "what_i_own", text: "What can I own?" },
  { key: "what_would_help", text: "What would help us reconnect?" },
];

export const MUTUAL_REVEAL_CATEGORY_LABELS: Record<RevealCategory, string> = {
  affection: "Affection",
  future: "Future",
  communication: "Communication",
  quality_time: "Quality Time",
  intimacy: "Intimacy",
  support: "Support",
};

const MUTUAL_REVEAL_PROMPT_TEXT: Record<RevealCategory, string> = {
  affection: "How do you most feel appreciated when we're tired?",
  future: "Describe a quiet dream you have for us next winter.",
  communication: "Is there a topic we danced around this past week?",
  quality_time: "What's one thing you'd love for us to do together more often?",
  intimacy: "What brings you back to your body most gently?",
  support: "How can I best hold space for you when you are silent?",
};

export function getMutualRevealPrompt(category: RevealCategory): SessionPrompt {
  return { key: category, text: MUTUAL_REVEAL_PROMPT_TEXT[category] };
}

export const MUTUAL_REVEAL_CATEGORIES = Object.keys(MUTUAL_REVEAL_CATEGORY_LABELS) as RevealCategory[];
