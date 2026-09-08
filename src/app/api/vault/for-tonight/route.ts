import { NextRequest } from "next/server";

import { authenticateRequest } from "@/lib/api/authentication";
import { createErrorResponse, createSuccessResponse } from "@/lib/api/responses";
import { vaultRpcErrorResponse } from "@/app/api/vault/_lib/rpc-error";

const ROUTE_NAME = "vault/for-tonight";

/**
 * Deck prompts where the caller and their active partner independently
 * rated the same prompt positively — see get_deck_prompt_matches(), which
 * structurally never returns the partner's content, interest level, or
 * spark id, only that a match exists plus the caller's OWN spark id.
 */
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user || !supabase) {
      return createErrorResponse("Authentication required", 401);
    }

    const { data, error } = await supabase.rpc("get_deck_prompt_matches");

    if (error) {
      return vaultRpcErrorResponse(ROUTE_NAME, "load tonight's spotlight", error);
    }

    return createSuccessResponse({ matches: data ?? [] });
  } catch (error) {
    console.error(`[${ROUTE_NAME}] unexpected GET error`, error);
    return createErrorResponse("Internal server error", 500);
  }
}
