import OpenAI from "openai";

import { buildCoachUserPrompt, COACH_SYSTEM_PROMPT } from "./systemPrompt";

export interface CoachModelReply {
  message: string;
  fromLogs: string | null;
  generalContext: string | null;
  questionToConsider: string | null;
  optionalNextStep: string | null;
  partnerTranslationAvailable: boolean;
}

export interface CoachHistoryTurn {
  role: "user" | "assistant";
  content: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function nonEmptyStringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * Parses the model's raw JSON-mode output into a safe, fully-typed reply.
 * Never throws — a malformed or non-JSON response degrades to using the
 * raw text as a plain conversational message rather than failing the
 * whole request, since a slightly-off structure is not a reason to show
 * the user an error.
 */
export function parseCoachReply(raw: string): CoachModelReply {
  const fallback = (message: string): CoachModelReply => ({
    message,
    fromLogs: null,
    generalContext: null,
    questionToConsider: null,
    optionalNextStep: null,
    partnerTranslationAvailable: false,
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return fallback(raw.trim());
  }

  if (!isRecord(parsed) || typeof parsed.message !== "string" || !parsed.message.trim()) {
    return fallback(raw.trim());
  }

  return {
    message: parsed.message.trim(),
    fromLogs: nonEmptyStringOrNull(parsed.fromLogs),
    generalContext: nonEmptyStringOrNull(parsed.generalContext),
    questionToConsider: nonEmptyStringOrNull(parsed.questionToConsider),
    optionalNextStep: nonEmptyStringOrNull(parsed.optionalNextStep),
    partnerTranslationAvailable: parsed.partnerTranslationAvailable === true,
  };
}

/**
 * Calls the model with the full safety system prompt, the assembled real
 * context, and this conversation's own prior turns only — never other
 * conversations (see docs/COACH_CONVERSATION_WORKSPACE.md).
 */
export async function generateCoachReply(params: {
  contextText: string;
  history: CoachHistoryTurn[];
  userMessage: string;
}): Promise<CoachModelReply> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Coach AI is not configured");
  }

  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    temperature: 0.6,
    max_tokens: 700,
    messages: [
      { role: "system", content: COACH_SYSTEM_PROMPT },
      ...params.history.map((turn) => ({ role: turn.role, content: turn.content })),
      { role: "user", content: buildCoachUserPrompt(params.contextText, params.userMessage) },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("Coach AI returned an empty response");
  }

  return parseCoachReply(raw);
}
