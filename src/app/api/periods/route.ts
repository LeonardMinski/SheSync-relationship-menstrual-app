import { NextRequest } from "next/server";

import { authenticateRequest } from "@/lib/api/authentication";
import { createErrorResponse, createSuccessResponse } from "@/lib/api/responses";
import { StartPeriodInputSchema } from "@/schemas/period";
import type { Period } from "@/types/period";

type SupabaseRouteError = { code?: string; message?: string };

function todayDateKey(): string {
  return new Date().toISOString().split("T")[0];
}

function periodErrorResponse(action: string, error: SupabaseRouteError) {
  console.error(`[periods] ${action}`, error);

  if (error.code === "23505") {
    return createErrorResponse(
      "You already have an active period. End it before starting a new one.",
      409,
    );
  }
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

    const activeResult = await supabase
      .from("periods")
      .select("*")
      .eq("user_id", user.id)
      .is("end_date", null)
      .maybeSingle();

    if (activeResult.error) {
      return periodErrorResponse("load active period", activeResult.error);
    }

    const active = activeResult.data as Period | null;

    let todayLog = null;
    if (active) {
      const todayResult = await supabase
        .from("period_day_logs")
        .select("*")
        .eq("period_id", active.id)
        .eq("date", todayDateKey())
        .maybeSingle();

      if (todayResult.error) {
        return periodErrorResponse("load today's log", todayResult.error);
      }
      todayLog = todayResult.data;
    }

    return createSuccessResponse({ active, todayLog });
  } catch (error) {
    console.error("[periods] unexpected GET error", error);
    return createErrorResponse("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user || !supabase) {
      return createErrorResponse("Authentication required", 401);
    }

    const rawBody = await request.json().catch(() => ({}));
    const parsed = StartPeriodInputSchema.safeParse(rawBody);
    if (!parsed.success) {
      return createErrorResponse(
        parsed.error.issues[0]?.message || "Invalid request",
        400,
      );
    }

    const startDate = parsed.data.startDate ?? todayDateKey();

    // endDate present -> "Add past period": insert a completed historical
    // period directly (end_date already set), so it never becomes active
    // and never collides with the one-active-period constraint below.
    const { data, error } = await supabase
      .from("periods")
      .insert({ user_id: user.id, start_date: startDate, end_date: parsed.data.endDate ?? null })
      .select()
      .single();

    if (error) {
      return periodErrorResponse("start period", error);
    }

    return createSuccessResponse(data, parsed.data.endDate ? "Past period added" : "Period started");
  } catch (error) {
    console.error("[periods] unexpected POST error", error);
    return createErrorResponse("Internal server error", 500);
  }
}
