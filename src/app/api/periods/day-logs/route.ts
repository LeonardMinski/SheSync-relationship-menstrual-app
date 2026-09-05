import { NextRequest } from "next/server";

import { authenticateRequest } from "@/lib/api/authentication";
import { createErrorResponse, createSuccessResponse } from "@/lib/api/responses";
import { UpsertPeriodDayLogInputSchema } from "@/schemas/period";

type SupabaseRouteError = { code?: string; message?: string };

function todayDateKey(): string {
  return new Date().toISOString().split("T")[0];
}

function dayLogErrorResponse(action: string, error: SupabaseRouteError) {
  console.error(`[period-day-logs] ${action}`, error);

  if (error.message?.includes("start_date") || error.message?.includes("end_date")) {
    return createErrorResponse("That date falls outside this period", 400);
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

export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user || !supabase) {
      return createErrorResponse("Authentication required", 401);
    }

    const rawBody = await request.json().catch(() => ({}));
    const parsed = UpsertPeriodDayLogInputSchema.safeParse(rawBody);
    if (!parsed.success) {
      return createErrorResponse(
        parsed.error.issues[0]?.message || "Invalid request",
        400,
      );
    }

    const { data: activePeriod, error: activeError } = await supabase
      .from("periods")
      .select("id")
      .eq("user_id", user.id)
      .is("end_date", null)
      .maybeSingle();

    if (activeError) {
      return dayLogErrorResponse("load active period", activeError);
    }
    if (!activePeriod) {
      return createErrorResponse(
        "No active period to log against. Start a period first.",
        400,
      );
    }

    const date = parsed.data.date ?? todayDateKey();

    const row = {
      period_id: activePeriod.id,
      user_id: user.id,
      date,
      bleeding_level: parsed.data.bleedingLevel,
      bleeding_colour: parsed.data.bleedingColour ?? null,
      clots: parsed.data.clots ?? "none",
      cramps: parsed.data.cramps,
      lower_back_pain: parsed.data.lowerBackPain,
      headache: parsed.data.headache,
      bloating: parsed.data.bloating,
      fatigue: parsed.data.fatigue,
      nausea: parsed.data.nausea,
      bowel_changes: parsed.data.bowelChanges,
      sleep_quality: parsed.data.sleepQuality ?? null,
      mood: parsed.data.mood,
      pain_relief_used: parsed.data.painReliefUsed,
      pain_relief_medication: parsed.data.painReliefMedication ?? null,
      pain_relief_time: parsed.data.painReliefTime ?? null,
      activity_impact: parsed.data.activityImpact,
      notes: parsed.data.notes ?? null,
    };

    const { data, error } = await supabase
      .from("period_day_logs")
      .upsert(row, { onConflict: "period_id,date" })
      .select()
      .single();

    if (error) {
      return dayLogErrorResponse("save period day log", error);
    }

    return createSuccessResponse(data, "Day saved");
  } catch (error) {
    console.error("[period-day-logs] unexpected POST error", error);
    return createErrorResponse("Internal server error", 500);
  }
}
