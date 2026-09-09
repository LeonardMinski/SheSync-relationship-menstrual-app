import { NextRequest } from "next/server";

import { authenticateRequest } from "@/lib/api/authentication";
import { requireVaultAccess } from "@/lib/api/entitlement";
import { createErrorResponse, createSuccessResponse } from "@/lib/api/responses";
import { vaultRpcErrorResponse } from "@/app/api/vault/_lib/rpc-error";
import { CreateVaultTeaseInputSchema } from "@/schemas/vault";

const ROUTE_NAME = "vault/sparks/:id/tease";

/** Owner authors a tease. private -> teased. See create_vault_tease(). */
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
    const parsed = CreateVaultTeaseInputSchema.safeParse(rawBody);
    if (!parsed.success) {
      return createErrorResponse(parsed.error.issues[0]?.message ?? "Invalid request", 400);
    }

    const { error } = await supabase.rpc("create_vault_tease", {
      p_spark_id: id,
      p_tease_text: parsed.data.teaseText,
    });

    if (error) {
      return vaultRpcErrorResponse(ROUTE_NAME, "create this tease", error);
    }

    return createSuccessResponse(null, "Tease created");
  } catch (error) {
    console.error(`[${ROUTE_NAME}] unexpected POST error`, error);
    return createErrorResponse("Internal server error", 500);
  }
}
