import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/api/authentication";
import { createErrorResponse, createSuccessResponse } from "@/lib/api/responses";
import type { CoachConversationSummary } from "@/types/coach";

type ConversationRow = { id: string; title: string | null; created_at: string; updated_at: string };
type MessageRow = { conversation_id: string; content: string };

function toSummary(row: ConversationRow, preview: string | null): CoachConversationSummary {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    preview,
  };
}

/** Lists the caller's own conversations, most recently active first. Never another user's — see RLS on coach_conversations. */
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user || !supabase) {
      return createErrorResponse("Authentication required", 401);
    }

    const { data: conversations, error } = await supabase
      .from("coach_conversations")
      .select("*")
      .eq("owner_user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[coach/conversations] failed to list", error);
      return createErrorResponse("Failed to load conversations", 500);
    }

    const rows = (conversations ?? []) as ConversationRow[];
    if (rows.length === 0) {
      return createSuccessResponse({ conversations: [] });
    }

    const { data: latestMessages, error: previewError } = await supabase
      .from("coach_messages")
      .select("conversation_id, content")
      .eq("owner_user_id", user.id)
      .in("conversation_id", rows.map((row) => row.id))
      .order("created_at", { ascending: false });

    if (previewError) {
      console.error("[coach/conversations] failed to load previews", previewError);
      return createErrorResponse("Failed to load conversations", 500);
    }

    const previewByConversation = new Map<string, string>();
    for (const message of (latestMessages ?? []) as MessageRow[]) {
      if (!previewByConversation.has(message.conversation_id)) {
        previewByConversation.set(message.conversation_id, message.content.slice(0, 80));
      }
    }

    return createSuccessResponse({
      conversations: rows.map((row) => toSummary(row, previewByConversation.get(row.id) ?? null)),
    });
  } catch (error) {
    console.error("[coach/conversations] unexpected GET error", error);
    return createErrorResponse("Internal server error", 500);
  }
}

/** Creates a new, empty, untitled conversation. Title is set once the first message is sent — see [id]/messages/route.ts. */
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user || !supabase) {
      return createErrorResponse("Authentication required", 401);
    }

    const { data, error } = await supabase
      .from("coach_conversations")
      .insert({ owner_user_id: user.id })
      .select()
      .single();

    if (error) {
      console.error("[coach/conversations] failed to create", error);
      return createErrorResponse("Failed to start a new conversation", 500);
    }

    const row = data as ConversationRow;
    return createSuccessResponse({ conversation: toSummary(row, null) }, "Conversation started");
  } catch (error) {
    console.error("[coach/conversations] unexpected POST error", error);
    return createErrorResponse("Internal server error", 500);
  }
}
