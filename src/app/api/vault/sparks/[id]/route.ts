import { NextRequest } from "next/server";

import { authenticateRequest } from "@/lib/api/authentication";
import { requireVaultAccess } from "@/lib/api/entitlement";
import { createErrorResponse, createSuccessResponse } from "@/lib/api/responses";
import { UpdateVaultSparkInputSchema } from "@/schemas/vault";

type SupabaseRouteError = { code?: string; message?: string };

function sparkErrorResponse(action: string, error: SupabaseRouteError) {
  console.error(`[vault/sparks/:id] ${action}`, error);
  if (error.code === "42501") {
    return createErrorResponse(`Unable to ${action} — you don't have permission to access this data.`, 403);
  }
  return createErrorResponse(`Unable to ${action}. Please try again.`, 500);
}

/** A single Spark, owner-only — see the "Owner can view own sparks" RLS policy. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user || !supabase) {
      return createErrorResponse("Authentication required", 401);
    }
    const entitlementBlocked = await requireVaultAccess(supabase, user.id);
    if (entitlementBlocked) return entitlementBlocked;
    const { id } = await params;
    const { data, error } = await supabase.from("vault_sparks").select("*").eq("id", id).single();

    if (error || !data) {
      return createErrorResponse("Spark not found", 404);
    }

    return createSuccessResponse(data);
  } catch (error) {
    console.error("[vault/sparks/:id] unexpected GET error", error);
    return createErrorResponse("Internal server error", 500);
  }
}

/**
 * Edits heatLevel/content. Only while the Spark is still private — once a
 * tease or reveal exists, its content is fixed to whatever was
 * teased/revealed. The status='private' filter makes this an atomic
 * conditional update rather than a read-then-write, so there's no race
 * against a concurrent tease/reveal.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user || !supabase) {
      return createErrorResponse("Authentication required", 401);
    }
    const entitlementBlocked = await requireVaultAccess(supabase, user.id);
    if (entitlementBlocked) return entitlementBlocked;
    const { id } = await params;
    const rawBody = await request.json().catch(() => ({}));
    const parsed = UpdateVaultSparkInputSchema.safeParse(rawBody);
    if (!parsed.success) {
      return createErrorResponse(parsed.error.issues[0]?.message ?? "Invalid request", 400);
    }
    if (Object.keys(parsed.data).length === 0) {
      return createErrorResponse("Nothing to update", 400);
    }

    const update: Record<string, string> = {};
    if (parsed.data.heatLevel) update.heat_level = parsed.data.heatLevel;
    if (parsed.data.content) update.content = parsed.data.content;

    const { data, error } = await supabase
      .from("vault_sparks")
      .update(update)
      .eq("id", id)
      .eq("user_id", user.id)
      .eq("status", "private")
      .select()
      .single();

    if (error || !data) {
      if (error?.code === "PGRST116") {
        return createErrorResponse("Only a private Spark can be edited", 409);
      }
      return sparkErrorResponse("update this Spark", error ?? {});
    }

    return createSuccessResponse(data, "Spark updated");
  } catch (error) {
    console.error("[vault/sparks/:id] unexpected PATCH error", error);
    return createErrorResponse("Internal server error", 500);
  }
}

/** Deletes a Spark. Only while still private, for the same reason PATCH is gated. */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user || !supabase) {
      return createErrorResponse("Authentication required", 401);
    }
    const entitlementBlocked = await requireVaultAccess(supabase, user.id);
    if (entitlementBlocked) return entitlementBlocked;
    const { id } = await params;
    const { data, error } = await supabase
      .from("vault_sparks")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .eq("status", "private")
      .select()
      .single();

    if (error || !data) {
      if (error?.code === "PGRST116") {
        return createErrorResponse("Only a private Spark can be deleted", 409);
      }
      return sparkErrorResponse("delete this Spark", error ?? {});
    }

    return createSuccessResponse(null, "Spark deleted");
  } catch (error) {
    console.error("[vault/sparks/:id] unexpected DELETE error", error);
    return createErrorResponse("Internal server error", 500);
  }
}
