import { NextRequest } from "next/server";

import { authenticateRequest } from "@/lib/api/authentication";
import { createErrorResponse, createSuccessResponse } from "@/lib/api/responses";
import { EndPeriodInputSchema } from "@/schemas/period";

type SupabaseRouteError = { code?: string; message?: string };

function todayDateKey(): string {
  return new Date().toISOString().split("T")[0];
}

function periodErrorResponse(action: string, error: SupabaseRouteError) {
  console.error(`[periods/:id] ${action}`, error);

  if (error.code === "23514") {
    return createErrorResponse("End date cannot be before the start date", 400);
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user || !supabase) {
      return createErrorResponse("Authentication required", 401);
    }

    const { id } = await params;

    const periodResult = await supabase
      .from("periods")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (periodResult.error) {
      return periodErrorResponse("load period", periodResult.error);
    }
    if (!periodResult.data) {
      return createErrorResponse("Period not found", 404);
    }

    const logsResult = await supabase
      .from("period_day_logs")
      .select("*")
      .eq("period_id", id)
      .eq("user_id", user.id)
      .order("date", { ascending: true });

    if (logsResult.error) {
      return periodErrorResponse("load period logs", logsResult.error);
    }

    return createSuccessResponse({
      ...periodResult.data,
      logs: logsResult.data || [],
    });
  } catch (error) {
    console.error("[periods/:id] unexpected GET error", error);
    return createErrorResponse("Internal server error", 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user || !supabase) {
      return createErrorResponse("Authentication required", 401);
    }

    const { id } = await params;

    const rawBody = await request.json().catch(() => ({}));
    const parsed = EndPeriodInputSchema.safeParse(rawBody);
    if (!parsed.success) {
      return createErrorResponse(
        parsed.error.issues[0]?.message || "Invalid request",
        400,
      );
    }

    const endDate = parsed.data.endDate ?? todayDateKey();

    const { data: existing, error: lookupError } = await supabase
      .from("periods")
      .select("id, end_date")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (lookupError) {
      return periodErrorResponse("end period", lookupError);
    }
    if (!existing) {
      return createErrorResponse("Period not found", 404);
    }
    if (existing.end_date !== null) {
      return createErrorResponse("This period has already ended", 400);
    }

    const { data, error } = await supabase
      .from("periods")
      .update({ end_date: endDate })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return periodErrorResponse("end period", error);
    }

    return createSuccessResponse(data, "Period ended");
  } catch (error) {
    console.error("[periods/:id] unexpected PATCH error", error);
    return createErrorResponse("Internal server error", 500);
  }
}
