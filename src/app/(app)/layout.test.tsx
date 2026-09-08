import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";

import AppLayout from "./layout";

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

vi.mock("@/components/layout/TopNav", () => ({
  TopNav: () => null,
}));

vi.mock("@/components/layout/MobileHeader", () => ({
  MobileHeader: () => null,
}));

vi.mock("@/components/layout/BottomTabBar", () => ({
  BottomTabBar: () => null,
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

describe("(app) layout onboarding guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ replace } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(usePathname).mockReturnValue("/dashboard");
  });

  it("redirects an unauthenticated visitor to login", async () => {
    setAuth({ session: null, user: null, loading: false });

    render(<AppLayout>content</AppLayout>);

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/auth/login?next=%2Fdashboard"),
    );
  });

  it("redirects an authenticated user with incomplete onboarding to /onboarding", async () => {
    setAuth({
      session,
      user: { ...baseUser, onboardingCompletedAt: null },
      loading: false,
    });

    render(<AppLayout>content</AppLayout>);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/onboarding"));
  });

  it("does not force a completed user into onboarding, and renders the app shell", async () => {
    setAuth({
      session,
      user: { ...baseUser, onboardingCompletedAt: "2026-09-01T00:00:00.000Z" },
      loading: false,
    });

    render(<AppLayout>dashboard content</AppLayout>);

    await screen.findByText("dashboard content");
    expect(replace).not.toHaveBeenCalled();
  });

  it("does not redirect while onboarding status is still unresolved", async () => {
    setAuth({
      session,
      user: { ...baseUser, onboardingCompletedAt: undefined },
      loading: false,
    });

    render(<AppLayout>content</AppLayout>);

    expect(screen.queryByText("content")).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("fails open to the app shell (never onboarding) when the profile load itself failed", async () => {
    setAuth({
      session,
      user: { ...baseUser, onboardingCompletedAt: undefined },
      loading: false,
      profileError: true,
    });

    render(<AppLayout>content</AppLayout>);

    await screen.findByText("content");
    expect(replace).not.toHaveBeenCalledWith("/onboarding");
  });
});

describe("(app) layout tracking capability guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ replace } as unknown as ReturnType<typeof useRouter>);
  });

  const trackedUser = {
    ...baseUser,
    onboardingCompletedAt: "2026-09-01T00:00:00.000Z",
    trackingEnabled: true,
  };
  const partnerOnlyUser = {
    ...baseUser,
    onboardingCompletedAt: "2026-09-01T00:00:00.000Z",
    trackingEnabled: false,
  };

  it("redirects a partner-only account away from /cycle to /dashboard", async () => {
    vi.mocked(usePathname).mockReturnValue("/cycle");
    setAuth({ session, user: partnerOnlyUser, loading: false });

    render(<AppLayout>tracked content</AppLayout>);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
    expect(screen.queryByText("tracked content")).not.toBeInTheDocument();
  });

  it("redirects a partner-only account away from nested tracked routes (/cycle/patterns, /coach)", async () => {
    for (const pathname of ["/cycle/patterns", "/coach"]) {
      vi.clearAllMocks();
      vi.mocked(useRouter).mockReturnValue({ replace } as unknown as ReturnType<typeof useRouter>);
      vi.mocked(usePathname).mockReturnValue(pathname);
      setAuth({ session, user: partnerOnlyUser, loading: false });

      const { unmount } = render(<AppLayout>tracked content</AppLayout>);
      await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
      unmount();
    }
  });

  it("allows a partner-only account to reach /vault/new — Vault has no tracking dependency", async () => {
    vi.mocked(usePathname).mockReturnValue("/vault/new");
    setAuth({ session, user: partnerOnlyUser, loading: false });

    render(<AppLayout>tracked content</AppLayout>);

    await screen.findByText("tracked content");
    expect(replace).not.toHaveBeenCalled();
  });

  it("allows a tracking-enabled account to reach /cycle", async () => {
    vi.mocked(usePathname).mockReturnValue("/cycle");
    setAuth({ session, user: trackedUser, loading: false });

    render(<AppLayout>tracked content</AppLayout>);

    await screen.findByText("tracked content");
    expect(replace).not.toHaveBeenCalled();
  });

  it("does not gate a non-tracked-only route (/dashboard) for a partner-only account", async () => {
    vi.mocked(usePathname).mockReturnValue("/dashboard");
    setAuth({ session, user: partnerOnlyUser, loading: false });

    render(<AppLayout>home content</AppLayout>);

    await screen.findByText("home content");
    expect(replace).not.toHaveBeenCalled();
  });

  it("does not redirect from a tracked-only route while capability status is still unresolved", async () => {
    vi.mocked(usePathname).mockReturnValue("/cycle");
    setAuth({
      session,
      user: { ...baseUser, onboardingCompletedAt: "2026-09-01T00:00:00.000Z", trackingEnabled: undefined },
      loading: false,
    });

    render(<AppLayout>content</AppLayout>);

    expect(screen.queryByText("content")).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("fails open (renders, does not redirect) from a tracked-only route when the profile load itself failed", async () => {
    vi.mocked(usePathname).mockReturnValue("/cycle");
    setAuth({
      session,
      user: { ...baseUser, onboardingCompletedAt: "2026-09-01T00:00:00.000Z", trackingEnabled: undefined },
      loading: false,
      profileError: true,
    });

    render(<AppLayout>content</AppLayout>);

    await screen.findByText("content");
    expect(replace).not.toHaveBeenCalled();
  });
});
