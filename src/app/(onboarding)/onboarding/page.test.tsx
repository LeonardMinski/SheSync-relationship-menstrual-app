import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import { completeOnboarding } from "@/services/onboarding";

import OnboardingPage from "./page";

vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/services/onboarding", () => ({
  completeOnboarding: vi.fn(),
}));

const replace = vi.fn();
const refreshUser = vi.fn();

async function goToLastStep() {
  await userEvent.click(screen.getByRole("button", { name: "Continue" }));
  await userEvent.click(screen.getByRole("button", { name: "Continue" }));
}

describe("OnboardingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      replace,
    } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useAuth).mockReturnValue({
      refreshUser,
    } as unknown as ReturnType<typeof useAuth>);
  });

  it("does not collect cycle data on step 2, and does not imply anything is being saved", async () => {
    render(<OnboardingPage />);

    await userEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByText("Your cycle, your pace")).toBeInTheDocument();
    expect(screen.queryByLabelText(/last period start date/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/usual cycle length/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/save/i)).not.toBeInTheDocument();
  });

  it("persists completion, refreshes auth state, and navigates to the dashboard on success", async () => {
    vi.mocked(completeOnboarding).mockResolvedValue({
      success: true,
      onboardingCompletedAt: "2026-09-03T00:00:00.000Z",
    });

    render(<OnboardingPage />);
    await goToLastStep();

    await userEvent.click(screen.getByRole("button", { name: "Start using SheSync+" }));

    await waitFor(() => expect(completeOnboarding).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(refreshUser).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
  });

  it("stays on onboarding and shows an accessible error when persistence fails", async () => {
    vi.mocked(completeOnboarding).mockResolvedValue({
      success: false,
      error: "We couldn't save that. Please try again.",
    });

    render(<OnboardingPage />);
    await goToLastStep();

    await userEvent.click(screen.getByRole("button", { name: "Start using SheSync+" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn't save that. Please try again.",
    );
    expect(refreshUser).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Start using SheSync+" }),
    ).toBeInTheDocument();
  });

  it("disables the completion button while a submission is in flight to prevent double submit", async () => {
    let resolveCompletion: (value: Awaited<ReturnType<typeof completeOnboarding>>) => void = () => {};
    vi.mocked(completeOnboarding).mockReturnValue(
      new Promise((resolve) => {
        resolveCompletion = resolve;
      }),
    );

    render(<OnboardingPage />);
    await goToLastStep();

    const completeButton = screen.getByRole("button", { name: "Start using SheSync+" });
    await userEvent.click(completeButton);

    expect(await screen.findByRole("button", { name: "Setting up..." })).toBeDisabled();
    expect(completeOnboarding).toHaveBeenCalledTimes(1);

    resolveCompletion({
      success: true,
      onboardingCompletedAt: "2026-09-03T00:00:00.000Z",
    });
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
  });
});
