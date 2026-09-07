export type CoachMessageRole = "user" | "assistant";

export interface CoachConversationSummary {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  /** First ~80 chars of the most recent message, for the Previous Conversations list. */
  preview: string | null;
}

export interface CoachMessage {
  id: string;
  conversationId: string;
  role: CoachMessageRole;
  content: string;
  /** Only ever populated on assistant messages, and only when genuinely relevant — see systemPrompt.ts. */
  fromLogs: string | null;
  generalContext: string | null;
  questionToConsider: string | null;
  optionalNextStep: string | null;
  partnerTranslationAvailable: boolean;
  createdAt: string;
}

export interface CoachConversationDetail {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messages: CoachMessage[];
}

/** Which permitted context sources the caller wants included for one request — the server decides what's actually allowed and available. */
export interface CoachContextSelection {
  dailyCheckIns: boolean;
  cycleContext: boolean;
  periodHistory: boolean;
  recentObservations: boolean;
}

export const DEFAULT_COACH_CONTEXT_SELECTION: CoachContextSelection = {
  dailyCheckIns: true,
  cycleContext: true,
  periodHistory: true,
  // Pattern Engine V1 is live — see features/patterns/engine.ts and
  // features/coach/context.ts. Real, deterministic observations only;
  // an empty/insufficient result simply contributes nothing, never a
  // fabricated one.
  recentObservations: true,
};
