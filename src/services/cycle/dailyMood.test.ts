import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { supabase } from "@/lib/supabase/client";
import { getDailyEntry, saveDailyCheckIn, upsertDailyMood } from "./dailyMood";

vi.mock("@/lib/supabase/client", () => ({
  supabase: { auth: { getSession: vi.fn() } },
}));

const fetchMock = vi.fn();

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: () => Promise.resolve(body) };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal("fetch", fetchMock);
  vi.mocked(supabase.auth.getSession).mockResolvedValue({
    data: { session: { access_token: "token-1" } },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getDailyEntry", () => {
  it("returns null when no cycle_data row exists for the date", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: [] }));

    const result = await getDailyEntry("2026-09-01");

    expect(result).toEqual({ success: true, data: null });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/cycle?startDate=2026-09-01&endDate=2026-09-01",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("returns the existing row when one exists", async () => {
    const row = { id: "cycle-1", date: "2026-09-01", mood: 6 };
    fetchMock.mockResolvedValue(jsonResponse({ data: [row] }));

    const result = await getDailyEntry("2026-09-01");

    expect(result).toEqual({ success: true, data: row });
  });
});

describe("upsertDailyMood — same date updates rather than duplicates", () => {
  it("creates a new cycle_data row via POST when none exists for the date yet", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ data: [] })) // getDailyEntry
      .mockResolvedValueOnce(jsonResponse({ data: { id: "new-1", date: "2026-09-01", mood: 8 } }));

    const result = await upsertDailyMood({ date: "2026-09-01", mood: 8, hasActivePeriodToday: false });

    expect(result.success).toBe(true);
    const [, postCall] = fetchMock.mock.calls;
    expect(postCall[0]).toBe("/api/cycle");
    expect(postCall[1].method).toBe("POST");
    const body = JSON.parse(postCall[1].body);
    expect(body).toEqual({ date: "2026-09-01", phase: "follicular", mood: 8 });
  });

  it("updates the existing row via PUT (by id) when one already exists for the date, never creating a second row", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ data: [{ id: "cycle-1", date: "2026-09-01", mood: 4 }] }))
      .mockResolvedValueOnce(jsonResponse({ data: { id: "cycle-1", date: "2026-09-01", mood: 9 } }));

    const result = await upsertDailyMood({ date: "2026-09-01", mood: 9, hasActivePeriodToday: false });

    expect(result.success).toBe(true);
    const [, putCall] = fetchMock.mock.calls;
    expect(putCall[1].method).toBe("PUT");
    expect(JSON.parse(putCall[1].body)).toEqual({ id: "cycle-1", mood: 9 });
  });

  it("uses the menstrual placeholder phase only when creating a row during an active period", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ data: [] }))
      .mockResolvedValueOnce(jsonResponse({ data: { id: "new-1", date: "2026-09-01", mood: 5 } }));

    await upsertDailyMood({ date: "2026-09-01", mood: 5, hasActivePeriodToday: true });

    const [, postCall] = fetchMock.mock.calls;
    expect(JSON.parse(postCall[1].body).phase).toBe("menstrual");
  });
});

describe("saveDailyCheckIn — optional context fields", () => {
  it("omits optional fields entirely when not supplied, rather than sending defaults that would clobber existing values", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ data: [{ id: "cycle-1", date: "2026-09-01", mood: 5 }] }))
      .mockResolvedValueOnce(jsonResponse({ data: { id: "cycle-1", date: "2026-09-01", mood: 8 } }));

    await saveDailyCheckIn({ date: "2026-09-01", mood: 8, hasActivePeriodToday: false });

    const [, putCall] = fetchMock.mock.calls;
    const body = JSON.parse(putCall[1].body);
    expect(body).toEqual({ id: "cycle-1", mood: 8 });
    expect(body.energy).toBeUndefined();
    expect(body.stress).toBeUndefined();
    expect(body.sleep).toBeUndefined();
    expect(body.notes).toBeUndefined();
  });

  it("includes only the optional fields actually supplied", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ data: [] }))
      .mockResolvedValueOnce(jsonResponse({ data: { id: "new-1", date: "2026-09-01", mood: 6 } }));

    await saveDailyCheckIn({
      date: "2026-09-01",
      mood: 6,
      energy: 7,
      hasActivePeriodToday: false,
    });

    const [, postCall] = fetchMock.mock.calls;
    const body = JSON.parse(postCall[1].body);
    expect(body).toEqual({ date: "2026-09-01", phase: "follicular", mood: 6, energy: 7 });
  });
});

describe("safe error handling", () => {
  it("returns an error without calling PUT/POST when the initial lookup fails", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "boom" }, false));

    const result = await upsertDailyMood({ date: "2026-09-01", mood: 5, hasActivePeriodToday: false });

    expect(result.success).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
