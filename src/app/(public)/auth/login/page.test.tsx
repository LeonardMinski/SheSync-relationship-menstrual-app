import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import LoginPage from "./page";

vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

const replace = vi.fn();
const prefetch = vi.fn();
const signIn = vi.fn();

const setSearch = (query = "") => {
  vi.mocked(useSearchParams).mockReturnValue(
    new URLSearchParams(query) as ReturnType<typeof useSearchParams>,
  );
};

const setAuth = (
  overrides: Partial<ReturnType<typeof useAuth>> = {},
) => {
  vi.mocked(useAuth).mockReturnValue({
    user: null,
    session: null,
    loading: false,
    signIn,
    signUp: vi.fn(),
    signOut: vi.fn(),
    requestPasswordReset: vi.fn(),
    updatePassword: vi.fn(),
    refreshUser: vi.fn(),
    ...overrides,
  });
};

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      replace,
      prefetch,
    } as ReturnType<typeof useRouter>);
    setSearch();
    setAuth();
  });

  it("does not redirect after failed authentication", async () => {
    signIn.mockResolvedValue({
      success: false,
      user: null,
      error: "Incorrect email or password.",
      errorCode: "INVALID_CREDENTIALS",
    });

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText("Email Address"), "bad@test.com");
    await userEvent.type(screen.getByLabelText("Password"), "wrong");
    await userEvent.click(screen.getByRole("button", { name: "Sign In" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Incorrect email or password.",
    );
    expect(replace).not.toHaveBeenCalled();
  });

  it("redirects to a safe next path after successful authentication", async () => {
    setSearch("next=/fantasy");
    signIn.mockResolvedValue({
      success: true,
      user: null,
      error: null,
    });

    render(<LoginPage />);

    await userEvent.type(
      screen.getByLabelText("Email Address"),
      "person@example.com",
    );
    await userEvent.type(screen.getByLabelText("Password"), "password-1");
    await userEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/fantasy"));
  });

  it("rejects unsafe external next redirects", async () => {
    setSearch("next=https://example.com/fantasy");
    signIn.mockResolvedValue({
      success: true,
      user: null,
      error: null,
    });

    render(<LoginPage />);

    await userEvent.type(
      screen.getByLabelText("Email Address"),
      "person@example.com",
    );
    await userEvent.type(screen.getByLabelText("Password"), "password-1");
    await userEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
  });

  it("redirects already-authenticated users away from login", async () => {
    setAuth({
      session: {
        access_token: "token",
        refresh_token: "refresh",
        expires_in: 3600,
        token_type: "bearer",
        user: {
          id: "user-1",
          app_metadata: {},
          user_metadata: {},
          aud: "authenticated",
          created_at: "2026-01-01T00:00:00.000Z",
        },
      },
      user: {
        id: "user-1",
        email: "person@example.com",
        name: "Person",
        subscriptionTier: "free",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        privacySettings: {
          shareWithPartner: false,
          shareCyclePhase: false,
          shareMood: false,
          shareFantasyVault: false,
          shareIntimacyDeck: false,
        },
      },
    });

    render(<LoginPage />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
  });
});
