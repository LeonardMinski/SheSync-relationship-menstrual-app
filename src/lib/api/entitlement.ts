import type { SupabaseClient } from "@supabase/supabase-js";
import type { NextResponse } from "next/server";

import { createErrorResponse } from "@/lib/api/responses";
import { getEntitlement } from "@/lib/entitlement";

/**
 * Server-side backstop for every Vault route (Sparks, Decks, For
 * Tonight, Partner Vault). Mirrors requireTrackingEnabled's shape and
 * call convention — call this immediately after authenticateRequest in
 * any Vault route handler, before touching vault_sparks or its RPCs.
 *
 * Always evaluated against the CALLING user's own entitlement, even on
 * partner-facing endpoints (e.g. responding to a tease, viewing a
 * partner's shared Vault summary) — Vault access is an account-level
 * capability, not something one partner's plan grants the other. This
 * is a deliberate product decision made during implementation; revisit
 * here if that's not the intended semantics.
 */
export async function requireVaultAccess(
  supabase: SupabaseClient,
  userId: string,
): Promise<NextResponse | null> {
  const entitlement = await getEntitlement(supabase, userId);
  if (!entitlement.hasVaultAccess) {
    return createErrorResponse("Vault is a Premium feature. Upgrade to unlock it.", 403);
  }
  return null;
}
