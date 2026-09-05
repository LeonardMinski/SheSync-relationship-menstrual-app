import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import SignupPage from "./page";

vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

const replace = vi.fn();
const signUp = vi.fn();

const setAuth = (
  overrides: Partial<ReturnType<typeof useAuth>> = {},
) => {
  vi.mocked(useAuth).mockReturnValue({
    user: null,
    session: null,
    loading: false,
    signIn: vi.fn(),
    signUp,
    signOut: vi.fn(),
    requestPasswordReset: vi.fn(),
    updatePassword: vi.fn(),
    refreshUser: vi.fn(),
    ...overrides,
  });
};

describe("SignupPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      replace,
    } as ReturnType<typeof useRouter>);
    setAuth();
  });

  it("does not submit mismatched passwords", async () => {
    render(<SignupPage />);

    await userEvent.type(screen.getByLabelText("Full Name"), "Person");
    await userEvent.type(
      screen.getByLabelText("Email Address"),
      "person@example.com",
    );
    await userEvent.type(screen.getByLabelText("Password"), "password-1");
    await userEvent.type(
      screen.getByLabelText("Confirm Password"),
      "different",
    );
    await userEvent.click(screen.getByLabelText(/I agree to the/i));
    await userEvent.click(
      screen.getByRole("button", { name: "Create Account" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Passwords do not match.",
    );
    expect(signUp).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  async function fillRequiredFields() {
    await userEvent.type(screen.getByLabelText("Full Name"), "Person");
    await userEvent.type(
      screen.getByLabelText("Email Address"),
      "person@example.com",
    );
    await userEvent.type(screen.getByLabelText("Password"), "password-1");
    await userEvent.type(
      screen.getByLabelText("Confirm Password"),
      "password-1",
    );
    await userEvent.click(screen.getByLabelText(/I agree to the/i));
  }

  it("defaults to a tracking-oriented signup", async () => {
    signUp.mockResolvedValue({ success: true, user: null, error: null });
    render(<SignupPage />);

    await fillRequiredFields();
    await userEvent.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() => expect(signUp).toHaveBeenCalledTimes(1));
    expect(signUp).toHaveBeenCalledWith(
      expect.objectContaining({ trackingEnabled: true }),
    );
  });

  it("passes trackingEnabled: false when the visitor chooses the partner-oriented option", async () => {
    signUp.mockResolvedValue({ success: true, user: null, error: null });
    render(<SignupPage />);

    await userEvent.click(
      screen.getByLabelText("I'm here to support a partner"),
    );
    await fillRequiredFields();
    await userEvent.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() => expect(signUp).toHaveBeenCalledTimes(1));
    expect(signUp).toHaveBeenCalledWith(
      expect.objectContaining({ trackingEnabled: false }),
    );
  });

  it("redirects already-authenticated users away from signup", async () => {
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

    render(<SignupPage />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
  });
});
