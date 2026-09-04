import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";

import OnboardingLayout from "./layout";

vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/context/AppContext", () => ({
  AppProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/components/ThemeProvider", () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

const replace = vi.fn();

const baseUser = {
  id: "user-1",
  name: "Person",
  subscriptionTier: "free" as const,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  privacySettings: {
    shareWithPartner: false,
    shareCyclePhase: false,
    shareMood: false,
    shareFantasyVault: false,
    shareIntimacyDeck: false,
  },
};

const session = { access_token: "token" } as unknown as ReturnType<typeof useAuth>["session"];

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
    ...overrides,
  });
}

describe("(onboarding) layout guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ replace } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(usePathname).mockReturnValue("/onboarding");
  });

  it("rejects unauthenticated access and sends the visitor to login", async () => {
    setAuth({ session: null, user: null, loading: false });

    render(<OnboardingLayout>wizard</OnboardingLayout>);

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/auth/login?next=%2Fonboarding"),
    );
  });

  it("renders the onboarding wizard for an authenticated, incomplete user", async () => {
    setAuth({
      session,
      user: { ...baseUser, onboardingCompletedAt: null },
      loading: false,
    });

    render(<OnboardingLayout>wizard</OnboardingLayout>);

    await screen.findByText("wizard");
    expect(replace).not.toHaveBeenCalled();
  });

  it("redirects an already-completed user straight to the dashboard", async () => {
    setAuth({
      session,
      user: { ...baseUser, onboardingCompletedAt: "2026-09-01T00:00:00.000Z" },
      loading: false,
    });

    render(<OnboardingLayout>wizard</OnboardingLayout>);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
  });

  it("does not redirect while onboarding status is still unresolved", async () => {
    setAuth({
      session,
      user: { ...baseUser, onboardingCompletedAt: undefined },
      loading: false,
    });

    render(<OnboardingLayout>wizard</OnboardingLayout>);

    expect(screen.queryByText("wizard")).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("fails open to the wizard (does not force a dashboard redirect) when the profile load itself failed", async () => {
    setAuth({
      session,
      user: { ...baseUser, onboardingCompletedAt: undefined },
      loading: false,
      profileError: true,
    });

    render(<OnboardingLayout>wizard</OnboardingLayout>);

    await screen.findByText("wizard");
    expect(replace).not.toHaveBeenCalledWith("/dashboard");
  });
});
