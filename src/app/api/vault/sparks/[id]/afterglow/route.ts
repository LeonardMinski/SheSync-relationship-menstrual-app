import { NextRequest } from "next/server";

import { authenticateRequest } from "@/lib/api/authentication";
import { requireVaultAccess } from "@/lib/api/entitlement";
import { createErrorResponse, createSuccessResponse } from "@/lib/api/responses";
import { vaultRpcErrorResponse } from "@/app/api/vault/_lib/rpc-error";
import { AfterglowReflectionInputSchema } from "@/schemas/vault";

const ROUTE_NAME = "vault/sparks/:id/afterglow";

/**
 * Both participants' Afterglow reflections for one Spark — see
 * get_vault_afterglow_reflections(). A reflection is entirely private
 * until read here by the OTHER participant; each caller always sees their
 * own regardless. Whether Afterglow was "mutual" is derived by the caller
 * from this list, never stored as its own row.
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
    const { data, error } = await supabase.rpc("get_vault_afterglow_reflections", { p_spark_id: id });

    if (error) {
      return vaultRpcErrorResponse(ROUTE_NAME, "load Afterglow reflections", error);
    }

    return createSuccessResponse({ reflections: data ?? [] });
  } catch (error) {
    console.error(`[${ROUTE_NAME}] unexpected GET error`, error);
    return createErrorResponse("Internal server error", 500);
  }
}

/**
 * Records (or updates) the caller's own Afterglow reflection — entirely
 * private, never shared automatically. The validate_vault_afterglow_reflection
 * trigger enforces the Spark is revealed and the caller is a participant.
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
    const parsed = AfterglowReflectionInputSchema.safeParse(rawBody);
    if (!parsed.success) {
      return createErrorResponse(parsed.error.issues[0]?.message ?? "Invalid request", 400);
    }

    const { data, error } = await supabase
      .from("vault_afterglow_reflections")
      .upsert(
        {
          spark_id: id,
          author_id: user.id,
          reaction: parsed.data.reaction,
          note: parsed.data.note ?? null,
        },
        { onConflict: "spark_id,author_id" },
      )
      .select()
      .single();

    if (error || !data) {
      console.error(`[${ROUTE_NAME}] POST failed`, error);
      const message = error?.message ?? "";
      if (message.includes("does not reference an existing spark")) {
        return createErrorResponse("Spark not found", 404);
      }
      if (message.includes("before it has been revealed") || message.includes("is not the Spark owner")) {
        return createErrorResponse(message, 409);
      }
      return createErrorResponse("Unable to save this reflection. Please try again.", 500);
    }

    return createSuccessResponse(data, "Reflection saved");
  } catch (error) {
    console.error(`[${ROUTE_NAME}] unexpected POST error`, error);
    return createErrorResponse("Internal server error", 500);
  }
}
