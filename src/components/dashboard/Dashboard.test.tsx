import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Dashboard from "./Dashboard";
import { useAuth } from "@/context/AuthContext";
import { useCycleLogger } from "@/hooks/useCycleLogger";
import { usePartnerPortalData } from "@/hooks/usePartnerPortalData";
import { usePatterns } from "@/hooks/usePatterns";
import { usePeriodPageState } from "@/hooks/usePeriodPageState";

vi.mock("@/context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("@/hooks/useCycleLogger", () => ({ useCycleLogger: vi.fn() }));
vi.mock("@/hooks/usePartnerPortalData", () => ({ usePartnerPortalData: vi.fn() }));
vi.mock("@/hooks/usePatterns", () => ({ usePatterns: vi.fn() }));
vi.mock("@/hooks/usePeriodPageState", () => ({ usePeriodPageState: vi.fn() }));

vi.mock("@/components/home/DailyCheckIn", () => ({
  DailyCheckIn: ({ hasActivePeriodToday }: { hasActivePeriodToday: boolean }) => (
    <div data-testid="daily-check-in">daily check-in (active period: {String(hasActivePeriodToday)})</div>
  ),
}));
vi.mock("@/components/home/CurrentCycleContext", () => ({
  CurrentCycleContext: () => <div data-testid="current-cycle-context">current cycle context</div>,
}));
vi.mock("@/components/home/YourWeek", () => ({
  YourWeek: ({ cycles }: { cycles: unknown[] }) => <div data-testid="your-week">your week ({cycles.length} entries)</div>,
}));
vi.mock("@/components/home/HomeRelationshipCard", () => ({
  HomeRelationshipCard: () => <div>relationship card</div>,
}));
vi.mock("@/components/home/IncomingSharedContextCard", () => ({
  IncomingSharedContextCard: ({ partnerName }: { partnerName: string }) => <div>incoming context from {partnerName}</div>,
}));

function setDefaults() {
  vi.mocked(useAuth).mockReturnValue({
    user: { id: "user-1", name: "Person" },
    session: null,
    loading: false,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    requestPasswordReset: vi.fn(),
    updatePassword: vi.fn(),
    refreshUser: vi.fn(),
    profileError: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  vi.mocked(useCycleLogger).mockReturnValue({
    cycles: [],
    loading: false,
    error: null,
    fetchCycles: vi.fn(),
    logCycle: vi.fn(),
    clearError: vi.fn(),
  });

  vi.mocked(usePartnerPortalData).mockReturnValue({
    actionError: null,
    dataLoading: false,
    invitePartner: vi.fn(),
    loading: false,
    ownerLink: null,
    ownSharingSummary: [],
    partnerData: null,
    refreshing: false,
    refreshPartnerData: vi.fn(),
    respondToIncomingInvite: vi.fn(),
    revokeConnection: vi.fn(),
    user: null,
    viewerLink: null,
  });

  vi.mocked(usePeriodPageState).mockReturnValue({
    user: null,
    authLoading: false,
    loading: false,
    loadError: null,
    activePeriod: null,
    todayLog: null,
    history: [],
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

  vi.mocked(usePatterns).mockReturnValue({ observations: [], loading: false, error: null });
}

describe("Dashboard (Home) — target section hierarchy", () => {
  it("no longer renders 'Your State Today' as a separate logging surface", () => {
    setDefaults();
    render(<Dashboard />);

    expect(screen.queryByText("Your State Today")).not.toBeInTheDocument();
  });

  it("no longer renders the old raw 'Recent Entries' list", () => {
    setDefaults();
    render(<Dashboard />);

    expect(screen.queryByText("Recent Entries")).not.toBeInTheDocument();
    expect(screen.queryByText("Log Today")).not.toBeInTheDocument();
  });

  it("renders the read-only current cycle context section", () => {
    setDefaults();
    render(<Dashboard />);

    expect(screen.getByTestId("current-cycle-context")).toBeInTheDocument();
  });

  it("renders the lightweight daily check-in, reflecting whether a period is active today", () => {
    setDefaults();
    vi.mocked(usePeriodPageState).mockReturnValue({
      ...vi.mocked(usePeriodPageState)(),
      activePeriod: { id: "p1", user_id: "user-1", start_date: "2026-09-01", end_date: null, created_at: "", updated_at: "" },
    });

    render(<Dashboard />);

    expect(screen.getByTestId("daily-check-in")).toHaveTextContent("active period: true");
  });

  it("renders Your Week driven by real cycle entries, not a fabricated list", () => {
    setDefaults();
    vi.mocked(useCycleLogger).mockReturnValue({
      cycles: [
        { id: "1", user_id: "user-1", date: "2026-09-01", phase: "follicular", mood: 6, energy: 5, sleep: 5, libido: 5, stress: 5, symptoms: [] },
      ],
      loading: false,
      error: null,
      fetchCycles: vi.fn(),
      logCycle: vi.fn(),
      clearError: vi.fn(),
    });

    render(<Dashboard />);

    expect(screen.getByTestId("your-week")).toHaveTextContent("your week (1 entries)");
  });

  it("renders What We're Noticing using the same evidence-gated observation as before when Pattern Engine has nothing sufficient", () => {
    setDefaults();
    render(<Dashboard />);

    expect(screen.getByText(/we're learning your patterns/i)).toBeInTheDocument();
  });

  it("renders the relationship section", () => {
    setDefaults();
    render(<Dashboard />);

    expect(screen.getByText("relationship card")).toBeInTheDocument();
  });
});

describe("Dashboard — What We're Noticing wired to real Pattern Engine observations", () => {
  it("shows the real Pattern Engine observation instead of the honest-learning fallback once one is sufficient", () => {
    setDefaults();
    vi.mocked(usePatterns).mockReturnValue({
      observations: [
        {
          id: "period_duration_range",
          type: "period_duration_range",
          title: "Period duration",
          statement: "Your recent periods have lasted between 4 and 5 days.",
          evidence: { periodsConsidered: 3, minDays: 4, maxDays: 5 },
          sufficiency: "sufficient",
          window: { description: "last 3 completed periods" },
          generatedAt: "2026-09-01T00:00:00.000Z",
        },
      ],
      loading: false,
      error: null,
    });

    render(<Dashboard />);

    expect(screen.getByText("Your recent periods have lasted between 4 and 5 days.")).toBeInTheDocument();
    expect(screen.queryByText(/we're learning your patterns/i)).not.toBeInTheDocument();
  });

  it("shows only ONE observation on Home even when several are available", () => {
    setDefaults();
    vi.mocked(usePatterns).mockReturnValue({
      observations: [
        {
          id: "period_duration_range",
          type: "period_duration_range",
          title: "Period duration",
          statement: "Duration statement.",
          evidence: { periodsConsidered: 3, minDays: 4, maxDays: 5 },
          sufficiency: "sufficient",
          window: { description: "x" },
          generatedAt: "2026-09-01T00:00:00.000Z",
        },
        {
          id: "checkin_consistency",
          type: "checkin_consistency",
          title: "Daily check-ins",
          statement: "Check-in statement.",
          evidence: { daysConsidered: 14, checkedInDays: 10 },
          sufficiency: "sufficient",
          window: { description: "x" },
          generatedAt: "2026-09-01T00:00:00.000Z",
        },
      ],
      loading: false,
      error: null,
    });

    render(<Dashboard />);

    expect(screen.getByText("Duration statement.")).toBeInTheDocument();
    expect(screen.queryByText("Check-in statement.")).not.toBeInTheDocument();
  });

  it("falls back to the honest learning state rather than a fabricated observation when only 'emerging' evidence exists", () => {
    setDefaults();
    vi.mocked(usePatterns).mockReturnValue({
      observations: [
        {
          id: "period_duration_range",
          type: "period_duration_range",
          title: "Period duration",
          statement: "Your recent periods have lasted between 4 and 5 days.",
          evidence: { periodsConsidered: 2, minDays: 4, maxDays: 5 },
          sufficiency: "emerging",
          window: { description: "x" },
          generatedAt: "2026-09-01T00:00:00.000Z",
        },
      ],
      loading: false,
      error: null,
    });

    render(<Dashboard />);

    expect(screen.getByText(/we're learning your patterns/i)).toBeInTheDocument();
    expect(screen.queryByText("Your recent periods have lasted between 4 and 5 days.")).not.toBeInTheDocument();
  });

  it("prioritises an active-period observation type over a between-periods one when a period is active", () => {
    setDefaults();
    vi.mocked(usePeriodPageState).mockReturnValue({
      ...vi.mocked(usePeriodPageState)(),
      activePeriod: { id: "p1", user_id: "user-1", start_date: "2026-09-01", end_date: null, created_at: "", updated_at: "" },
    });
    vi.mocked(usePatterns).mockReturnValue({
      observations: [
        {
          id: "period_duration_range",
          type: "period_duration_range",
          title: "Period duration",
          statement: "Duration statement.",
          evidence: { periodsConsidered: 3, minDays: 4, maxDays: 5 },
          sufficiency: "sufficient",
          window: { description: "x" },
          generatedAt: "2026-09-01T00:00:00.000Z",
        },
        {
          id: "cramp_peak_day",
          type: "cramp_peak_day",
          title: "Cramps",
          statement: "Cramps have most often been strongest during Day 1.",
          evidence: { periodsConsidered: 3, usablePeriods: 3, days: [1], recurrenceCount: 3 },
          sufficiency: "sufficient",
          window: { description: "x" },
          generatedAt: "2026-09-01T00:00:00.000Z",
        },
      ],
      loading: false,
      error: null,
    });

    render(<Dashboard />);

    expect(screen.getByText("Cramps have most often been strongest during Day 1.")).toBeInTheDocument();
  });
});
