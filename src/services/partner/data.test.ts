import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

import { supabase } from "@/lib/supabase/client";

import {
  getPartnerSharedData,
  getPartnerStatus,
  respondToInvite,
  revokePartnerConnection,
  sendPartnerInvite,
} from "./data";

const getSession = supabase.auth.getSession as Mock;
const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockSession() {
  getSession.mockResolvedValue({
    data: { session: { access_token: "token-1" } },
    error: null,
  });
}

function mockFetchOk(data: unknown) {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ success: true, data }),
  });
}

function mockFetchError(message: string) {
  mockFetch.mockResolvedValue({
    ok: false,
    json: async () => ({ error: message }),
  });
}

describe("partner data service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession();
  });

  it("rejects every call when there is no authenticated session", async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null });

    await expect(getPartnerStatus()).rejects.toThrow("Authentication required");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("fetches both directions of partner status", async () => {
    mockFetchOk({ ownerLink: null, viewerLink: null });

    const status = await getPartnerStatus();

    expect(status).toEqual({ ownerLink: null, viewerLink: null });
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/partner",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Authorization: "Bearer token-1" }),
      }),
    );
  });

  it("returns null shared data and link when nothing is returned", async () => {
    mockFetchOk({ sharedData: null, partnerLink: null });

    const result = await getPartnerSharedData();

    expect(result).toEqual({ sharedData: null, partnerLink: null });
  });

  it("sends an invite with the entered email", async () => {
    mockFetchOk({ ownerLink: { id: "link-1" } });

    await sendPartnerInvite("partner@example.com");

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/partner",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ viewerEmail: "partner@example.com" }),
      }),
    );
  });

  it("throws with the server's error message when invite fails", async () => {
    mockFetchError("No SheSync+ account found for that email");

    await expect(sendPartnerInvite("nobody@example.com")).rejects.toThrow(
      "No SheSync+ account found for that email",
    );
  });

  it("responds to an incoming invite with accept or decline", async () => {
    mockFetchOk({ viewerLink: { id: "link-1", status: "active" } });

    await respondToInvite("link-1", "accept");

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/partner",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ linkId: "link-1", action: "accept" }),
      }),
    );
  });

  it("revokes the owner's outgoing connection", async () => {
    mockFetchOk(null);

    await revokePartnerConnection();

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/partner",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
