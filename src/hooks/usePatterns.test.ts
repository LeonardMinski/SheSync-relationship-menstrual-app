import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { usePatterns } from "./usePatterns";
import { getObservations } from "@/services/patterns";
import type { Observation } from "@/types/patterns";

vi.mock("@/services/patterns", () => ({ getObservations: vi.fn() }));

const SAMPLE_OBSERVATION: Observation = {
  id: "obs-1",
  type: "period_duration_range",
  title: "Period duration",
  statement: "Your recent periods have lasted between 4 and 6 days.",
  evidence: { periodsConsidered: 3, minDays: 4, maxDays: 6 },
  sufficiency: "sufficient",
  window: { description: "last 3 completed periods" },
  generatedAt: "2026-09-01T00:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("usePatterns", () => {
  it("starts loading, then returns the caller's own real observations", async () => {
    vi.mocked(getObservations).mockResolvedValue({ success: true, data: [SAMPLE_OBSERVATION] });

    const { result } = renderHook(() => usePatterns());

    expect(result.current.loading).toBe(true);
    expect(result.current.observations).toEqual([]);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.observations).toEqual([SAMPLE_OBSERVATION]);
    expect(result.current.error).toBeNull();
  });

  it("returns a safe empty array, not an error, when the caller has no observations yet", async () => {
    vi.mocked(getObservations).mockResolvedValue({ success: true, data: [] });

    const { result } = renderHook(() => usePatterns());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.observations).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("surfaces a failure without fabricating observations", async () => {
    vi.mocked(getObservations).mockResolvedValue({ success: false, error: "Authentication required" });

    const { result } = renderHook(() => usePatterns());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.observations).toEqual([]);
    expect(result.current.error).toBe("Authentication required");
  });
});
