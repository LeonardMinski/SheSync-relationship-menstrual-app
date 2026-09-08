import { NextRequest } from "next/server";

import { authenticateRequest } from "@/lib/api/authentication";
import { createErrorResponse, createSuccessResponse } from "@/lib/api/responses";

/**
 * Archives a Spark. Plain owner-scoped update, no RPC — RLS already
 * restricts this to the owner, and there's no cross-party invariant to
 * enforce (archiving never affects a partner's view; get_partner_vault_summary
 * already excludes 'archived'). The status<>'archived' filter just makes the
 * response accurate when called twice rather than silently no-op succeeding.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user || !supabase) {
      return createErrorResponse("Authentication required", 401);
    }
    const { id } = await params;
    const { data, error } = await supabase
      .from("vault_sparks")
      .update({ status: "archived", archived_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id)
      .neq("status", "archived")
      .select()
      .single();

    if (error || !data) {
      if (error?.code === "PGRST116") {
        return createErrorResponse("Spark not found or already archived", 409);
      }
      console.error("[vault/sparks/:id/archive] failed", error);
      return createErrorResponse("Unable to archive this Spark. Please try again.", 500);
    }

    return createSuccessResponse(data, "Spark archived");
  } catch (error) {
    console.error("[vault/sparks/:id/archive] unexpected POST error", error);
    return createErrorResponse("Internal server error", 500);
  }
}
