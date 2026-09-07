import type { SupabaseClient } from "@supabase/supabase-js";

import { getAverageCycleLength, getPeriodDay, MIN_COMPLETED_PERIODS_FOR_AVERAGE } from "@/features/period/period.utils";
import type { CoachContextSelection } from "@/types/coach";
import type { Period, PeriodSummary } from "@/types/period";

const DAILY_CHECKIN_LOOKBACK_DAYS = 14;
const DAILY_CHECKIN_MAX_ENTRIES = 10;

export interface CoachContextResult {
  /** Human-readable block injected into the model's context — real data only, no fabrication. */
  contextText: string;
  /** Which of the requested sources actually contributed real data — for transparency and tests. */
  sourcesUsed: string[];
}

type CycleDataRow = { date: string; mood: number | null; energy: number | null; stress: number | null; sleep: number | null };

/**
 * Builds Coach's context strictly from real, already-logged data, and only
 * from the sources the caller both requested AND is genuinely allowed —
 * Recent Observations is never included regardless of what's requested,
 * because there is no real Pattern Engine yet. Nothing here infers,
 * predicts, or fabricates; every line is traceable to a stored value.
 */
export async function buildCoachContext(
  supabase: SupabaseClient,
  userId: string,
  selection: CoachContextSelection,
): Promise<CoachContextResult> {
  const sections: string[] = [];
  const sourcesUsed: string[] = [];

  if (selection.dailyCheckIns) {
    const since = new Date();
    since.setDate(since.getDate() - DAILY_CHECKIN_LOOKBACK_DAYS);
    const sinceKey = since.toISOString().split("T")[0];

    const { data } = await supabase
      .from("cycle_data")
      .select("date, mood, energy, stress, sleep")
      .eq("user_id", userId)
      .gte("date", sinceKey)
      .order("date", { ascending: false })
      .limit(DAILY_CHECKIN_MAX_ENTRIES);

    const rows = (data ?? []) as CycleDataRow[];
    if (rows.length > 0) {
      const lines = rows.map((row) => {
        const parts = [`mood ${row.mood ?? "—"}/10`];
        if (typeof row.energy === "number") parts.push(`energy ${row.energy}/10`);
        if (typeof row.stress === "number") parts.push(`stress ${row.stress}/10`);
        if (typeof row.sleep === "number") parts.push(`sleep ${row.sleep}/10`);
        return `- ${row.date}: ${parts.join(", ")}`;
      });
      sections.push(`Daily check-ins (most recent ${rows.length}, last ${DAILY_CHECKIN_LOOKBACK_DAYS} days):\n${lines.join("\n")}`);
      sourcesUsed.push("dailyCheckIns");
    }
  }

  let activePeriod: Period | null = null;
  if (selection.cycleContext || selection.periodHistory) {
    const { data } = await supabase
      .from("periods")
      .select("*")
      .eq("user_id", userId)
      .is("end_date", null)
      .maybeSingle();
    activePeriod = (data as Period | null) ?? null;
  }

  if (selection.cycleContext) {
    if (activePeriod) {
      const todayKey = new Date().toISOString().split("T")[0];
      const periodDay = getPeriodDay(activePeriod, todayKey);
      sections.push(`Cycle context: currently on Period Day ${periodDay}.`);
      sourcesUsed.push("cycleContext");
    } else {
      const { data: history } = await supabase
        .from("periods")
        .select("start_date")
        .eq("user_id", userId)
        .not("end_date", "is", null)
        .order("start_date", { ascending: false })
        .limit(1);
      const last = (history ?? [])[0] as { start_date: string } | undefined;
      if (last) {
        const todayKey = new Date().toISOString().split("T")[0];
        const cycleDay = getPeriodDay({ start_date: last.start_date }, todayKey);
        sections.push(`Cycle context: Cycle Day ${cycleDay} (days since the last logged period started). No active period right now.`);
        sourcesUsed.push("cycleContext");
      }
    }
  }

  if (selection.periodHistory) {
    const { data } = await supabase
      .from("periods")
      .select("start_date, end_date")
      .eq("user_id", userId)
      .not("end_date", "is", null)
      .order("start_date", { ascending: false })
      .limit(6);

    const completed = (data ?? []) as Pick<PeriodSummary, "start_date" | "end_date">[];
    if (completed.length > 0) {
      const lines = completed.map((p) => `- ${p.start_date} to ${p.end_date}`);
      let text = `Period history (${completed.length} most recent completed periods):\n${lines.join("\n")}`;
      if (completed.length >= MIN_COMPLETED_PERIODS_FOR_AVERAGE) {
        const average = getAverageCycleLength(completed as Pick<Period, "start_date">[]);
        if (average !== null) text += `\nAverage cycle length: ${average} days.`;
      }
      sections.push(text);
      sourcesUsed.push("periodHistory");
    }
  }

  // Recent Observations is never included — see CoachContextSelection's
  // doc comment. There is no real deterministic Pattern Engine yet, so
  // fabricating "patterns" here would violate the product's no-fabrication
  // rule. This is enforced here, not just hidden in the UI, so a client
  // bug or a direct API call can't smuggle a fake observation in.

  return {
    contextText: sections.length > 0 ? sections.join("\n\n") : "No logged data is currently available for this conversation.",
    sourcesUsed,
  };
}
