import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/api/authentication";
import { createErrorResponse, createSuccessResponse } from "@/lib/api/responses";
import { buildCoachContext } from "@/features/coach/context";
import { generateCoachReply, type CoachHistoryTurn } from "@/features/coach/openaiClient";
import { SendCoachMessageInputSchema } from "@/schemas/coach";
import { DEFAULT_COACH_CONTEXT_SELECTION } from "@/types/coach";
import type { CoachMessage } from "@/types/coach";

const TITLE_MAX_LENGTH = 60;
const HISTORY_TURN_LIMIT = 20;

type MessageRow = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  from_logs: string | null;
  general_context: string | null;
  question_to_consider: string | null;
  optional_next_step: string | null;
  partner_translation_available: boolean;
  created_at: string;
};

function toMessage(row: MessageRow): CoachMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role,
    content: row.content,
    fromLogs: row.from_logs,
    generalContext: row.general_context,
    questionToConsider: row.question_to_consider,
    optionalNextStep: row.optional_next_step,
    partnerTranslationAvailable: row.partner_translation_available,
    createdAt: row.created_at,
  };
}

function deriveTitle(firstUserMessage: string): string {
  const trimmed = firstUserMessage.trim();
  if (trimmed.length <= TITLE_MAX_LENGTH) return trimmed;
  return `${trimmed.slice(0, TITLE_MAX_LENGTH).trimEnd()}…`;
}

/**
 * Sends one user message, gets Coach's reply, and persists both. The
 * client sends only its own message text (plus which permitted context
 * sources to include) — never raw history or arbitrary user data; this
 * route alone decides what real context the model actually sees, and only
 * this conversation's own prior turns are included, never other
 * conversations.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user || !supabase) {
      return createErrorResponse("Authentication required", 401);
    }

    const { id: conversationId } = await params;

    const rawBody = await request.json().catch(() => ({}));
    const parsed = SendCoachMessageInputSchema.safeParse(rawBody);
    if (!parsed.success) {
      return createErrorResponse(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const { data: conversation, error: conversationError } = await supabase
      .from("coach_conversations")
      .select("id, title")
      .eq("id", conversationId)
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (conversationError) {
      console.error("[coach/messages] failed to load conversation", conversationError);
      return createErrorResponse("Failed to send message", 500);
    }
    if (!conversation) {
      return createErrorResponse("Conversation not found", 404);
    }

    const { data: priorRows, error: historyError } = await supabase
      .from("coach_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(HISTORY_TURN_LIMIT);

    if (historyError) {
      console.error("[coach/messages] failed to load history", historyError);
      return createErrorResponse("Failed to send message", 500);
    }

    const priorMessages = ((priorRows ?? []) as MessageRow[]).map(toMessage);

    const { data: insertedUserMessage, error: userInsertError } = await supabase
      .from("coach_messages")
      .insert({
        conversation_id: conversationId,
        owner_user_id: user.id,
        role: "user",
        content: parsed.data.content,
      })
      .select()
      .single();

    if (userInsertError) {
      console.error("[coach/messages] failed to save user message", userInsertError);
      return createErrorResponse("Failed to send message", 500);
    }

    const contextSelection = { ...DEFAULT_COACH_CONTEXT_SELECTION, ...parsed.data.context };
    const { contextText } = await buildCoachContext(supabase, user.id, contextSelection);

    const history: CoachHistoryTurn[] = priorMessages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    let reply;
    try {
      reply = await generateCoachReply({ contextText, history, userMessage: parsed.data.content });
    } catch (error) {
      console.error("[coach/messages] AI generation failed", error);
      return createErrorResponse("Coach couldn't generate a response. This may be temporary — you can try again.", 502);
    }

    const { data: insertedAssistantMessage, error: assistantInsertError } = await supabase
      .from("coach_messages")
      .insert({
        conversation_id: conversationId,
        owner_user_id: user.id,
        role: "assistant",
        content: reply.message,
        from_logs: reply.fromLogs,
        general_context: reply.generalContext,
        question_to_consider: reply.questionToConsider,
        optional_next_step: reply.optionalNextStep,
        partner_translation_available: reply.partnerTranslationAvailable,
      })
      .select()
      .single();

    if (assistantInsertError) {
      console.error("[coach/messages] failed to save assistant message", assistantInsertError);
      return createErrorResponse("Coach responded, but the reply couldn't be saved. Please try again.", 500);
    }

    const titleUpdate: { updated_at: string; title?: string } = { updated_at: new Date().toISOString() };
    if (!conversation.title && priorMessages.length === 0) {
      titleUpdate.title = deriveTitle(parsed.data.content);
    }
    const { error: touchError } = await supabase
      .from("coach_conversations")
      .update(titleUpdate)
      .eq("id", conversationId)
      .eq("owner_user_id", user.id);
    if (touchError) {
      console.error("[coach/messages] failed to update conversation metadata", touchError);
    }

    return createSuccessResponse({
      userMessage: toMessage(insertedUserMessage as MessageRow),
      assistantMessage: toMessage(insertedAssistantMessage as MessageRow),
      title: titleUpdate.title ?? conversation.title ?? null,
    });
  } catch (error) {
    console.error("[coach/messages] unexpected POST error", error);
    return createErrorResponse("Internal server error", 500);
  }
}
