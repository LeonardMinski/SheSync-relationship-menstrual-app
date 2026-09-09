import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/api/authentication";
import { createErrorResponse, createSuccessResponse } from "@/lib/api/responses";
import { getEntitlement } from "@/lib/entitlement";

/** Read-only view of the caller's own canonical entitlement. Never accepts a user id — always the authenticated caller's own row. */
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user || !supabase) {
      return createErrorResponse("Authentication required", 401);
    }

    const entitlement = await getEntitlement(supabase, user.id);
    return createSuccessResponse(entitlement);
  } catch (error) {
    console.error("[entitlement] unexpected GET error", error);
    return createErrorResponse("Internal server error", 500);
  }
}
