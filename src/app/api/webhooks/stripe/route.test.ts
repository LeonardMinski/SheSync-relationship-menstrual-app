import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

process.env.STRIPE_PRICE_PREMIUM = "price_premium_test";
process.env.STRIPE_PRICE_VIP = "price_vip_test";
process.env.STRIPE_PRICE_LIFETIME = "price_lifetime_test";

const constructEventMock = vi.fn();
const retrieveSubscriptionMock = vi.fn();
vi.mock("stripe", () => ({
  default: class {
    static errors = { StripeError: class StripeError extends Error {} };
    webhooks = { constructEvent: (...args: unknown[]) => constructEventMock(...args) };
    subscriptions = { retrieve: (...args: unknown[]) => retrieveSubscriptionMock(...args) };
  },
}));

import { createServiceSupabaseClient } from "@/lib/supabase/service";
vi.mock("@/lib/supabase/service", () => ({
  createServiceSupabaseClient: vi.fn(),
}));
const createServiceSupabaseClientMock = vi.mocked(createServiceSupabaseClient);

import { POST } from "./route";

function makeRequest(body: string, signature = "valid-signature") {
  return new NextRequest("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers: signature ? { "stripe-signature": signature } : {},
    body,
  });
}

/**
 * A chainable + directly-awaitable node: every method returns itself (so
 * `.eq().eq().lt().select()` chains regardless of which are called or in
 * what order), and `await`ing it at any point resolves to `result` via
 * `.then`. Models a Supabase PostgrestFilterBuilder closely enough for
 * these tests without a real client.
 */
function chainNode(result: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const node: any = {};
  node.eq = vi.fn(() => node);
  node.lt = vi.fn(() => node);
  node.select = vi.fn(() => node);
  node.maybeSingle = vi.fn().mockResolvedValue(result);
  node.then = (resolve: (v: unknown) => void) => resolve(result);
  return node;
}

interface SupabaseMockOptions {
  insertEventResult?: { error: { code?: string; message?: string } | null };
  /** Response to the claim-conflict read: stripe_webhook_events.select('status, started_at').eq(...).maybeSingle() */
  ledgerSelectResult?: { data: { status: string; started_at: string } | null; error: unknown };
  /** Response to a reclaim attempt: update({status:'processing',started_at,claim_token}).eq(...).eq(...)[.lt(...)].select('event_id') */
  ledgerReclaimResult?: { data: unknown[] | null; error: unknown };
  /**
   * Response to markProcessed/markFailed's compare-and-swap:
   * update({status:'processed'|'failed',...}).eq('event_id',id).eq('claim_token',token).select('event_id').
   * An empty `data` array models "lost ownership" — a later attempt's
   * reclaim already replaced claim_token, so this CAS matches 0 rows.
   */
  ledgerFinalizeResult?: { data: unknown[] | null; error: unknown };
  /** Response to fetchExistingByCustomerId: subscriptions.select(...).eq('stripe_customer_id',...).maybeSingle() */
  selectSubscriptionResult?: { data: unknown; error: unknown };
  upsertResult?: { error: unknown };
  updateUsersResult?: { error: unknown };
}

function makeSupabaseMock(options: SupabaseMockOptions = {}) {
  const insertEvents = vi.fn().mockResolvedValue(options.insertEventResult ?? { error: null });

  const ledgerSelectResult = options.ledgerSelectResult ?? { data: null, error: null };
  const selectEvents = vi.fn(() => chainNode(ledgerSelectResult));

  const reclaimResult = options.ledgerReclaimResult ?? { data: [{ event_id: "evt_1" }], error: null };
  const finalizeResult = options.ledgerFinalizeResult ?? { data: [{ event_id: "evt_1" }], error: null };
  const updateEvents = vi.fn((patch: Record<string, unknown>) =>
    patch.status === "processing" ? chainNode(reclaimResult) : chainNode(finalizeResult),
  );

  const maybeSingle = vi.fn().mockResolvedValue(options.selectSubscriptionResult ?? { data: null, error: null });
  const eqForSelect = vi.fn().mockReturnValue({ maybeSingle });
  const selectSubscriptions = vi.fn().mockReturnValue({ eq: eqForSelect });

  const upsert = vi.fn().mockResolvedValue(options.upsertResult ?? { error: null });

  const eqForUsersUpdate = vi.fn().mockResolvedValue(options.updateUsersResult ?? { error: null });
  const updateUsers = vi.fn().mockReturnValue({ eq: eqForUsersUpdate });

  const from = vi.fn((table: string) => {
    if (table === "stripe_webhook_events") return { insert: insertEvents, select: selectEvents, update: updateEvents };
    if (table === "subscriptions") return { select: selectSubscriptions, upsert };
    if (table === "users") return { update: updateUsers };
    throw new Error(`unexpected table: ${table}`);
  });

  return {
    from,
    insertEvents,
    selectEvents,
    updateEvents,
    selectSubscriptions,
    eqForSelect,
    maybeSingle,
    upsert,
    updateUsers,
    eqForUsersUpdate,
  };
}

/**
 * Stateful variant that actually persists what upsert()/ledger update()
 * write, so a sequence of POST calls sees each other's effects — needed to
 * prove the grace-period recovery → second past_due behavior, and that two
 * equal-second events are each genuinely reconciled, which span multiple
 * independent webhook deliveries.
 */
function makeStatefulSupabaseMock(initialRow: Record<string, unknown> | null) {
  let currentRow = initialRow;
  let eventCounter = 0;

  const insertEvents = vi.fn().mockImplementation(() => {
    eventCounter += 1;
    return Promise.resolve({ error: null });
  });
  const selectEvents = vi.fn(() => chainNode({ data: null, error: null }));
  const updateEvents = vi.fn(() => chainNode({ data: [{ event_id: "evt" }], error: null }));

  const maybeSingle = vi.fn().mockImplementation(() => Promise.resolve({ data: currentRow, error: null }));
  const eqForSelect = vi.fn().mockReturnValue({ maybeSingle });
  const selectSubscriptions = vi.fn().mockReturnValue({ eq: eqForSelect });

  const upsert = vi.fn().mockImplementation((payload: Record<string, unknown>) => {
    currentRow = { ...currentRow, ...payload };
    return Promise.resolve({ error: null });
  });

  const eqForUsersUpdate = vi.fn().mockResolvedValue({ error: null });
  const updateUsers = vi.fn().mockReturnValue({ eq: eqForUsersUpdate });

  const from = vi.fn((table: string) => {
    if (table === "stripe_webhook_events") return { insert: insertEvents, select: selectEvents, update: updateEvents };
    if (table === "subscriptions") return { select: selectSubscriptions, upsert };
    if (table === "users") return { update: updateUsers };
    throw new Error(`unexpected table: ${table}`);
  });

  return {
    from,
    upsert,
    getCurrentRow: () => currentRow,
    get eventCount() {
      return eventCounter;
    },
  };
}

function stripeEvent(overrides: { id?: string; type: string; created?: number; object: unknown }) {
  return {
    id: overrides.id ?? "evt_1",
    type: overrides.type,
    created: overrides.created ?? 1_750_000_000,
    data: { object: overrides.object },
  };
}

/** A fake Stripe.Subscription as returned by stripe.subscriptions.retrieve — the ONLY source of truth reconcileSubscriptionFromStripe writes from. */
function fakeStripeSubscription(overrides: {
  id?: string;
  customer?: string;
  status?: string;
  cancelAtPeriodEnd?: boolean;
  priceId?: string;
  currentPeriodEnd?: number;
}) {
  return {
    id: overrides.id ?? "sub_1",
    customer: overrides.customer ?? "cus_1",
    status: overrides.status ?? "active",
    cancel_at_period_end: overrides.cancelAtPeriodEnd ?? false,
    items: {
      data: [
        {
          price: { id: overrides.priceId ?? "price_premium_test" },
          current_period_end: overrides.currentPeriodEnd ?? 1_750_100_100,
        },
      ],
    },
  };
}

describe("POST /api/webhooks/stripe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("FORGED WEBHOOK: rejects a request with an invalid signature before touching the database", async () => {
    constructEventMock.mockImplementation(() => {
      throw new Error("signature mismatch");
    });
    const supabase = makeSupabaseMock();
    createServiceSupabaseClientMock.mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase as any,
    );

    const response = await POST(makeRequest("{}"));

    expect(response.status).toBe(400);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("rejects a request missing the stripe-signature header entirely", async () => {
    const response = await POST(makeRequest("{}", ""));
    expect(response.status).toBe(400);
    expect(constructEventMock).not.toHaveBeenCalled();
  });

  it("checkout.session.completed (subscription mode) reconciles to Stripe's CURRENT subscription state and syncs users.subscription_tier", async () => {
    const event = stripeEvent({
      type: "checkout.session.completed",
      object: {
        id: "cs_1",
        mode: "subscription",
        client_reference_id: "user-1",
        customer: "cus_1",
        subscription: "sub_1",
        metadata: { plan: "premium" },
      },
    });
    constructEventMock.mockReturnValue(event);
    retrieveSubscriptionMock.mockResolvedValue(fakeStripeSubscription({ status: "active" }));
    const supabase = makeSupabaseMock({ selectSubscriptionResult: { data: null, error: null } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createServiceSupabaseClientMock.mockReturnValue(supabase as any);

    const response = await POST(makeRequest("{}"));

    expect(response.status).toBe(200);
    expect(retrieveSubscriptionMock).toHaveBeenCalledWith("sub_1");
    expect(supabase.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        stripe_customer_id: "cus_1",
        stripe_subscription_id: "sub_1",
        stripe_checkout_session_id: "cs_1",
        plan: "premium",
        billing_type: "recurring",
        status: "active",
      }),
      { onConflict: "user_id" },
    );
    expect(supabase.updateUsers).toHaveBeenCalledWith({ subscription_tier: "premium" });
    expect(supabase.eqForUsersUpdate).toHaveBeenCalledWith("id", "user-1");
    expect(supabase.updateEvents).toHaveBeenCalledWith(
      expect.objectContaining({ status: "processed", processed_at: expect.any(String) }),
    );
  });

  it("LIFETIME: checkout.session.completed (payment mode) creates a lifetime row with no stripe_subscription_id, and never calls Stripe's subscription API", async () => {
    const event = stripeEvent({
      type: "checkout.session.completed",
      object: {
        id: "cs_2",
        mode: "payment",
        client_reference_id: "user-1",
        customer: "cus_1",
        payment_intent: "pi_1",
        metadata: { plan: "lifetime" },
      },
    });
    constructEventMock.mockReturnValue(event);
    const supabase = makeSupabaseMock();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createServiceSupabaseClientMock.mockReturnValue(supabase as any);

    const response = await POST(makeRequest("{}"));

    expect(response.status).toBe(200);
    expect(retrieveSubscriptionMock).not.toHaveBeenCalled();
    expect(supabase.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        billing_type: "lifetime",
        plan: "lifetime",
        status: "active",
        stripe_subscription_id: null,
        stripe_payment_intent_id: "pi_1",
      }),
      { onConflict: "user_id" },
    );
    expect(supabase.updateUsers).toHaveBeenCalledWith({ subscription_tier: "lifetime" });
  });

  it("PAST_DUE: customer.subscription.updated transitioning into past_due sets a 7-day grace period, anchored on the event's created time", async () => {
    const eventCreated = 1_750_100_000;
    const event = stripeEvent({
      type: "customer.subscription.updated",
      created: eventCreated,
      // The event's own payload is deliberately minimal — reconciliation
      // never reads status/price/period from it, only customer + id.
      object: { id: "sub_1", customer: "cus_1" },
    });
    constructEventMock.mockReturnValue(event);
    retrieveSubscriptionMock.mockResolvedValue(
      fakeStripeSubscription({ status: "past_due", currentPeriodEnd: eventCreated + 100 }),
    );
    const supabase = makeSupabaseMock({
      selectSubscriptionResult: {
        data: {
          user_id: "user-1",
          status: "active",
          plan: "premium",
          stripe_checkout_session_id: "cs_1",
          stripe_payment_intent_id: null,
          stripe_price_id: "price_premium_test",
          current_period_end: null,
          grace_period_ends_at: null,
        },
        error: null,
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createServiceSupabaseClientMock.mockReturnValue(supabase as any);

    const response = await POST(makeRequest("{}"));

    expect(response.status).toBe(200);
    const upsertPayload = supabase.upsert.mock.calls[0][0] as { status: string; grace_period_ends_at: string };
    expect(upsertPayload.status).toBe("past_due");
    const graceEndsAt = new Date(upsertPayload.grace_period_ends_at).getTime();
    const eventCreatedMs = eventCreated * 1000;
    expect(graceEndsAt - eventCreatedMs).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("OLDER EVENT AFTER NEWER STATE: reconciles to Stripe's CURRENT retrieved state, never to the stale event's own embedded fields", async () => {
    const event = stripeEvent({
      type: "customer.subscription.updated",
      created: 1_700_000_000, // an old, delayed/retried delivery
      object: {
        id: "sub_1",
        customer: "cus_1",
        // This event's OWN payload claims 'active' — if that were ever
        // trusted, it would regress the row. It must be ignored entirely
        // in favor of a fresh retrieve.
        status: "active",
        items: { data: [{ price: { id: "price_premium_test" }, current_period_end: 1_700_000_100 }] },
      },
    });
    constructEventMock.mockReturnValue(event);
    // Stripe's CURRENT truth, fetched fresh regardless of the stale event above.
    retrieveSubscriptionMock.mockResolvedValue(
      fakeStripeSubscription({ status: "past_due", currentPeriodEnd: 1_750_200_000 }),
    );
    const supabase = makeSupabaseMock({
      selectSubscriptionResult: {
        data: {
          user_id: "user-1",
          status: "past_due",
          plan: "premium",
          stripe_checkout_session_id: "cs_1",
          stripe_payment_intent_id: null,
          stripe_price_id: "price_premium_test",
          current_period_end: null,
          grace_period_ends_at: "2026-01-01T00:00:00.000Z",
        },
        error: null,
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createServiceSupabaseClientMock.mockReturnValue(supabase as any);

    const response = await POST(makeRequest("{}"));

    expect(response.status).toBe(200);
    expect(retrieveSubscriptionMock).toHaveBeenCalledWith("sub_1");
    expect(supabase.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "past_due", // from retrieve, NOT the stale event's "active"
        grace_period_ends_at: "2026-01-01T00:00:00.000Z", // preserved, not reset
      }),
      { onConflict: "user_id" },
    );
  });

  it("EQUAL-SECOND DISTINCT EVENTS: two events sharing the same created second are both independently reconciled, neither silently skipped", async () => {
    const supabase = makeStatefulSupabaseMock({
      user_id: "user-1",
      status: "active",
      plan: "premium",
      stripe_checkout_session_id: "cs_1",
      stripe_payment_intent_id: null,
      stripe_price_id: "price_premium_test",
      current_period_end: null,
      grace_period_ends_at: null,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createServiceSupabaseClientMock.mockReturnValue(supabase as any);

    const sameSecond = 1_750_300_000;
    const eventA = stripeEvent({ id: "evt_a", type: "customer.subscription.updated", created: sameSecond, object: { id: "sub_1", customer: "cus_1" } });
    const eventB = stripeEvent({ id: "evt_b", type: "customer.subscription.updated", created: sameSecond, object: { id: "sub_1", customer: "cus_1" } });

    constructEventMock.mockReturnValueOnce(eventA);
    retrieveSubscriptionMock.mockResolvedValueOnce(fakeStripeSubscription({ status: "past_due" }));
    const responseA = await POST(makeRequest("{}"));
    expect(responseA.status).toBe(200);

    constructEventMock.mockReturnValueOnce(eventB);
    retrieveSubscriptionMock.mockResolvedValueOnce(fakeStripeSubscription({ status: "canceled" }));
    const responseB = await POST(makeRequest("{}"));
    expect(responseB.status).toBe(200);

    // Both distinct deliveries were actually reconciled — neither dropped
    // as "stale" merely for sharing a timestamp with the other.
    expect(retrieveSubscriptionMock).toHaveBeenCalledTimes(2);
    expect(supabase.getCurrentRow()?.status).toBe("canceled");
  });

  it("CHECKOUT CANNOT REGRESS: an older/equal-second checkout.session.completed reconciles to Stripe's current state rather than overwriting with hardcoded 'just completed' defaults", async () => {
    const event = stripeEvent({
      type: "checkout.session.completed",
      created: 1_700_000_000,
      object: {
        id: "cs_1",
        mode: "subscription",
        client_reference_id: "user-1",
        customer: "cus_1",
        subscription: "sub_1",
        metadata: { plan: "premium" },
      },
    });
    constructEventMock.mockReturnValue(event);
    // Stripe's CURRENT truth already reflects a later lifecycle
    // transition (e.g. a customer.subscription.updated already advanced
    // this to past_due). Checkout must write exactly this, never its own
    // historical "just completed, must be active/no-grace" assumption.
    retrieveSubscriptionMock.mockResolvedValue(fakeStripeSubscription({ status: "past_due" }));
    const supabase = makeSupabaseMock({
      selectSubscriptionResult: {
        data: {
          user_id: "user-1",
          status: "past_due",
          plan: "premium",
          stripe_checkout_session_id: "cs_1",
          stripe_payment_intent_id: null,
          stripe_price_id: "price_premium_test",
          current_period_end: null,
          grace_period_ends_at: "2026-01-01T00:00:00.000Z",
        },
        error: null,
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createServiceSupabaseClientMock.mockReturnValue(supabase as any);

    const response = await POST(makeRequest("{}"));

    expect(response.status).toBe(200);
    expect(supabase.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: "past_due", grace_period_ends_at: "2026-01-01T00:00:00.000Z" }),
      { onConflict: "user_id" },
    );
  });

  it("CANCELED: customer.subscription.deleted reconciles to Stripe's current (canceled) state via the same retrieve path as any other lifecycle event", async () => {
    const event = stripeEvent({
      type: "customer.subscription.deleted",
      created: 1_750_100_000,
      object: { id: "sub_1", customer: "cus_1" },
    });
    constructEventMock.mockReturnValue(event);
    retrieveSubscriptionMock.mockResolvedValue(
      fakeStripeSubscription({ status: "canceled", cancelAtPeriodEnd: false, currentPeriodEnd: 1_750_200_000 }),
    );
    const supabase = makeSupabaseMock({
      selectSubscriptionResult: {
        data: {
          user_id: "user-1",
          status: "active",
          plan: "premium",
          stripe_checkout_session_id: "cs_1",
          stripe_payment_intent_id: null,
          stripe_price_id: "price_premium_test",
          current_period_end: null,
          grace_period_ends_at: null,
        },
        error: null,
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createServiceSupabaseClientMock.mockReturnValue(supabase as any);

    const response = await POST(makeRequest("{}"));

    expect(response.status).toBe(200);
    expect(retrieveSubscriptionMock).toHaveBeenCalledWith("sub_1");
    expect(supabase.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: "canceled", cancel_at_period_end: false }),
      { onConflict: "user_id" },
    );
    expect(supabase.updateUsers).toHaveBeenCalledWith({ subscription_tier: "free" });
  });

  it("GRACE RECOVERY: does not reset the grace window on repeated past_due, clears it on recovery, and starts a fresh one on a later past_due", async () => {
    const supabase = makeStatefulSupabaseMock({
      user_id: "user-1",
      status: "active",
      plan: "premium",
      stripe_checkout_session_id: "cs_1",
      stripe_payment_intent_id: null,
      stripe_price_id: "price_premium_test",
      current_period_end: null,
      grace_period_ends_at: null,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createServiceSupabaseClientMock.mockReturnValue(supabase as any);

    function subscriptionUpdated(id: string, created: number) {
      return stripeEvent({
        id,
        type: "customer.subscription.updated",
        created,
        object: { id: "sub_1", customer: "cus_1" },
      });
    }

    // 1) First transition into past_due — starts a 7-day grace window.
    const t1 = 1_750_000_000;
    constructEventMock.mockReturnValueOnce(subscriptionUpdated("evt_1", t1));
    retrieveSubscriptionMock.mockResolvedValueOnce(fakeStripeSubscription({ status: "past_due", currentPeriodEnd: t1 + 1000 }));
    await POST(makeRequest("{}"));
    const firstGrace = supabase.getCurrentRow()?.grace_period_ends_at as string;
    expect(new Date(firstGrace).getTime() - t1 * 1000).toBe(7 * 24 * 60 * 60 * 1000);

    // 2) A second past_due update (e.g. a retried/related event) must not
    //    push the deadline back out.
    const t2 = t1 + 1000;
    constructEventMock.mockReturnValueOnce(subscriptionUpdated("evt_2", t2));
    retrieveSubscriptionMock.mockResolvedValueOnce(fakeStripeSubscription({ status: "past_due", currentPeriodEnd: t2 + 1000 }));
    await POST(makeRequest("{}"));
    expect(supabase.getCurrentRow()?.grace_period_ends_at).toBe(firstGrace);

    // 3) Recovery clears the grace period entirely.
    const t3 = t2 + 1000;
    constructEventMock.mockReturnValueOnce(subscriptionUpdated("evt_3", t3));
    retrieveSubscriptionMock.mockResolvedValueOnce(fakeStripeSubscription({ status: "active", currentPeriodEnd: t3 + 1000 }));
    await POST(makeRequest("{}"));
    expect(supabase.getCurrentRow()?.grace_period_ends_at).toBeNull();
    expect(supabase.getCurrentRow()?.status).toBe("active");

    // 4) A later, independent past_due transition starts a NEW 7-day
    //    window — not a reuse of the first one.
    const t4 = t3 + 1000;
    constructEventMock.mockReturnValueOnce(subscriptionUpdated("evt_4", t4));
    retrieveSubscriptionMock.mockResolvedValueOnce(fakeStripeSubscription({ status: "past_due", currentPeriodEnd: t4 + 1000 }));
    await POST(makeRequest("{}"));
    const secondGrace = supabase.getCurrentRow()?.grace_period_ends_at as string;
    expect(new Date(secondGrace).getTime() - t4 * 1000).toBe(7 * 24 * 60 * 60 * 1000);
    expect(secondGrace).not.toBe(firstGrace);
  });

  describe("ledger claim/retry/duplicate/ownership semantics", () => {
    it("FAIL AFTER LEDGER CLAIM: a processing failure is marked failed and returns non-2xx, and a retry of that same event can then succeed", async () => {
      const event = stripeEvent({
        type: "checkout.session.completed",
        object: {
          id: "cs_1",
          mode: "subscription",
          client_reference_id: "user-1",
          customer: "cus_1",
          subscription: "sub_1",
          metadata: { plan: "premium" },
        },
      });
      retrieveSubscriptionMock.mockResolvedValue(fakeStripeSubscription({ status: "active" }));

      // --- First delivery: claims cleanly, but the billing mutation itself fails. ---
      constructEventMock.mockReturnValueOnce(event);
      const failingSupabase = makeSupabaseMock({ upsertResult: { error: { message: "connection reset" } } });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createServiceSupabaseClientMock.mockReturnValueOnce(failingSupabase as any);

      const firstResponse = await POST(makeRequest("{}"));

      expect(firstResponse.status).toBe(500);
      expect(failingSupabase.updateUsers).not.toHaveBeenCalled();
      expect(failingSupabase.updateEvents).toHaveBeenCalledWith(expect.objectContaining({ status: "failed" }));

      // --- Stripe retries the exact same event_id. The ledger row is now
      //     'failed', so this delivery reclaims it (under a brand-new
      //     claim_token) and processing succeeds. ---
      constructEventMock.mockReturnValueOnce(event);
      const retrySupabase = makeSupabaseMock({
        insertEventResult: { error: { code: "23505" } },
        ledgerSelectResult: { data: { status: "failed", started_at: "2026-01-01T00:00:00.000Z" }, error: null },
        ledgerReclaimResult: { data: [{ event_id: "evt_1" }], error: null },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createServiceSupabaseClientMock.mockReturnValueOnce(retrySupabase as any);

      const retryResponse = await POST(makeRequest("{}"));

      expect(retryResponse.status).toBe(200);
      expect(retrySupabase.upsert).toHaveBeenCalled();
      expect(retrySupabase.updateEvents).toHaveBeenCalledWith(
        expect.objectContaining({ status: "processed" }),
      );
    });

    it("PROCESSED DUPLICATE: retrying an event already marked processed short-circuits with 200 and applies no mutation", async () => {
      const event = stripeEvent({
        type: "checkout.session.completed",
        object: { id: "cs_1", mode: "subscription", client_reference_id: "user-1", customer: "cus_1", metadata: { plan: "premium" } },
      });
      constructEventMock.mockReturnValue(event);
      const supabase = makeSupabaseMock({
        insertEventResult: { error: { code: "23505" } },
        ledgerSelectResult: { data: { status: "processed", started_at: "2026-01-01T00:00:00.000Z" }, error: null },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createServiceSupabaseClientMock.mockReturnValue(supabase as any);

      const response = await POST(makeRequest("{}"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.duplicate).toBe(true);
      expect(retrieveSubscriptionMock).not.toHaveBeenCalled();
      expect(supabase.upsert).not.toHaveBeenCalled();
      // Already terminal — must not even attempt a reclaim update.
      expect(supabase.updateEvents).not.toHaveBeenCalled();
    });

    it("CONCURRENT DUPLICATE: a second delivery arriving while the first is still actively processing does not double-mutate", async () => {
      const event = stripeEvent({
        type: "checkout.session.completed",
        object: { id: "cs_1", mode: "subscription", client_reference_id: "user-1", customer: "cus_1", metadata: { plan: "premium" } },
      });
      constructEventMock.mockReturnValue(event);
      const supabase = makeSupabaseMock({
        insertEventResult: { error: { code: "23505" } },
        // started_at seconds ago — well inside the "still plausibly
        // in-flight" window, not an abandoned claim.
        ledgerSelectResult: { data: { status: "processing", started_at: new Date(Date.now() - 2_000).toISOString() }, error: null },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createServiceSupabaseClientMock.mockReturnValue(supabase as any);

      const response = await POST(makeRequest("{}"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.duplicate).toBe(true);
      expect(retrieveSubscriptionMock).not.toHaveBeenCalled();
      expect(supabase.upsert).not.toHaveBeenCalled();
      // Must not attempt to reclaim a claim that's still plausibly live.
      expect(supabase.updateEvents).not.toHaveBeenCalled();
    });

    it("ORPHANED CLAIM: a 'processing' row whose claim is far older than the staleness window is reclaimed (under a new claim_token) and processed", async () => {
      const event = stripeEvent({
        type: "checkout.session.completed",
        object: { id: "cs_1", mode: "subscription", client_reference_id: "user-1", customer: "cus_1", subscription: "sub_1", metadata: { plan: "premium" } },
      });
      constructEventMock.mockReturnValue(event);
      retrieveSubscriptionMock.mockResolvedValue(fakeStripeSubscription({ status: "active" }));
      const supabase = makeSupabaseMock({
        insertEventResult: { error: { code: "23505" } },
        // started_at far in the past — the request that claimed this
        // almost certainly crashed before finalizing.
        ledgerSelectResult: { data: { status: "processing", started_at: new Date(Date.now() - 10 * 60_000).toISOString() }, error: null },
        ledgerReclaimResult: { data: [{ event_id: "evt_1" }], error: null },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createServiceSupabaseClientMock.mockReturnValue(supabase as any);

      const response = await POST(makeRequest("{}"));

      expect(response.status).toBe(200);
      expect(supabase.upsert).toHaveBeenCalled();
      expect(supabase.updateEvents).toHaveBeenCalledWith(expect.objectContaining({ status: "processed" }));
    });

    it("LOST RECLAIM RACE: if a concurrent request wins the reclaim first, this request backs off instead of double-processing", async () => {
      const event = stripeEvent({
        type: "checkout.session.completed",
        object: { id: "cs_1", mode: "subscription", client_reference_id: "user-1", customer: "cus_1", metadata: { plan: "premium" } },
      });
      constructEventMock.mockReturnValue(event);
      const supabase = makeSupabaseMock({
        insertEventResult: { error: { code: "23505" } },
        ledgerSelectResult: { data: { status: "failed", started_at: "2026-01-01T00:00:00.000Z" }, error: null },
        // The compare-and-swap reclaim affected 0 rows — someone else
        // already reclaimed it between our select and our update.
        ledgerReclaimResult: { data: [], error: null },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createServiceSupabaseClientMock.mockReturnValue(supabase as any);

      const response = await POST(makeRequest("{}"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.duplicate).toBe(true);
      expect(retrieveSubscriptionMock).not.toHaveBeenCalled();
      expect(supabase.upsert).not.toHaveBeenCalled();
    });

    it("CURRENT OWNER CAN MARK PROCESSED: finalizes using the exact claim_token this request itself was issued", async () => {
      const event = stripeEvent({
        type: "checkout.session.completed",
        object: { id: "cs_1", mode: "subscription", client_reference_id: "user-1", customer: "cus_1", subscription: "sub_1", metadata: { plan: "premium" } },
      });
      constructEventMock.mockReturnValue(event);
      retrieveSubscriptionMock.mockResolvedValue(fakeStripeSubscription({ status: "active" }));
      const supabase = makeSupabaseMock();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createServiceSupabaseClientMock.mockReturnValue(supabase as any);

      const response = await POST(makeRequest("{}"));

      expect(response.status).toBe(200);
      const claimedToken = supabase.insertEvents.mock.calls[0][0].claim_token;
      expect(typeof claimedToken).toBe("string");
      expect(claimedToken.length).toBeGreaterThan(0);

      // The finalize call's compare-and-swap must target THIS request's
      // own claim_token, not merely the event_id.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const finalizeNode = supabase.updateEvents.mock.results.at(-1)?.value as any;
      const eqCalls = finalizeNode.eq.mock.calls;
      expect(eqCalls).toEqual(
        expect.arrayContaining([
          ["event_id", "evt_1"],
          ["claim_token", claimedToken],
        ]),
      );
    });

    it("CURRENT OWNER CAN MARK FAILED: finalizes the failure using the exact claim_token this request itself was issued", async () => {
      const event = stripeEvent({
        type: "checkout.session.completed",
        object: { id: "cs_1", mode: "subscription", client_reference_id: "user-1", customer: "cus_1", subscription: "sub_1", metadata: { plan: "premium" } },
      });
      constructEventMock.mockReturnValue(event);
      retrieveSubscriptionMock.mockResolvedValue(fakeStripeSubscription({ status: "active" }));
      const supabase = makeSupabaseMock({ upsertResult: { error: { message: "connection reset" } } });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createServiceSupabaseClientMock.mockReturnValue(supabase as any);

      const response = await POST(makeRequest("{}"));

      expect(response.status).toBe(500);
      const claimedToken = supabase.insertEvents.mock.calls[0][0].claim_token;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const finalizeNode = supabase.updateEvents.mock.results.at(-1)?.value as any;
      const eqCalls = finalizeNode.eq.mock.calls;
      expect(eqCalls).toEqual(
        expect.arrayContaining([
          ["event_id", "evt_1"],
          ["claim_token", claimedToken],
        ]),
      );
    });

    it("STALE OWNER CANNOT MARK PROCESSED AFTER RECLAIM: the reclaiming attempt remains authoritative — this request responds success without forcing a redundant retry", async () => {
      const event = stripeEvent({
        type: "checkout.session.completed",
        object: { id: "cs_1", mode: "subscription", client_reference_id: "user-1", customer: "cus_1", subscription: "sub_1", metadata: { plan: "premium" } },
      });
      constructEventMock.mockReturnValue(event);
      retrieveSubscriptionMock.mockResolvedValue(fakeStripeSubscription({ status: "active" }));
      const supabase = makeSupabaseMock({
        // This request was merely slow, not dead — but by the time its
        // own finalize CAS runs, a different attempt has already
        // reclaimed the row under a new claim_token, so the CAS
        // (WHERE event_id = ? AND claim_token = <this request's, now
        // stale, token>) matches 0 rows.
        ledgerFinalizeResult: { data: [], error: null },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createServiceSupabaseClientMock.mockReturnValue(supabase as any);

      const response = await POST(makeRequest("{}"));
      const body = await response.json();

      // The billing mutation this request performed already committed
      // and is safe (it's an idempotent, Stripe-truth-reconciling
      // upsert) — there is nothing to retry, and the ledger's outcome is
      // whatever the reclaiming attempt establishes, not this one.
      expect(response.status).toBe(200);
      expect(body.duplicate).toBeUndefined();
      expect(supabase.upsert).toHaveBeenCalled();
    });

    it("STALE OWNER CANNOT MARK FAILED AFTER RECLAIM: the reclaiming attempt remains authoritative — this request does not pile a redundant retry on top of it", async () => {
      const event = stripeEvent({
        type: "checkout.session.completed",
        object: { id: "cs_1", mode: "subscription", client_reference_id: "user-1", customer: "cus_1", subscription: "sub_1", metadata: { plan: "premium" } },
      });
      constructEventMock.mockReturnValue(event);
      retrieveSubscriptionMock.mockResolvedValue(fakeStripeSubscription({ status: "active" }));
      const supabase = makeSupabaseMock({
        upsertResult: { error: { message: "connection reset" } },
        // Ownership was already lost to a reclaiming attempt by the time
        // this request tries to mark itself failed.
        ledgerFinalizeResult: { data: [], error: null },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createServiceSupabaseClientMock.mockReturnValue(supabase as any);

      const response = await POST(makeRequest("{}"));
      const body = await response.json();

      // Responding 500 here would just add a redundant THIRD Stripe
      // retry on top of the reclaiming attempt's own (already
      // independent) response — so this responds success instead,
      // deliberately and visibly (ownershipLost), not silently.
      expect(response.status).toBe(200);
      expect(body.ownershipLost).toBe(true);
    });
  });
});
