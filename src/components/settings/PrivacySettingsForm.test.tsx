import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PrivacySettings } from "@/schemas/privacy";
import PrivacySettingsForm from "./PrivacySettingsForm";
import { usePrivacySettingsForm } from "@/hooks/usePrivacySettingsForm";

vi.mock("@/hooks/usePrivacySettingsForm", () => ({
  usePrivacySettingsForm: vi.fn(),
}));

const settings: PrivacySettings = {
  share_with_partner: true,
  share_cycle_phase: false,
  share_mood: false,
  share_fantasy_vault: false,
  share_intimacy_deck: false,
};

const updateSetting = vi.fn();
const resetSettings = vi.fn();

function mockFormState(
  overrides: Partial<ReturnType<typeof usePrivacySettingsForm>> = {},
) {
  vi.mocked(usePrivacySettingsForm).mockReturnValue({
    error: null,
    loading: false,
    resetSettings,
    saving: false,
    settings,
    stealthMode: false,
    success: null,
    updateSetting,
    ...overrides,
  });
}

describe("PrivacySettingsForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFormState();
  });

  it("renders a loading status while privacy settings load", () => {
    mockFormState({ loading: true });

    render(<PrivacySettingsForm />);

    expect(screen.getByLabelText("Loading privacy settings")).toBeInTheDocument();
  });

  it("renders success and error states semantically", () => {
    mockFormState({ success: "Privacy settings updated" });
    const { rerender } = render(<PrivacySettingsForm />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Privacy settings updated",
    );

    mockFormState({ error: "Failed to update privacy settings" });
    rerender(<PrivacySettingsForm />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Failed to update privacy settings",
    );
  });

  it("invokes updateSetting with the changed privacy key and value", async () => {
    render(<PrivacySettingsForm />);

    const checkboxes = screen.getAllByRole("checkbox");
    await userEvent.click(checkboxes[0]);

    expect(updateSetting).toHaveBeenCalledWith("share_cycle_phase", true);
  });

  it("invokes reset when revoke access is clicked", async () => {
    render(<PrivacySettingsForm />);

    await userEvent.click(screen.getByRole("button", { name: /revoke access/i }));

    expect(resetSettings).toHaveBeenCalledOnce();
  });
});
