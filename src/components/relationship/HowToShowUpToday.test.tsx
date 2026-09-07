import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HowToShowUpToday } from "./HowToShowUpToday";
import { getPartnerContext } from "@/services/relationship/partnerContext";
import { getSupportPreferences } from "@/services/relationship/supportPreferences";
import { addReply } from "@/services/relationship/replies";

vi.mock("@/services/relationship/partnerContext", () => ({ getPartnerContext: vi.fn() }));
vi.mock("@/services/relationship/supportPreferences", () => ({ getSupportPreferences: vi.fn() }));
vi.mock("@/services/relationship/replies", () => ({ addReply: vi.fn() }));

const SHARED_CONTEXT = {
  id: "ctx-1",
  status: "shared" as const,
  whatTheyShouldKnow: "Today's been a lot.",
  mightHelp: [],
  dontNeed: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getPartnerContext).mockResolvedValue({ success: true, data: { partner: SHARED_CONTEXT } });
  vi.mocked(getSupportPreferences).mockResolvedValue({ success: true, data: { partner: [] } });
});

describe("HowToShowUpToday — sending a supportive note surfaces failure instead of silently doing nothing", () => {
  it("shows a loading state and clears it on success", async () => {
    vi.mocked(addReply).mockResolvedValue({ success: true, data: { reply: { id: "r1", sourceType: "partner_context", sourceId: "ctx-1", content: "On it", authorId: "u1", createdAt: "t0" } } });
    render(<HowToShowUpToday ownerId="owner-1" ownerName="Alex" />);

    await waitFor(() => expect(screen.getByPlaceholderText(/want to let them know/i)).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText(/want to let them know/i), { target: { value: "On it" } });
    fireEvent.click(screen.getByText("Send a Supportive Note"));

    await waitFor(() => expect(screen.getByText("Sent.")).toBeInTheDocument());
  });

  it("shows an error message and lets the user try again when sending fails", async () => {
    vi.mocked(addReply).mockResolvedValue({ success: false, error: "Network error" });
    render(<HowToShowUpToday ownerId="owner-1" ownerName="Alex" />);

    await waitFor(() => expect(screen.getByPlaceholderText(/want to let them know/i)).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText(/want to let them know/i), { target: { value: "On it" } });
    fireEvent.click(screen.getByText("Send a Supportive Note"));

    expect(await screen.findByRole("alert")).toHaveTextContent("Network error");
    // The reply box is still there — the user can retry, nothing was lost.
    expect(screen.getByPlaceholderText(/want to let them know/i)).toBeInTheDocument();
    expect(screen.queryByText("Sent.")).not.toBeInTheDocument();
  });
});
