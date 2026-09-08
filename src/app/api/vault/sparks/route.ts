import { NextRequest } from "next/server";

import { authenticateRequest } from "@/lib/api/authentication";
import { createErrorResponse, createSuccessResponse } from "@/lib/api/responses";
import { CreateVaultSparkInputSchema } from "@/schemas/vault";

type SupabaseRouteError = { code?: string; message?: string };

function sparkErrorResponse(action: string, error: SupabaseRouteError) {
  console.error(`[vault/sparks] ${action}`, error);

  if (error.code === "42501") {
    return createErrorResponse(`Unable to ${action} — you don't have permission to access this data.`, 403);
  }
  return createErrorResponse(`Unable to ${action}. Please try again.`, 500);
}

/** Lists the caller's own Sparks, most recent first. Owner-only — see RLS on vault_sparks. */
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user || !supabase) {
      return createErrorResponse("Authentication required", 401);
    }
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("vault_sparks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) {
      return sparkErrorResponse("load your Vault", error);
    }

    return createSuccessResponse({ sparks: data ?? [] });
  } catch (error) {
    console.error("[vault/sparks] unexpected GET error", error);
    return createErrorResponse("Internal server error", 500);
  }
}

/** Creates a new, private Spark. Never accepts a status — every Spark starts private. */
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user || !supabase) {
      return createErrorResponse("Authentication required", 401);
    }
    const rawBody = await request.json().catch(() => ({}));
    const parsed = CreateVaultSparkInputSchema.safeParse(rawBody);
    if (!parsed.success) {
      return createErrorResponse(parsed.error.issues[0]?.message ?? "Invalid request", 400);
    }

    const { data, error } = await supabase
      .from("vault_sparks")
      .insert({
        user_id: user.id,
        heat_level: parsed.data.heatLevel,
        content: parsed.data.content,
        deck_id: parsed.data.deckId ?? null,
        deck_prompt_id: parsed.data.deckPromptId ?? null,
        deck_interest_level: parsed.data.deckInterestLevel ?? null,
      })
      .select()
      .single();

    if (error) {
      return sparkErrorResponse("save this Spark", error);
    }

    return createSuccessResponse(data, "Spark saved to your Vault");
  } catch (error) {
    console.error("[vault/sparks] unexpected POST error", error);
    return createErrorResponse("Internal server error", 500);
  }
}
