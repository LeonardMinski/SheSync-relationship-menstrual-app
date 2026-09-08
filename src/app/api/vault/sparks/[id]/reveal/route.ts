import { NextRequest } from "next/server";

import { authenticateRequest } from "@/lib/api/authentication";
import { createErrorResponse, createSuccessResponse } from "@/lib/api/responses";
import { vaultRpcErrorResponse } from "@/app/api/vault/_lib/rpc-error";

const ROUTE_NAME = "vault/sparks/:id/reveal";

/**
 * The only endpoint that can reveal a Spark via the ceremony — requires
 * both participants ready, checked server-side by
 * reveal_vault_spark_together(). Idempotent (safe to double-click).
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user || !supabase) {
      return createErrorResponse("Authentication required", 401);
    }

    const { id } = await params;
    const { error } = await supabase.rpc("reveal_vault_spark_together", { p_spark_id: id });

    if (error) {
      return vaultRpcErrorResponse(ROUTE_NAME, "reveal this Spark", error);
    }

    return createSuccessResponse(null, "Revealed");
  } catch (error) {
    console.error(`[${ROUTE_NAME}] unexpected POST error`, error);
    return createErrorResponse("Internal server error", 500);
  }
}
