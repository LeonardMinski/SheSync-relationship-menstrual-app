import { NextRequest } from "next/server";
import { addDays } from "date-fns";

import { authenticateRequest, requireTrackingEnabled } from "@/lib/api/authentication";
import { createErrorResponse, createSuccessResponse } from "@/lib/api/responses";
import { generateObservations } from "@/features/patterns/engine";
import { PATTERN_THRESHOLDS } from "@/features/patterns/thresholds";
import type { PeriodWithDayLogs } from "@/features/patterns/periodObservations";
import type { Period, PeriodDayLog } from "@/types/period";

type PeriodRow = Period & { period_day_logs: PeriodDayLog[] };
type CycleDataRow = { date: string; mood: number | null };

/**
 * Deterministic Pattern Engine observations for the authenticated caller
 * only — no cross-user access, no relationship data, no Vault, no Coach
 * conversation data (none of those are queried here at all). The engine
 * itself (features/patterns/engine.ts) is pure; this route's only job is
 * fetching bounded, real, owner-scoped source data and handing it over.
 *
 * Exactly two tables are ever queried: `periods` and `cycle_data`. The
 * `periods` query embeds `period_day_logs(*)` as a PostgREST nested
 * relation (resolved via the real FK period_day_logs.period_id ->
 * periods.id) — a single request, not a second query, but it does fetch
 * every symptom/flow field the engine needs. See docs/pattern-engine-v1.md
 * "Actual query shape" for the full accounting, including why the nested
 * embed can't silently widen (allowlist test + RLS backstop on both
 * tables).
 */
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user || !supabase) {
      return createErrorResponse("Authentication required", 401);
    }
    const trackingBlocked = requireTrackingEnabled(user);
    if (trackingBlocked) return trackingBlocked;

    const { data: periodRows, error: periodsError } = await supabase
      .from("periods")
      .select("*, period_day_logs(*)")
      .eq("user_id", user.id)
      .not("end_date", "is", null)
      .order("start_date", { ascending: false })
      .limit(PATTERN_THRESHOLDS.windows.recentCompletedPeriods);

    if (periodsError) {
      console.error("[patterns] failed to load periods", periodsError);
      return createErrorResponse("Failed to load observations", 500);
    }

    const sinceKey = addDays(new Date(), -(PATTERN_THRESHOLDS.windows.dailyCheckInDays - 1))
      .toISOString()
      .split("T")[0];

    const { data: cycleRows, error: cycleError } = await supabase
      .from("cycle_data")
      .select("date, mood")
      .eq("user_id", user.id)
      .gte("date", sinceKey)
      .order("date", { ascending: false });

    if (cycleError) {
      console.error("[patterns] failed to load daily check-ins", cycleError);
      return createErrorResponse("Failed to load observations", 500);
    }

    const periods: PeriodWithDayLogs[] = ((periodRows ?? []) as PeriodRow[]).map((row) => {
      const { period_day_logs: logs, ...period } = row;
      return { period, logs: logs ?? [] };
    });

    const cycleEntries = ((cycleRows ?? []) as CycleDataRow[])
      .filter((row): row is { date: string; mood: number } => typeof row.mood === "number")
      .map((row) => ({ date: row.date, mood: row.mood }));

    const observations = generateObservations({ periods, cycleEntries });

    return createSuccessResponse({ observations });
  } catch (error) {
    console.error("[patterns] unexpected GET error", error);
    return createErrorResponse("Internal server error", 500);
  }
}
