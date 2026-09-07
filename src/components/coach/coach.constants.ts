/**
 * Coach copy — see src/features/coach/systemPrompt.ts for the model-facing
 * safety rules this must stay consistent with. Every string here has been
 * checked against the forbidden biological/hormonal/encryption framing
 * list from the Coach Conversation Workspace V1 correction — see the PR
 * description, not this comment, for the full list that was removed.
 */

export const COACH_AI_ACTIVE_PILL_TEXT = "AI Coach Active";

export const COACH_HEADER_SUBTITLE =
  "A private space to understand what you're noticing, talk something through, or prepare something to share.";

export const COACH_EMPTY_STATE_PROMPT = "What would you like to talk through?";

export const COACH_EMPTY_STATE_SUBDESCRIPTION =
  "I'm your private guide — here to help you understand what you're noticing and find ways to express it, using only the context you allow.";

export const COACH_STARTERS_EYEBROW = "Conversation starters";

export const COACH_COMPOSER_PLACEHOLDER =
  "Ask Coach anything about how you're feeling, something you've noticed, or something you'd like help expressing...";

export const COACH_COMPOSER_FOLLOW_UP_PLACEHOLDER = "Ask a follow up question...";

export const COACH_COMPOSER_THINKING_PLACEHOLDER = "Coach is thinking...";

export const COACH_PRIVACY_CHIP_TEXT = "Private to you · Not shared with your partner";

export const COACH_PRIVACY_EXPLANATION =
  "Coach only uses the sources you enable below. Your Coach conversation isn't shared with your partner unless you choose to turn something into partner context.";

export const COACH_THINKING_TEXT = "Coach is thinking through your question and the context you've allowed...";

export const COACH_ERROR_TITLE = "Coach couldn't generate a response.";
export const COACH_ERROR_BODY = "This may be temporary. You can try again.";
export const COACH_DRAFT_SAVED_TEXT = "Your current draft was saved";

export const COACH_CONTEXT_STRIP_MANAGE_LABEL = "Manage context";
export const COACH_CONTEXT_STRIP_EMPTY_TEXT = "No context sources enabled";
export const COACH_MANAGE_CONTEXT_SAVE_LABEL = "Save Changes";

export type CoachTileTone = "sage" | "rose" | "amber" | "muted";

export interface CoachStarterCard {
  id: string;
  eyebrow: string;
  eyebrowTone: CoachTileTone;
  title: string;
  description: string;
  ctaLabel: string;
  highlighted?: boolean;
}

export const COACH_STARTER_CARDS: CoachStarterCard[] = [
  {
    id: "understand-pattern",
    eyebrow: "Understand a pattern",
    eyebrowTone: "sage",
    title: "Understand a pattern",
    description: "Explore something you've noticed in your logs.",
    ctaLabel: "Explore pattern →",
  },
  {
    id: "talk-through",
    eyebrow: "Talk something through",
    eyebrowTone: "rose",
    title: "Talk something through",
    description: "Use Coach as a private space to unpack what's on your mind.",
    ctaLabel: "Start conversation →",
    highlighted: true,
  },
  {
    id: "prepare-to-share",
    eyebrow: "Prepare to share",
    eyebrowTone: "amber",
    title: "Prepare to share",
    description: "Turn what you're feeling into clear, intentional partner context.",
    ctaLabel: "Create partner context →",
  },
  {
    id: "reflect",
    eyebrow: "Reflect",
    eyebrowTone: "muted",
    title: "Reflect",
    description: "Take a private moment to think something through.",
    ctaLabel: "Start reflection →",
  },
];

export const COACH_STARTER_PROMPTS: Record<string, string> = {
  "understand-pattern": "I'd like to understand a pattern in what I've been logging recently.",
  "talk-through": "I want to talk something through.",
  "prepare-to-share": "I want help turning something I'm feeling into partner context.",
  reflect: "I'd like to take a private moment to reflect.",
};

export interface CoachContextSourceCopy {
  key: "dailyCheckIns" | "cycleContext" | "periodHistory" | "recentObservations";
  label: string;
  description: string;
}

export const COACH_CONTEXT_SOURCES: CoachContextSourceCopy[] = [
  {
    key: "dailyCheckIns",
    label: "Daily check-ins",
    description: "Mood, energy, stress and other daily entries",
  },
  {
    key: "cycleContext",
    label: "Cycle context",
    description: "Known cycle state and current period context",
  },
  {
    key: "recentObservations",
    label: "Recent observations",
    description: "Patterns calculated from your logged history",
  },
  {
    key: "periodHistory",
    label: "Period history",
    description: "Past period dates and recorded period information",
  },
];

export const COACH_RECENT_OBSERVATIONS_UNAVAILABLE_TEXT =
  "Not available yet — this will unlock once SheSync+ can calculate real patterns from your history.";

export const COACH_CONTEXT_NOT_ACCESSIBLE: string[] = [
  "Vault entries",
  "Partner messages and replies",
  "Private relationship reflections",
  "Mutual Reveal private answers",
  "Repair private answers",
  "Weekly Us private answers",
];

export const COACH_PARTNER_TRANSLATION_CTA = "Turn this into partner context →";
