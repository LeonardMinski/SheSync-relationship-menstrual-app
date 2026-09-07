import { describe, expect, it, vi } from "vitest";

import { buildCoachContext } from "./context";
import { DEFAULT_COACH_CONTEXT_SELECTION } from "@/types/coach";

function makeSupabase(responses: Record<string, { data: unknown; error: unknown }>) {
  const from = vi.fn((table: string) => {
    const chain: Record<string, unknown> = {};
    const terminal = () => Promise.resolve(responses[table] ?? { data: [], error: null });

    chain.select = vi.fn(() => chain);
    chain.eq = vi.fn(() => chain);
    chain.gte = vi.fn(() => chain);
    chain.not = vi.fn(() => chain);
    chain.order = vi.fn(() => chain);
    chain.limit = vi.fn(() => terminal());
    chain.is = vi.fn(() => chain);
    chain.maybeSingle = vi.fn(() => terminal());

    return chain;
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { from } as any;
}

describe("buildCoachContext — source inclusion", () => {
  it("includes daily check-ins only when requested and real rows exist", async () => {
    const supabase = makeSupabase({
      cycle_data: { data: [{ date: "2026-09-01", mood: 4, energy: 3, stress: 8, sleep: 5 }], error: null },
    });

    const result = await buildCoachContext(supabase, "user-1", {
      ...DEFAULT_COACH_CONTEXT_SELECTION,
      cycleContext: false,
      periodHistory: false,
    });

    expect(result.sourcesUsed).toEqual(["dailyCheckIns"]);
    expect(result.contextText).toContain("mood 4/10");
    expect(result.contextText).toContain("2026-09-01");
  });

  it("excludes daily check-ins entirely when not requested, even if data exists", async () => {
    const supabase = makeSupabase({
      cycle_data: { data: [{ date: "2026-09-01", mood: 4, energy: 3, stress: 8, sleep: 5 }], error: null },
    });

    const result = await buildCoachContext(supabase, "user-1", {
      ...DEFAULT_COACH_CONTEXT_SELECTION,
      dailyCheckIns: false,
      cycleContext: false,
      periodHistory: false,
    });

    expect(result.sourcesUsed).not.toContain("dailyCheckIns");
    expect(result.contextText).not.toContain("mood 4/10");
  });

  it("never includes Recent Observations even if the caller explicitly requests it — no Pattern Engine exists", async () => {
    const supabase = makeSupabase({});

    const result = await buildCoachContext(supabase, "user-1", {
      dailyCheckIns: false,
      cycleContext: false,
      periodHistory: false,
      recentObservations: true,
    });

    expect(result.sourcesUsed).not.toContain("recentObservations");
    expect(result.contextText.toLowerCase()).not.toContain("pattern");
    expect(result.contextText.toLowerCase()).not.toContain("observation");
  });

  it("returns an honest 'no data available' message when nothing is requested or found", async () => {
    const supabase = makeSupabase({});

    const result = await buildCoachContext(supabase, "user-1", {
      dailyCheckIns: false,
      cycleContext: false,
      periodHistory: false,
      recentObservations: false,
    });

    expect(result.sourcesUsed).toEqual([]);
    expect(result.contextText).toMatch(/no logged data/i);
  });

  it("does not fabricate a source's presence when requested but no rows exist", async () => {
    const supabase = makeSupabase({ cycle_data: { data: [], error: null } });

    const result = await buildCoachContext(supabase, "user-1", {
      ...DEFAULT_COACH_CONTEXT_SELECTION,
      cycleContext: false,
      periodHistory: false,
    });

    expect(result.sourcesUsed).toEqual([]);
  });
});

describe("buildCoachContext — cycle context is evidence-based, never a fabricated phase", () => {
  it("cites a real Period Day when a period is active, never a phase name", async () => {
    const todayKey = new Date().toISOString().split("T")[0];
    const supabase = makeSupabase({
      periods: { data: { id: "p1", user_id: "user-1", start_date: todayKey, end_date: null }, error: null },
    });

    const result = await buildCoachContext(supabase, "user-1", {
      dailyCheckIns: false,
      cycleContext: true,
      periodHistory: false,
      recentObservations: false,
    });

    expect(result.sourcesUsed).toEqual(["cycleContext"]);
    expect(result.contextText).toMatch(/Period Day 1/);
    expect(result.contextText.toLowerCase()).not.toMatch(/follicular|luteal|ovulation|menstrual phase/);
  });

  it("cites Cycle Day (days since last period started), never a fabricated phase, when no period is active", async () => {
    let call = 0;
    const from = vi.fn((table: string) => {
      const chain: Record<string, unknown> = {};
      chain.select = vi.fn(() => chain);
      chain.eq = vi.fn(() => chain);
      chain.not = vi.fn(() => chain);
      chain.order = vi.fn(() => chain);
      chain.is = vi.fn(() => chain);
      chain.maybeSingle = vi.fn(() => {
        call += 1;
        if (table === "periods" && call === 1) return Promise.resolve({ data: null, error: null });
        return Promise.resolve({ data: null, error: null });
      });
      chain.limit = vi.fn(() =>
        Promise.resolve({ data: [{ start_date: "2026-08-20" }], error: null }),
      );
      return chain;
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = { from } as any;

    const result = await buildCoachContext(supabase, "user-1", {
      dailyCheckIns: false,
      cycleContext: true,
      periodHistory: false,
      recentObservations: false,
    });

    expect(result.contextText).toMatch(/Cycle Day \d+/);
    expect(result.contextText.toLowerCase()).not.toMatch(/follicular|luteal|ovulation/);
  });
});
