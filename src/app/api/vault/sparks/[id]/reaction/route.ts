import { NextRequest } from "next/server";

import { authenticateRequest } from "@/lib/api/authentication";
import { createErrorResponse, createSuccessResponse } from "@/lib/api/responses";
import { vaultRpcErrorResponse } from "@/app/api/vault/_lib/rpc-error";
import { RevealReactionInputSchema } from "@/schemas/vault";

const ROUTE_NAME = "vault/sparks/:id/reaction";

/** Either participant reacts to an already-revealed Spark. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user || !supabase) {
      return createErrorResponse("Authentication required", 401);
    }

    const { id } = await params;
    const rawBody = await request.json().catch(() => ({}));
    const parsed = RevealReactionInputSchema.safeParse(rawBody);
    if (!parsed.success) {
      return createErrorResponse(parsed.error.issues[0]?.message ?? "Invalid request", 400);
    }

    const { error } = await supabase.rpc("react_to_revealed_vault_spark", {
      p_spark_id: id,
      p_reaction: parsed.data.reaction,
    });

    if (error) {
      return vaultRpcErrorResponse(ROUTE_NAME, "save this reaction", error);
    }

    return createSuccessResponse(null, "Reaction saved");
  } catch (error) {
    console.error(`[${ROUTE_NAME}] unexpected POST error`, error);
    return createErrorResponse("Internal server error", 500);
  }
}
