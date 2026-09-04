import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PartnerConnectSummary } from "./PartnerConnectSummary";
import { usePartnerPortalData } from "@/hooks/usePartnerPortalData";
import type { PartnerLinkWithPerson } from "@/types/partner";

vi.mock("@/hooks/usePartnerPortalData", () => ({
  usePartnerPortalData: vi.fn(),
}));

const mockedUsePartnerPortalData = vi.mocked(usePartnerPortalData);

function link(overrides: Partial<PartnerLinkWithPerson>): PartnerLinkWithPerson {
  return {
    id: "link-1",
    owner_user_id: "owner-1",
    viewer_user_id: "viewer-1",
    status: "pending",
    created_at: "2026-01-01T00:00:00.000Z",
    personName: "Person",
    personEmail: "person@example.com",
    ...overrides,
  };
}

function mockPortalData(
  overrides: Partial<ReturnType<typeof usePartnerPortalData>>,
) {
  mockedUsePartnerPortalData.mockReturnValue({
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

describe("PartnerConnectSummary", () => {
  it("shows 'Not connected' when there is no relationship at all", () => {
    mockPortalData({ ownerLink: null, viewerLink: null });

    render(<PartnerConnectSummary />);

    expect(screen.getByText("No partner connected yet")).toBeInTheDocument();
  });

  it("shows owner pending state", () => {
    mockPortalData({
      ownerLink: link({ status: "pending", personEmail: "invitee@example.com" }),
      viewerLink: null,
    });

    render(<PartnerConnectSummary />);

    expect(screen.getByText("Invitation pending")).toBeInTheDocument();
    expect(
      screen.getByText("Waiting for invitee@example.com to respond."),
    ).toBeInTheDocument();
  });

  it("shows owner active state", () => {
    mockPortalData({
      ownerLink: link({ status: "active" }),
      viewerLink: null,
      ownSharingSummary: [],
    });

    render(<PartnerConnectSummary />);

    expect(screen.getByText("Sharing Active")).toBeInTheDocument();
  });

  it("shows viewer pending state", () => {
    mockPortalData({
      ownerLink: null,
      viewerLink: link({ status: "pending", personName: "Len Minski" }),
    });

    render(<PartnerConnectSummary />);

    expect(screen.getByText("Invitation waiting on you")).toBeInTheDocument();
    expect(
      screen.getByText("Len Minski invited you to connect — review it on the Partner page."),
    ).toBeInTheDocument();
  });

  it("shows 'Connected' — not 'Not connected' — for an active viewer relationship", () => {
    mockPortalData({
      ownerLink: null,
      viewerLink: link({ status: "active", personName: "Len Minski" }),
    });

    render(<PartnerConnectSummary />);

    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(screen.queryByText("Not connected")).not.toBeInTheDocument();
  });

  it("uses the actual viewer link's personName in the active-viewer explanatory copy", () => {
    mockPortalData({
      ownerLink: null,
      viewerLink: link({ status: "active", personName: "Ada Lovelace" }),
    });

    render(<PartnerConnectSummary />);

    expect(
      screen.getByText(/You're connected to Ada Lovelace\./),
    ).toBeInTheDocument();
  });

  it("does not imply sharing is enabled for an active viewer relationship", () => {
    mockPortalData({
      ownerLink: null,
      viewerLink: link({ status: "active", personName: "Len Minski" }),
    });

    render(<PartnerConnectSummary />);

    expect(screen.queryByText(/Sharing Active/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Nothing is currently shared/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(/You're connected to Len Minski\./),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/You'll only see what they choose to share with you\./),
    ).toBeInTheDocument();
  });
});
