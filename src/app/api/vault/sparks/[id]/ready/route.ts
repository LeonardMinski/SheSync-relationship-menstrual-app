import { NextRequest } from "next/server";

import { authenticateRequest } from "@/lib/api/authentication";
import { createErrorResponse, createSuccessResponse } from "@/lib/api/responses";
import { vaultRpcErrorResponse } from "@/app/api/vault/_lib/rpc-error";

const ROUTE_NAME = "vault/sparks/:id/ready";

/**
 * Marks the caller ready for the reveal ceremony. Never reveals anything —
 * mark_vault_spark_ready() only ever writes the caller's own ready
 * timestamp, even if this call is what makes both participants ready. See
 * reveal/route.ts for the explicit, separate reveal action.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user || !supabase) {
      return createErrorResponse("Authentication required", 401);
    }

    const { id } = await params;
    const { error } = await supabase.rpc("mark_vault_spark_ready", { p_spark_id: id });

    if (error) {
      return vaultRpcErrorResponse(ROUTE_NAME, "mark this Spark ready", error);
    }

    return createSuccessResponse(null, "Marked ready");
  } catch (error) {
    console.error(`[${ROUTE_NAME}] unexpected POST error`, error);
    return createErrorResponse("Internal server error", 500);
  }
}
