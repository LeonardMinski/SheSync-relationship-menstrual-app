import { NextRequest } from "next/server";
import { authenticateRequest, requireTrackingEnabled } from "@/lib/api/authentication";
import { createErrorResponse, createSuccessResponse } from "@/lib/api/responses";
import type { CoachMessage } from "@/types/coach";

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

/** A conversation and its messages, in order. 404s for anyone but the owner — RLS also enforces this independently. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user || !supabase) {
      return createErrorResponse("Authentication required", 401);
    }
    const trackingBlocked = requireTrackingEnabled(user);
    if (trackingBlocked) return trackingBlocked;

    const { id } = await params;

    const { data: conversation, error: conversationError } = await supabase
      .from("coach_conversations")
      .select("*")
      .eq("id", id)
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (conversationError) {
      console.error("[coach/conversations/:id] failed to load conversation", conversationError);
      return createErrorResponse("Failed to load conversation", 500);
    }
    if (!conversation) {
      return createErrorResponse("Conversation not found", 404);
    }

    const { data: messages, error: messagesError } = await supabase
      .from("coach_messages")
      .select("*")
      .eq("conversation_id", id)
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("[coach/conversations/:id] failed to load messages", messagesError);
      return createErrorResponse("Failed to load conversation", 500);
    }

    return createSuccessResponse({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.created_at,
        updatedAt: conversation.updated_at,
        messages: ((messages ?? []) as MessageRow[]).map(toMessage),
      },
    });
  } catch (error) {
    console.error("[coach/conversations/:id] unexpected GET error", error);
    return createErrorResponse("Internal server error", 500);
  }
}

/** Deletes a conversation and its messages (ON DELETE CASCADE). Owner-only. */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user || !supabase) {
      return createErrorResponse("Authentication required", 401);
    }
    const trackingBlocked = requireTrackingEnabled(user);
    if (trackingBlocked) return trackingBlocked;

    const { id } = await params;

    const { data, error } = await supabase
      .from("coach_conversations")
      .delete()
      .eq("id", id)
      .eq("owner_user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("[coach/conversations/:id] failed to delete", error);
      return createErrorResponse("Failed to delete conversation", 500);
    }
    if (!data) {
      return createErrorResponse("Conversation not found", 404);
    }

    return createSuccessResponse({ deleted: true }, "Conversation deleted");
  } catch (error) {
    console.error("[coach/conversations/:id] unexpected DELETE error", error);
    return createErrorResponse("Internal server error", 500);
  }
}
