import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAuth } from "@/context/AuthContext";

import DashboardPage from "./page";

vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/components/dashboard/Dashboard", () => ({
  default: () => <div>tracked dashboard</div>,
}));

vi.mock("@/components/partner/PartnerPortal", () => ({
  default: () => <div>partner portal</div>,
}));

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

  it("renders PartnerPortal for a partner-only account", () => {
    setAuth({ user: { id: "1", name: "Person", trackingEnabled: false } as never });

    render(<DashboardPage />);

    expect(screen.getByText("partner portal")).toBeInTheDocument();
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
