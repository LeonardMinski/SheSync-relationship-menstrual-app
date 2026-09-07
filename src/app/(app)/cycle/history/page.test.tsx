import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CycleHistoryPage from "./page";
import { useAuth } from "@/context/AuthContext";
import { useCycleLogger } from "@/hooks/useCycleLogger";
import { usePeriodPageState } from "@/hooks/usePeriodPageState";
import { getPeriodById } from "@/services/period";

vi.mock("@/context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("@/hooks/useCycleLogger", () => ({ useCycleLogger: vi.fn() }));
vi.mock("@/hooks/usePeriodPageState", () => ({ usePeriodPageState: vi.fn() }));
vi.mock("@/services/period", () => ({ getPeriodById: vi.fn() }));

// A fixed "today" so the calendar/history window is deterministic.
const TODAY = new Date("2026-09-15T12:00:00.000Z");

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(TODAY);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(useAuth).mockReturnValue({ user: { id: "user-1" }, loading: false } as any);
  vi.mocked(useCycleLogger).mockReturnValue({
    cycles: [
      { id: "c1", user_id: "user-1", date: "2026-09-05", phase: "menstrual", mood: 4, energy: 5, sleep: 5, libido: 5, stress: 5, symptoms: [] },
    ],
    loading: false,
    error: null,
    fetchCycles: vi.fn(),
    logCycle: vi.fn(),
    clearError: vi.fn(),
  });
  vi.mocked(usePeriodPageState).mockReturnValue({
    user: { id: "user-1" },
    authLoading: false,
    loading: false,
    loadError: null,
    activePeriod: null,
    todayLog: null,
    history: [
      { id: "period-1", start_date: "2026-09-05", end_date: "2026-09-07", isActive: false, durationDays: 3, loggedDayCount: 2 },
    ],
    starting: false,
    ending: false,
    savingLog: false,
    actionError: null,
    successMessage: null,
    startPeriod: vi.fn(),
    endPeriod: vi.fn(),
    saveDayLog: vi.fn(),
    addPastPeriod: vi.fn(),
    clearActionError: vi.fn(),
    clearSuccessMessage: vi.fn(),
    refresh: vi.fn(),
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Cycle history page", () => {
  it("selecting a period day shows both its daily check-in and period sources, lazily fetched from getPeriodById", async () => {
    vi.mocked(getPeriodById).mockResolvedValue({
      success: true,
      data: {
        id: "period-1",
        user_id: "user-1",
        start_date: "2026-09-05",
        end_date: "2026-09-07",
        created_at: "",
        updated_at: "",
        logs: [
          {
            id: "log-1",
            period_id: "period-1",
            user_id: "user-1",
            date: "2026-09-05",
            bleeding_level: "heavy",
            bleeding_colour: null,
            clots: "none",
            cramps: 7,
            lower_back_pain: 3,
            headache: "mild",
            bloating: "mild",
            fatigue: 8,
            nausea: "none",
            bowel_changes: "normal",
            sleep_quality: 3,
            mood: 4,
            pain_relief_used: false,
            pain_relief_medication: null,
            pain_relief_time: null,
            activity_impact: "some",
            notes: null,
            created_at: "",
            updated_at: "",
          },
        ],
      },
    });

    render(<CycleHistoryPage />);

    fireEvent.click(screen.getByLabelText(/September 5.*mood.*period day/i));

    const panel = within(await screen.findByTestId("day-detail-panel"));

    // Daily check-in section (from cycle_data via useCycleLogger)
    expect(panel.getByText("Mood")).toBeInTheDocument();
    expect(panel.getByText("4/10")).toBeInTheDocument();

    // Period section is lazily fetched — only appears once getPeriodById resolves.
    await waitFor(() => expect(panel.getByText("Flow")).toBeInTheDocument());
    expect(panel.getByText("Heavy")).toBeInTheDocument();
    expect(panel.getByText("7/10")).toBeInTheDocument();
  });

  it("shows a real monthly summary derived from the actual logged data", () => {
    render(<CycleHistoryPage />);

    const summary = within(screen.getByText("Days checked in").closest("div") as HTMLElement);
    expect(summary.getByText("1")).toBeInTheDocument(); // one cycle_data entry in September
  });
});
