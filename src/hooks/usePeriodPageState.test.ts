import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { usePeriodPageState } from "./usePeriodPageState";
import { useAuth } from "@/context/AuthContext";
import {
  addPastPeriod,
  endPeriod,
  getActivePeriod,
  getPeriodHistory,
  startPeriod,
  upsertPeriodDayLog,
} from "@/services/period";
import { upsertDailyMood } from "@/services/cycle/dailyMood";

vi.mock("@/context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("@/services/period", () => ({
  addPastPeriod: vi.fn(),
  endPeriod: vi.fn(),
  getActivePeriod: vi.fn(),
  getPeriodHistory: vi.fn(),
  startPeriod: vi.fn(),
  upsertPeriodDayLog: vi.fn(),
}));
vi.mock("@/services/cycle/dailyMood", () => ({ upsertDailyMood: vi.fn() }));

const VALID_LOG_INPUT = {
  bleedingLevel: "medium" as const,
  cramps: 4,
  lowerBackPain: 2,
  headache: "mild" as const,
  bloating: "mild" as const,
  fatigue: 6,
  nausea: "none" as const,
  bowelChanges: "normal" as const,
  mood: 7,
  painReliefUsed: false,
  activityImpact: "none" as const,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(useAuth).mockReturnValue({ user: { id: "user-1" }, loading: false } as any);
  vi.mocked(getActivePeriod).mockResolvedValue({ success: true, data: { active: null, todayLog: null } });
  vi.mocked(getPeriodHistory).mockResolvedValue({ success: true, data: [] });
});

describe("usePeriodPageState.saveDayLog — canonical mood sync", () => {
  it("syncs the period log's mood into the canonical daily mood after a successful save", async () => {
    vi.mocked(upsertPeriodDayLog).mockResolvedValue({
      success: true,
      data: { id: "log-1", period_id: "p1", user_id: "user-1", date: "2026-09-05", mood: 7 } as never,
    });
    vi.mocked(upsertDailyMood).mockResolvedValue({ success: true, data: {} as never });

    const { result } = renderHook(() => usePeriodPageState());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.saveDayLog(VALID_LOG_INPUT);
    });

    expect(success).toBe(true);
    expect(upsertDailyMood).toHaveBeenCalledWith({ date: "2026-09-05", mood: 7, hasActivePeriodToday: true });
  });

  it("still reports the save as successful even if the canonical mood sync fails (best-effort, not a blocking dependency)", async () => {
    vi.mocked(upsertPeriodDayLog).mockResolvedValue({
      success: true,
      data: { id: "log-1", period_id: "p1", user_id: "user-1", date: "2026-09-05", mood: 7 } as never,
    });
    vi.mocked(upsertDailyMood).mockResolvedValue({ success: false, error: "network error" });

    const { result } = renderHook(() => usePeriodPageState());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.saveDayLog(VALID_LOG_INPUT);
    });

    expect(success).toBe(true);
  });

  it("does not attempt a mood sync when the period day log save itself fails", async () => {
    vi.mocked(upsertPeriodDayLog).mockResolvedValue({ success: false, error: "save failed" });

    const { result } = renderHook(() => usePeriodPageState());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.saveDayLog(VALID_LOG_INPUT);
    });

    expect(success).toBe(false);
    expect(upsertDailyMood).not.toHaveBeenCalled();
  });
});

describe("usePeriodPageState.addPastPeriod", () => {
  it("creates a completed historical period and refreshes state on success", async () => {
    vi.mocked(addPastPeriod).mockResolvedValue({
      success: true,
      data: { id: "p2", user_id: "user-1", start_date: "2026-08-01", end_date: "2026-08-05", created_at: "", updated_at: "" },
    });

    const { result } = renderHook(() => usePeriodPageState());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.addPastPeriod({ startDate: "2026-08-01", endDate: "2026-08-05" });
    });

    expect(success).toBe(true);
    expect(addPastPeriod).toHaveBeenCalledWith({ startDate: "2026-08-01", endDate: "2026-08-05" });
    // getPeriodHistory/getActivePeriod are called once on mount and once more on refresh after success.
    expect(getPeriodHistory).toHaveBeenCalledTimes(2);
  });

  it("surfaces the error and does not report success when adding a past period fails", async () => {
    vi.mocked(addPastPeriod).mockResolvedValue({ success: false, error: "Invalid dates" });

    const { result } = renderHook(() => usePeriodPageState());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.addPastPeriod({ startDate: "2026-08-05", endDate: "2026-08-01" });
    });

    expect(success).toBe(false);
    expect(result.current.actionError).toBe("Invalid dates");
  });
});

// Sanity check that startPeriod/endPeriod wiring still works untouched by the mood-sync addition.
describe("usePeriodPageState.startPeriod/endPeriod", () => {
  it("still starts a period normally", async () => {
    vi.mocked(startPeriod).mockResolvedValue({
      success: true,
      data: { id: "p1", user_id: "user-1", start_date: "2026-09-05", end_date: null, created_at: "", updated_at: "" },
    });

    const { result } = renderHook(() => usePeriodPageState());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.startPeriod();
    });

    expect(success).toBe(true);
  });

  it("still ends a period normally", async () => {
    vi.mocked(getActivePeriod).mockResolvedValue({
      success: true,
      data: {
        active: { id: "p1", user_id: "user-1", start_date: "2026-09-01", end_date: null, created_at: "", updated_at: "" },
        todayLog: null,
      },
    });
    vi.mocked(endPeriod).mockResolvedValue({
      success: true,
      data: { id: "p1", user_id: "user-1", start_date: "2026-09-01", end_date: "2026-09-05", created_at: "", updated_at: "" },
    });

    const { result } = renderHook(() => usePeriodPageState());
    await waitFor(() => expect(result.current.activePeriod).not.toBeNull());

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.endPeriod();
    });

    expect(success).toBe(true);
  });
});
