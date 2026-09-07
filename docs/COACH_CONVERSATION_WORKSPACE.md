# Coach Conversation Workspace V1

Written for the Coach redesign implementation (approved design frames,
delivered as a detailed textual specification — no Figma file was
attached to this pass). Documents the pre-existing-code audit, the data
model, the security posture, and where this implementation's visual
interpretation had to fill a gap because no image reference existed.

## Audit findings (before this pass)

`/coach` (`CoachView.tsx`) was **100% UI-only**: a `window.setTimeout` fake
delay, one hardcoded `SAMPLE_REPLY`, no persistence, explicitly commented
as a placeholder. This is what this pass replaces.

Separately, the codebase already contained a **real, working OpenAI
integration** — but for a *different, currently-parked* feature:

- `src/hooks/useCoach.ts` + `src/components/ai-coach/AICoach.tsx` +
  `src/app/api/coach/route.ts` (streaming `gpt-4o-mini` chat completion,
  real `OPENAI_API_KEY` configured) + `src/app/api/coach/messages/route.ts`
  (CRUD against `ai_coach_messages`).
- None of this is reachable from any route: `/ai-coach/page.tsx` renders
  only `ComingLater` ("AI coaching is still planned... outside the first
  MVP journey"), and `AICoach.tsx` is imported nowhere.
- `/api/coach/route.ts` had **zero authentication** — a live, unauthenticated
  POST endpoint that would burn OpenAI quota for anyone who found it, with a
  system prompt scoped far more broadly ("women's health and intimacy AI
  coach... evidence-based information... intimacy and relationship
  insights") than this product wants Coach to be.

Decision: **do not build on `useCoach.ts`/`AICoach.tsx`/`ai_coach_messages`.**
They belong to the still-parked `/ai-coach` journey and were left
untouched (out of scope to clean up a different feature). `/api/coach`
itself was repurposed — its route path is the natural fit for `/coach`,
and its total lack of auth was a real, live exposure independent of
whether any UI called it, worth fixing regardless. The new
`src/app/api/coach/conversations/**` routes are what `/coach` now calls;
the OpenAI SDK usage pattern and streaming technique from the old route
were the "sound existing code" reused (see
`src/features/coach/openaiClient.ts`), not its auth model or prompt.

## Data model

`coach_conversations` / `coach_messages` — see
`database/coach-conversations-v1-migration.sql`. Deliberately **not**
`ai_coach_messages` (flat Q&A rows, no conversation grouping, no `role`
field) — the new schema supports real threaded conversations and mirrors
the shape the task specified. `ai_coach_messages` and its route are left
alone, tied to the still-parked feature.

Both new tables carry `owner_user_id` (denormalised onto `coach_messages`
too, same pattern as `relationship_session_answers`) so RLS never needs a
join. Owner-only RLS on both, no SECURITY DEFINER function anywhere —
nothing here is ever cross-user, so the relationship-domain's RPC pattern
doesn't apply.

## Context assembly — server-only, source of truth

`src/features/coach/context.ts` builds the model's context strictly from
real rows (`cycle_data`, `periods`), given an authenticated Supabase
client and a `CoachContextSelection`. The client only ever sends which of
the four *permitted* sources it wants included for one message — never
raw history, never other conversations. `recentObservations` is force-set
to `false` server-side in the route handler regardless of what the client
sends (`[id]/messages/route.ts`), because there is no real deterministic
Pattern Engine yet; this is enforced in code, not just hidden in the UI.

Cycle context is evidence-only: "Period Day N" when a period is active,
"Cycle Day N" (days since the last logged period started) otherwise —
never a fabricated phase name (menstrual/follicular/ovulation/luteal),
matching `features/home/homeState.ts`'s existing "no real phase-detection
model" position.

## Response contract

`src/features/coach/openaiClient.ts` calls the model in JSON mode with
`COACH_SYSTEM_PROMPT` (the full behavioural contract — see
`systemPrompt.ts` and its tests) and parses the result into
`{ message, fromLogs, generalContext, questionToConsider, optionalNextStep,
partnerTranslationAvailable }`. `message` is always present; the four
analytical fields are `null` unless the model genuinely has something for
that section — `CoachMessageBubble` renders the structured card layout
only when at least one is set, otherwise a plain conversational bubble.
Malformed/non-JSON model output degrades to using the raw text as
`message` rather than failing the request.

**No streaming.** The structured multi-field response contract and
token-by-token SSE streaming are in real tension (you cannot cleanly
parse partial JSON mid-stream without meaningfully more infrastructure).
A single non-streaming call plus a clear `CoachThinkingState` was judged
sufficient for V1, per the task's own "do not introduce large
infrastructure solely for token-by-token animation" instruction.

## Visual interpretation — no Figma file was attached

The task described the approved frames in exhaustive textual detail but
no image or Figma URL was provided. The layout below is a faithful,
reasoned implementation of that description using the existing SheSync+
design system (rose/purple/sage/amber tokens, Playfair Display headings,
`Modal`/`Toggle`/`PromptCard`/`StatusPill`), preserving the *existing*
CoachView's established structure (`1fr/320px` grid, right-sidebar
placement, rose-tinted user bubbles) rather than inventing a new one:

- **Left column (dominant)**: header + privacy chip → composer (always
  visible) → message list, in that order for the empty state so the
  composer never sits below the starter cards.
- **Right column** (`lg:` only, collapses to the bottom of the stack on
  mobile): Previous Conversations.
- **Manage Context**: a `Modal`-based drawer triggered from the header,
  not a permanently-visible sidebar card — the task listed it as its own
  named frame, distinct from "active conversation," which reads as an
  overlay rather than an always-present panel.
- Starter cards: 2-column grid, `PromptCard` with an `actions` slot
  carrying the always-visible arrow-CTA text (never hover-only).

If the actual approved frames differ from this interpretation once
supplied as images, treat this document's "Visual interpretation" section
as what to reconcile against — the data layer, security model, and copy
above should not need to change.
