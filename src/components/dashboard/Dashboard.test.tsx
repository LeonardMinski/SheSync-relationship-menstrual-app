import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Dashboard from "./Dashboard";
import { useAuth } from "@/context/AuthContext";
import { useCycleLogger } from "@/hooks/useCycleLogger";
import { usePartnerPortalData } from "@/hooks/usePartnerPortalData";
import { usePeriodPageState } from "@/hooks/usePeriodPageState";

vi.mock("@/context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("@/hooks/useCycleLogger", () => ({ useCycleLogger: vi.fn() }));
vi.mock("@/hooks/usePartnerPortalData", () => ({ usePartnerPortalData: vi.fn() }));
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

  it("renders What We're Noticing using the same evidence-gated observation as before", () => {
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
