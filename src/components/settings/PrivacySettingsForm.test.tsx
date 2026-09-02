import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PrivacySettings } from "@/schemas/privacy";
import PrivacySettingsForm from "./PrivacySettingsForm";
import { usePrivacySettingsForm } from "@/hooks/usePrivacySettingsForm";
import { usePartnerPortalData } from "@/hooks/usePartnerPortalData";

vi.mock("@/hooks/usePrivacySettingsForm", () => ({
  usePrivacySettingsForm: vi.fn(),
}));

vi.mock("@/hooks/usePartnerPortalData", () => ({
  usePartnerPortalData: vi.fn(),
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
const invitePartner = vi.fn();
const revokeConnection = vi.fn();

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

function mockPartnerState(
  overrides: Partial<ReturnType<typeof usePartnerPortalData>> = {},
) {
  vi.mocked(usePartnerPortalData).mockReturnValue({
    actionError: null,
    dataLoading: false,
    invitePartner,
    loading: false,
    ownerLink: null,
    ownSharingSummary: [],
    partnerData: null,
    refreshing: false,
    refreshPartnerData: vi.fn(),
    respondToIncomingInvite: vi.fn(),
    revokeConnection,
    user: null,
    viewerLink: null,
    ...overrides,
  });
}

describe("PrivacySettingsForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFormState();
    mockPartnerState();
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

  it("invokes reset when 'Reset to private' is clicked", async () => {
    render(<PrivacySettingsForm />);

    await userEvent.click(screen.getByRole("button", { name: /reset to private/i }));

    expect(resetSettings).toHaveBeenCalledOnce();
  });

  it("shows a no-partner state and lets the owner send an invite", () => {
    render(<PrivacySettingsForm />);

    expect(screen.getByText(/no partner connected/i)).toBeInTheDocument();
  });

  it("shows the connected partner and sharing summary when an active owner link exists", () => {
    mockPartnerState({
      ownerLink: {
        id: "link-1",
        owner_user_id: "owner-1",
        viewer_user_id: "viewer-1",
        status: "active",
        created_at: new Date().toISOString(),
        personName: "Jordan",
        personEmail: "jordan@example.com",
      },
      ownSharingSummary: ["Cycle Phase"],
    });

    render(<PrivacySettingsForm />);

    expect(screen.getByText("Jordan")).toBeInTheDocument();
    expect(screen.getByText(/sharing: cycle phase/i)).toBeInTheDocument();
  });
});
