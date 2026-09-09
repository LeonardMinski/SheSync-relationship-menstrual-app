import { NextRequest } from "next/server";

import { authenticateRequest } from "@/lib/api/authentication";
import { requireVaultAccess } from "@/lib/api/entitlement";
import { createErrorResponse, createSuccessResponse } from "@/lib/api/responses";
import { vaultRpcErrorResponse } from "@/app/api/vault/_lib/rpc-error";
import { TeaseResponseInputSchema } from "@/schemas/vault";

const ROUTE_NAME = "vault/sparks/:id/tease-response";

/**
 * The active partner responds to a received tease. Only 'curious' promotes
 * status to 'waiting' — see respond_to_vault_tease().
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
    const rawBody = await request.json().catch(() => ({}));
    const parsed = TeaseResponseInputSchema.safeParse(rawBody);
    if (!parsed.success) {
      return createErrorResponse(parsed.error.issues[0]?.message ?? "Invalid request", 400);
    }

    const { error } = await supabase.rpc("respond_to_vault_tease", {
      p_spark_id: id,
      p_response: parsed.data.response,
    });

    if (error) {
      return vaultRpcErrorResponse(ROUTE_NAME, "respond to this tease", error);
    }

    return createSuccessResponse(null, "Response recorded");
  } catch (error) {
    console.error(`[${ROUTE_NAME}] unexpected POST error`, error);
    return createErrorResponse("Internal server error", 500);
  }
}
