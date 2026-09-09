import { NextRequest } from "next/server";

import { authenticateRequest } from "@/lib/api/authentication";
import { requireVaultAccess } from "@/lib/api/entitlement";
import { createErrorResponse, createSuccessResponse } from "@/lib/api/responses";
import { vaultRpcErrorResponse } from "@/app/api/vault/_lib/rpc-error";

const ROUTE_NAME = "vault/sparks/:id/revealed";

/**
 * The only way for a partner to read a revealed Spark's full content — see
 * get_revealed_vault_spark(). Requires revealed_at IS NOT NULL and a
 * currently active relationship; the owner may also call this, giving both
 * sides one uniform read path.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user || !supabase) {
      return createErrorResponse("Authentication required", 401);
    }
    const entitlementBlocked = await requireVaultAccess(supabase, user.id);
    if (entitlementBlocked) return entitlementBlocked;

    const { id } = await params;
    const { data, error } = await supabase.rpc("get_revealed_vault_spark", { p_spark_id: id });

    if (error) {
      return vaultRpcErrorResponse(ROUTE_NAME, "load this Spark", error);
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      return createErrorResponse("Spark not found", 404);
    }

    return createSuccessResponse(row);
  } catch (error) {
    console.error(`[${ROUTE_NAME}] unexpected GET error`, error);
    return createErrorResponse("Internal server error", 500);
  }
}
