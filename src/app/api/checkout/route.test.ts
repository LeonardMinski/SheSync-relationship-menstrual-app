import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authenticateRequest } from "@/lib/api/authentication";

import { POST } from "./route";

vi.mock("@/lib/api/authentication", () => ({ authenticateRequest: vi.fn() }));

const createMock = vi.fn();
vi.mock("stripe", () => ({
  default: class {
    checkout = { sessions: { create: (...args: unknown[]) => createMock(...args) } };
    static errors = { StripeError: class StripeError extends Error {} };
  },
}));

const authenticateRequestMock = vi.mocked(authenticateRequest);
const CALLER = { id: "user-1", email: "person@example.com", name: "Person" };

function makeRequest(body: unknown, authorized = true) {
  return new NextRequest("http://localhost/api/checkout", {
    method: "POST",
    headers: authorized
      ? { "content-type": "application/json", authorization: "Bearer token" }
      : { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/checkout", () => {
  it("rejects an unauthenticated request", async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null });

    const response = await POST(makeRequest({ priceId: "price_premium" }, false));

    expect(response.status).toBe(401);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("uses the authenticated caller's own id — a client-supplied userId in the body is ignored entirely", async () => {
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: {} as any,
    });
    createMock.mockResolvedValue({ url: "https://checkout.stripe.com/session/1", id: "cs_1" });

    const response = await POST(makeRequest({ priceId: "price_premium", userId: "someone-else" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        client_reference_id: "user-1",
        metadata: expect.objectContaining({ userId: "user-1" }),
      }),
    );
    expect(body.url).toBe("https://checkout.stripe.com/session/1");
  });

  it("rejects a request with no priceId", async () => {
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: {} as any,
    });

    const response = await POST(makeRequest({}));

    expect(response.status).toBe(400);
    expect(createMock).not.toHaveBeenCalled();
  });
});
