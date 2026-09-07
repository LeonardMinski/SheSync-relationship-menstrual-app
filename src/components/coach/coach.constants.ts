/**
 * Static, UI-only content for the /coach screen.
 *
 * Nothing here comes from a real AI/backend service — it exists purely to give
 * the design a believable shape to render. See CoachView.tsx for the
 * TODO(V1-COACH) marker where a real Coach service call should replace the
 * simulated response.
 */

export interface CoachPromptSuggestion {
  question: string;
  description: string;
}

export const PROMPT_SUGGESTIONS: CoachPromptSuggestion[] = [
  {
    question: "What patterns have you noticed in my energy?",
    description: "Compares energy levels logged across cycle phases.",
  },
  {
    question: "How has my mood shifted this month?",
    description: "Looks at mood entries alongside your cycle phase.",
  },
  {
    question: "What symptoms tend to show up together?",
    description: "Reviews symptoms logged on the same days.",
  },
  {
    question: "Any trends in my recent wellbeing notes?",
    description: "Summarizes recent wellbeing log entries over time.",
  },
];

export const FOLLOW_UP_SUGGESTIONS: string[] = [
  "What might help on lower-energy days?",
  "How does this compare to last cycle?",
  "What else shows up in my recent logs?",
];

/**
 * "Jobs to be done" entry tiles shown on the Coach home screen. Three of the
 * four kick off a conversation with a canned starter question; the fourth
 * ("Prepare to talk to my partner") is a navigational entry point into the
 * Partner Translation surface, which has its own placeholder-backed UI.
 */
export type CoachTileTone = "sage" | "rose" | "amber" | "muted";

export type CoachTileAction =
  | { type: "prompt"; question: string }
  | { type: "link"; href: string };

export interface CoachEntryTile {
  id: string;
  eyebrow: string;
  eyebrowTone: CoachTileTone;
  title: string;
  description: string;
  highlighted?: boolean;
  action: CoachTileAction;
}

export const COACH_ENTRY_TILES: CoachEntryTile[] = [
  {
    id: "explore-pattern",
    eyebrow: "Insight window",
    eyebrowTone: "sage",
    title: "Explore a pattern",
    description: "Review patterns in your energy and mood logs.",
    action: {
      type: "prompt",
      question: "What patterns have you noticed in my energy and mood?",
    },
  },
  {
    id: "reflect-today",
    eyebrow: "Current wave",
    eyebrowTone: "rose",
    title: "Reflect on today",
    description:
      "Explore how you felt this morning based on your check-in.",
    highlighted: true,
    action: {
      type: "prompt",
      question: "How did I feel this morning based on my check-in?",
    },
  },
  {
    id: "prepare-partner",
    eyebrow: "Connection tool",
    eyebrowTone: "amber",
    title: "Prepare to talk to my partner",
    description: "Help your partner understand how you're feeling.",
    action: { type: "link", href: "/coach/translate" },
  },
  {
    id: "reflect-privately",
    eyebrow: "Sovereign space",
    eyebrowTone: "muted",
    title: "Reflect privately",
    description: "Draft questions about your feelings and desires.",
    action: {
      type: "prompt",
      question:
        "Help me draft some private questions about my feelings and desires.",
    },
  },
];

// This is the load-bearing truth claim about what Coach can and can't see.
// Keep the exact wording if you touch this file — it's referenced from
// CoachView and CoachContextPanel.
export const COACH_DISCLOSURE_TEXT =
  "Coach can use your cycle and wellbeing logs. Your Vault and private intimacy content are not included unless you explicitly choose to bring something into a conversation.";

export const COACH_CONTEXT_INCLUDED: string[] = [
  "Mood Logs",
  "Energy Metrics",
  "Stress Indicators",
  "Cycle History",
];

export const COACH_CONTEXT_NEVER_SHARED: string[] = [
  "Vault Entries",
  "Shared Reflections",
  "Partner Messages",
];

export interface CoachSampleReply {
  fromLogs: string;
  general: string;
}

// TODO(V1-COACH): wire to authenticated Coach service — this is a static,
// non-personalized sample reply used only to show the intended UI shape.
export const SAMPLE_REPLY: CoachSampleReply = {
  fromLogs:
    "Across your last several cycle-log entries, energy ratings tend to dip slightly in the days leading up to your period and recover shortly after.",
  general:
    "Many people notice shifts in energy tied to hormonal changes across the cycle. This is general context, not a diagnosis, and it doesn't replace advice from a healthcare provider.",
};
