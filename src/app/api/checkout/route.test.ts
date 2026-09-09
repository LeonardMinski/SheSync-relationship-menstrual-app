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

/** No existing Stripe customer on file — the common case. */
function makeSupabaseStub({ existingCustomerId = null }: { existingCustomerId?: string | null } = {}) {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: existingCustomerId ? { stripe_customer_id: existingCustomerId } : null,
    error: null,
  });
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  return { from };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  process.env.STRIPE_PRICE_PREMIUM = "price_premium_test";
  process.env.STRIPE_PRICE_VIP = "price_vip_test";
  process.env.STRIPE_PRICE_LIFETIME = "price_lifetime_test";
});

describe("POST /api/checkout", () => {
  it("rejects an unauthenticated request", async () => {
    authenticateRequestMock.mockResolvedValue({ user: null, supabase: null });

    const response = await POST(makeRequest({ plan: "premium" }, false));

    expect(response.status).toBe(401);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("uses the authenticated caller's own id — a client-supplied userId in the body is ignored entirely", async () => {
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: makeSupabaseStub() as any,
    });
    createMock.mockResolvedValue({ url: "https://checkout.stripe.com/session/1", id: "cs_1" });

    const response = await POST(makeRequest({ plan: "premium", userId: "someone-else" }));
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

  it("UNKNOWN PLAN: rejects a request with no plan", async () => {
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: makeSupabaseStub() as any,
    });

    const response = await POST(makeRequest({}));

    expect(response.status).toBe(400);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("UNKNOWN PLAN: rejects a plan value outside the fixed allow-list — a client cannot supply an arbitrary Stripe Price ID", async () => {
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: makeSupabaseStub() as any,
    });

    const response = await POST(makeRequest({ plan: "price_some_other_stripe_price" }));

    expect(response.status).toBe(400);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("looks up the Price ID server-side from the plan — never trusts a client-supplied price", async () => {
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: makeSupabaseStub() as any,
    });
    createMock.mockResolvedValue({ url: "https://checkout.stripe.com/session/1", id: "cs_1" });

    await POST(makeRequest({ plan: "vip" }));

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "subscription",
        line_items: [{ price: "price_vip_test", quantity: 1 }],
        metadata: expect.objectContaining({ plan: "vip" }),
      }),
    );
  });

  it("LIFETIME: uses Stripe 'payment' mode, not 'subscription'", async () => {
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: makeSupabaseStub() as any,
    });
    createMock.mockResolvedValue({ url: "https://checkout.stripe.com/session/1", id: "cs_1" });

    await POST(makeRequest({ plan: "lifetime" }));

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "payment", line_items: [{ price: "price_lifetime_test", quantity: 1 }] }),
    );
  });

  it("MISSING CONFIGURED PRICE: a recognized plan with no configured Stripe price is a server error, not a 400", async () => {
    delete process.env.STRIPE_PRICE_PREMIUM;
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: makeSupabaseStub() as any,
    });

    const response = await POST(makeRequest({ plan: "premium" }));

    expect(response.status).toBe(500);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("reuses an existing Stripe customer on file rather than letting Stripe mint a new, unlinked one", async () => {
    authenticateRequestMock.mockResolvedValue({
      user: CALLER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: makeSupabaseStub({ existingCustomerId: "cus_existing" }) as any,
    });
    createMock.mockResolvedValue({ url: "https://checkout.stripe.com/session/1", id: "cs_1" });

    await POST(makeRequest({ plan: "premium" }));

    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({ customer: "cus_existing" }));
  });
});
