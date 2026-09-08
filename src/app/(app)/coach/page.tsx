import CoachView from "@/components/coach/CoachView";

// Real, authenticated Coach workspace backed by OpenAI + persisted
// conversations — see docs/COACH_CONVERSATION_WORKSPACE.md for the data
// model and security posture. (This comment previously said "UI-only
// placeholder, no AI backend" — that was true before the Coach
// Conversation Workspace V1 pass and is stale as of that work landing.)
export default function CoachPage() {
  return <CoachView />;
}
