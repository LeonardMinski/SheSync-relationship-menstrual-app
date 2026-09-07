import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PartnerPortal from "./PartnerPortal";
import { usePartnerPortalData } from "@/hooks/usePartnerPortalData";

vi.mock("@/hooks/usePartnerPortalData", () => ({ usePartnerPortalData: vi.fn() }));
vi.mock("@/components/layout/TopNavbar", () => ({ TopNavbar: ({ title }: { title: string }) => <div>{title}</div> }));

const BASE = {
  actionError: null as string | null,
  dataLoading: false,
  invitePartner: vi.fn(),
  loading: false,
  ownerLink: null as unknown,
  ownSharingSummary: [] as string[],
  partnerData: null as unknown,
  refreshing: false,
  refreshPartnerData: vi.fn(),
  respondToIncomingInvite: vi.fn(),
  revokeConnection: vi.fn(),
  user: { id: "user-1" },
  viewerLink: null as unknown,
};

function mockData(overrides: Partial<typeof BASE> = {}) {
  vi.mocked(usePartnerPortalData).mockReturnValue({ ...BASE, ...overrides } as ReturnType<typeof usePartnerPortalData>);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PartnerPortal — surfaces an action failure instead of silently doing nothing", () => {
  it("shows a dismissible error banner in the no-partner state when an action fails", () => {
    mockData({ actionError: "Failed to send invitation" });
    render(<PartnerPortal />);

    expect(screen.getByRole("alert")).toHaveTextContent("Failed to send invitation");
  });

  it("shows no error banner when there is no action error", () => {
    mockData({ actionError: null });
    render(<PartnerPortal />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the error banner in the connected (main) state when revoking fails", () => {
    mockData({
      actionError: "Failed to revoke connection",
      ownerLink: { id: "o1", owner_user_id: "user-1", viewer_user_id: "partner-1", status: "active", created_at: "t0", personName: "Alex", personEmail: "a@example.com" },
      viewerLink: { id: "v1", owner_user_id: "partner-1", viewer_user_id: "user-1", status: "active", created_at: "t0", personName: "Sam", personEmail: "s@example.com" },
      partnerData: {
        partnerName: "Sam",
        privacySettings: { shareWithPartner: true, shareCyclePhase: false, shareMood: false },
        sharingSummary: [],
        recentActivity: [],
      },
    });
    render(<PartnerPortal />);

    expect(screen.getByRole("alert")).toHaveTextContent("Failed to revoke connection");
  });
});
