import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAuth } from "@/context/AuthContext";
import { usePartnerPortalData } from "@/hooks/usePartnerPortalData";

import DashboardPage from "./page";

vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/hooks/usePartnerPortalData", () => ({
  usePartnerPortalData: vi.fn(),
}));

vi.mock("@/components/dashboard/Dashboard", () => ({
  default: () => <div>tracked dashboard</div>,
}));

vi.mock("@/components/partner/PartnerPortal", () => ({
  default: () => <div>partner portal</div>,
}));

vi.mock("@/components/relationship/PartnerHome", () => ({
  PartnerHome: ({ ownerName }: { ownerName: string }) => <div>partner home for {ownerName}</div>,
}));

function setPartnerPortalData(overrides: Partial<ReturnType<typeof usePartnerPortalData>> = {}) {
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
    ...overrides,
  });
}

function setAuth(overrides: Partial<ReturnType<typeof useAuth>>) {
  vi.mocked(useAuth).mockReturnValue({
    user: null,
    session: null,
    loading: false,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    requestPasswordReset: vi.fn(),
    updatePassword: vi.fn(),
    refreshUser: vi.fn(),
    profileError: false,
    ...overrides,
  });
}

describe("DashboardPage (Home) — capability routing", () => {
  it("renders the tracked Dashboard for a tracking-enabled account", () => {
    setAuth({ user: { id: "1", name: "Person", trackingEnabled: true } as never });

    render(<DashboardPage />);

    expect(screen.getByText("tracked dashboard")).toBeInTheDocument();
    expect(screen.queryByText("partner portal")).not.toBeInTheDocument();
  });

  it("renders PartnerPortal for a partner-only account with no active connection yet", () => {
    setAuth({ user: { id: "1", name: "Person", trackingEnabled: false } as never });
    setPartnerPortalData({ viewerLink: null });

    render(<DashboardPage />);

    expect(screen.getByText("partner portal")).toBeInTheDocument();
    expect(screen.queryByText("tracked dashboard")).not.toBeInTheDocument();
  });

  it("renders PartnerHome for a partner-only account with an active connection", () => {
    setAuth({ user: { id: "1", name: "Person", trackingEnabled: false } as never });
    setPartnerPortalData({
      viewerLink: {
        id: "link-1",
        owner_user_id: "owner-1",
        viewer_user_id: "1",
        status: "active",
        created_at: "2026-01-01T00:00:00.000Z",
        personName: "Alex",
        personEmail: "alex@example.com",
      },
    });

    render(<DashboardPage />);

    expect(screen.getByText("partner home for Alex")).toBeInTheDocument();
    expect(screen.queryByText("partner portal")).not.toBeInTheDocument();
    expect(screen.queryByText("tracked dashboard")).not.toBeInTheDocument();
  });

  it("renders the tracked Dashboard (not PartnerPortal) while capability status is still unresolved", () => {
    setAuth({ user: { id: "1", name: "Person", trackingEnabled: undefined } as never });

    render(<DashboardPage />);

    expect(screen.getByText("tracked dashboard")).toBeInTheDocument();
    expect(screen.queryByText("partner portal")).not.toBeInTheDocument();
  });

  it("renders the tracked Dashboard for a dual-role account (tracking-enabled and also a viewer)", () => {
    setAuth({ user: { id: "1", name: "Person", trackingEnabled: true } as never });

    render(<DashboardPage />);

    expect(screen.getByText("tracked dashboard")).toBeInTheDocument();
  });
});
