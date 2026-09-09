import { NextRequest } from "next/server";

import { authenticateRequest } from "@/lib/api/authentication";
import { requireVaultAccess } from "@/lib/api/entitlement";
import { createErrorResponse, createSuccessResponse } from "@/lib/api/responses";
import { vaultRpcErrorResponse } from "@/app/api/vault/_lib/rpc-error";

const ROUTE_NAME = "vault/sparks/:id/share-directly";

/**
 * Owner skips the tease/ceremony entirely and reveals immediately. See
 * share_vault_spark_directly() — still requires an active partner.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user || !supabase) {
      return createErrorResponse("Authentication required", 401);
    }
    const entitlementBlocked = await requireVaultAccess(supabase, user.id);
    if (entitlementBlocked) return entitlementBlocked;
    const { id } = await params;
    const { error } = await supabase.rpc("share_vault_spark_directly", { p_spark_id: id });

    if (error) {
      return vaultRpcErrorResponse(ROUTE_NAME, "share this Spark", error);
    }

    return createSuccessResponse(null, "Spark shared");
  } catch (error) {
    console.error(`[${ROUTE_NAME}] unexpected POST error`, error);
    return createErrorResponse("Internal server error", 500);
  }
}
