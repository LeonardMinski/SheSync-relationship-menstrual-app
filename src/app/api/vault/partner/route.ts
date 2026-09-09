import { NextRequest } from "next/server";

import { authenticateRequest } from "@/lib/api/authentication";
import { requireVaultAccess } from "@/lib/api/entitlement";
import { createErrorResponse, createSuccessResponse } from "@/lib/api/responses";
import { vaultRpcErrorResponse } from "@/app/api/vault/_lib/rpc-error";

const ROUTE_NAME = "vault/partner";

/**
 * The caller's active partner's shareable Vault activity — see
 * get_partner_vault_summary(). Structurally cannot return `content`: that
 * column is never referenced in the RPC. Excludes 'private' and 'archived'
 * Sparks entirely. Resolves the caller's active partner internally; never
 * accepts a partner id, so there's no way to point this at anyone else's
 * Vault.
 */
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user || !supabase) {
      return createErrorResponse("Authentication required", 401);
    }
    const entitlementBlocked = await requireVaultAccess(supabase, user.id);
    if (entitlementBlocked) return entitlementBlocked;

    const { data, error } = await supabase.rpc("get_partner_vault_summary");

    if (error) {
      return vaultRpcErrorResponse(ROUTE_NAME, "load your partner's Vault activity", error);
    }

    return createSuccessResponse({ sparks: data ?? [] });
  } catch (error) {
    console.error(`[${ROUTE_NAME}] unexpected GET error`, error);
    return createErrorResponse("Internal server error", 500);
  }
}
