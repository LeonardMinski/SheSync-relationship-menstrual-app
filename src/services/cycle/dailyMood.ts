import { supabase } from "@/lib/supabase/client";
import type { CycleEntry, CyclePhase } from "@/types/cycle";

/**
 * Canonical daily mood sync — see docs/HOME_CYCLE_MOOD_MODEL.md.
 *
 * `cycle_data.mood` (one row per user/date) is the single canonical daily
 * mood value. `period_day_logs.mood` still exists as its own column (it
 * cannot be dropped without a migration) but is treated as a synced mirror,
 * not an independent source of truth: saving a period day log also upserts
 * this canonical value for that date, and the period log form pre-fills its
 * mood field from here when a canonical value already exists for today.
 *
 * This never rewrites historical dates — it only ever touches the date the
 * caller is actively saving, and update-vs-create is decided per date by
 * whether a cycle_data row already exists for it.
 */

type ApiResult<T> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: string };

type ApiResponse<T> = {
  data?: T;
  error?: string;
};

async function getAccessToken(): Promise<string | null> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) {
    console.error("[daily-mood] failed to read Supabase session", error);
    return null;
  }
  return session?.access_token || null;
}

async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: "Authentication required" };
  }

  try {
    const response = await fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...init?.headers,
      },
    });

    const json = (await response.json().catch(() => ({}))) as ApiResponse<T>;

    if (!response.ok) {
      return { success: false, error: json.error || "Request failed" };
    }
    if (json.data === undefined) {
      return { success: false, error: "Malformed response from server" };
    }

    return { success: true, data: json.data };
  } catch (error) {
    console.error(`[daily-mood] request failed: ${path}`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/** The one cycle_data row for a given date, or null if nothing is logged yet. */
export async function getDailyEntry(date: string): Promise<ApiResult<CycleEntry | null>> {
  const result = await request<CycleEntry[]>(
    `/api/cycle?startDate=${date}&endDate=${date}`,
    { method: "GET" },
  );
  if (!result.success) return result;
  return { success: true, data: result.data[0] ?? null };
}

/**
 * There is no real cycle-phase detection model in this app (see
 * src/features/home/homeState.ts). This value is never shown to the user —
 * it exists only because cycle_data.phase is a required column on the
 * legacy table shared with the full CycleLogDialog form.
 */
function placeholderPhase(hasActivePeriodToday: boolean): CyclePhase {
  return hasActivePeriodToday ? "menstrual" : "follicular";
}

/**
 * Upserts the canonical daily mood for one date without clobbering any
 * other fields already logged for that date (energy/sleep/stress/symptoms/
 * notes) — updates by id when a row exists, otherwise creates a new one.
 */
export async function upsertDailyMood(input: {
  date: string;
  mood: number;
  hasActivePeriodToday: boolean;
}): Promise<ApiResult<CycleEntry>> {
  const existing = await getDailyEntry(input.date);
  if (!existing.success) return existing;

  if (existing.data?.id) {
    return request<CycleEntry>("/api/cycle", {
      method: "PUT",
      body: JSON.stringify({ id: existing.data.id, mood: input.mood }),
    });
  }

  return request<CycleEntry>("/api/cycle", {
    method: "POST",
    body: JSON.stringify({
      date: input.date,
      phase: placeholderPhase(input.hasActivePeriodToday),
      mood: input.mood,
    }),
  });
}

/**
 * Full daily check-in save (mood plus optional context fields), same
 * update-by-id-if-exists-else-create rule as upsertDailyMood.
 */
export async function saveDailyCheckIn(input: {
  date: string;
  mood: number;
  energy?: number;
  sleep?: number;
  stress?: number;
  notes?: string;
  hasActivePeriodToday: boolean;
}): Promise<ApiResult<CycleEntry>> {
  const existing = await getDailyEntry(input.date);
  if (!existing.success) return existing;

  const optionalFields = {
    ...(input.energy !== undefined ? { energy: input.energy } : {}),
    ...(input.sleep !== undefined ? { sleep: input.sleep } : {}),
    ...(input.stress !== undefined ? { stress: input.stress } : {}),
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
  };

  if (existing.data?.id) {
    return request<CycleEntry>("/api/cycle", {
      method: "PUT",
      body: JSON.stringify({ id: existing.data.id, mood: input.mood, ...optionalFields }),
    });
  }

  return request<CycleEntry>("/api/cycle", {
    method: "POST",
    body: JSON.stringify({
      date: input.date,
      phase: placeholderPhase(input.hasActivePeriodToday),
      mood: input.mood,
      ...optionalFields,
    }),
  });
}
