import { NextRequest } from "next/server";

import { authenticateRequest } from "@/lib/api/authentication";
import { createErrorResponse, createSuccessResponse } from "@/lib/api/responses";
import { toPeriodSummary } from "@/features/period/period.utils";
import type { Period } from "@/types/period";

type SupabaseRouteError = { code?: string; message?: string };

function periodErrorResponse(action: string, error: SupabaseRouteError) {
  console.error(`[periods/history] ${action}`, error);

  if (error.code === "42501") {
    return createErrorResponse("Period data access denied", 403);
  }
  if (error.code === "42P01") {
    return createErrorResponse(
      "Period tracking is not fully set up yet. Run the period-tracking-v1 migration.",
      500,
    );
  }

  return createErrorResponse(`Failed to ${action}`, 500);
}

export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user || !supabase) {
      return createErrorResponse("Authentication required", 401);
    }

    const { data, error } = await supabase
      .from("periods")
      .select("*, period_day_logs(id)")
      .eq("user_id", user.id)
      .not("end_date", "is", null)
      .order("start_date", { ascending: false });

    if (error) {
      return periodErrorResponse("load period history", error);
    }

    const history = (data || []).map((row) => {
      const { period_day_logs, ...period } = row as Period & {
        period_day_logs: { id: string }[];
      };
      return toPeriodSummary(period, period_day_logs || []);
    });

    return createSuccessResponse({ history });
  } catch (error) {
    console.error("[periods/history] unexpected GET error", error);
    return createErrorResponse("Internal server error", 500);
  }
}
