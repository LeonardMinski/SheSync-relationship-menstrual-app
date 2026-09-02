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
