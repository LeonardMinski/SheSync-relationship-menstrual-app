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
  /** Response to acquireReconciliationLock: subscription_reconciliation_locks.upsert(...) */
  lockUpsertResult?: { error: unknown };
  /** Response to the reconcile_subscription_if_owner RPC: data=true means ownership retained and the write applied; data=false means lost ownership, nothing written. */
  reconcileRpcResult?: { data: boolean | null; error: unknown };
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

  const lockUpsert = vi.fn().mockResolvedValue(options.lockUpsertResult ?? { error: null });

  const rpc = vi.fn().mockResolvedValue(options.reconcileRpcResult ?? { data: true, error: null });

  const from = vi.fn((table: string) => {
    if (table === "stripe_webhook_events") return { insert: insertEvents, select: selectEvents, update: updateEvents };
    if (table === "subscriptions") return { select: selectSubscriptions, upsert };
    if (table === "subscription_reconciliation_locks") return { upsert: lockUpsert };
    if (table === "users") return { update: updateUsers };
    throw new Error(`unexpected table: ${table}`);
  });

  return {
    from,
    rpc,
    insertEvents,
    selectEvents,
    updateEvents,
    selectSubscriptions,
    eqForSelect,
    maybeSingle,
    upsert,
    updateUsers,
    eqForUsersUpdate,
    lockUpsert,
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
  let usersTier: string | null = null;
  // Models the single-row subscription_reconciliation_locks state for
  // "cus_1" (the only customer id used by these stateful tests): an
  // upsert unconditionally overwrites it (real Postgres semantics for a
  // single-row PK — whichever write commits LAST wins), and the RPC below
  // only applies a write when its token still matches this current value.
  let currentLockToken: string | null = null;
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

  // Nothing writes through a plain client-side upsert anymore — Lifetime
  // now goes through the SAME fenced RPC as recurring reconciliation (see
  // rpc below). Kept only so a stray call surfaces loudly as a failure
  // rather than silently no-opping.
  const upsert = vi.fn().mockImplementation(() => {
    throw new Error("unexpected direct subscriptions upsert — Lifetime now writes via reconcile_subscription_if_owner too");
  });

  const eqForUsersUpdate = vi.fn().mockResolvedValue({ error: null });
  const updateUsers = vi.fn().mockReturnValue({ eq: eqForUsersUpdate });

  const lockUpsert = vi.fn().mockImplementation((payload: Record<string, unknown>) => {
    currentLockToken = payload.reconciliation_token as string;
    return Promise.resolve({ error: null });
  });

  // Mirrors reconcile_subscription_if_owner's two fences: (1) the token
  // must still be current for this customer, and (2) a NON-authoritative
  // call (an ordinary lifecycle event) may only reconcile the subscription
  // that is ALREADY canonical for this user — never switch canonical
  // identity. See the migration's function comment for the exact rule.
  const rpc = vi.fn().mockImplementation((fnName: string, params: Record<string, unknown>) => {
    if (fnName !== "reconcile_subscription_if_owner") {
      throw new Error(`unexpected rpc: ${fnName}`);
    }
    if (params.p_reconciliation_token !== currentLockToken) {
      return Promise.resolve({ data: false, error: null });
    }

    if (!params.p_is_authoritative) {
      if (!currentRow) return Promise.resolve({ data: false, error: null });
      if (currentRow.billing_type === "lifetime") return Promise.resolve({ data: false, error: null });
      if (currentRow.stripe_subscription_id !== params.p_stripe_subscription_id) {
        return Promise.resolve({ data: false, error: null });
      }
    }

    currentRow = {
      ...currentRow,
      user_id: params.p_user_id,
      stripe_customer_id: params.p_stripe_customer_id,
      stripe_subscription_id: params.p_stripe_subscription_id,
      stripe_checkout_session_id: params.p_stripe_checkout_session_id,
      stripe_payment_intent_id: params.p_stripe_payment_intent_id,
      stripe_price_id: params.p_stripe_price_id,
      plan: params.p_plan,
      billing_type: params.p_billing_type,
      status: params.p_status,
      current_period_end: params.p_current_period_end,
      cancel_at_period_end: params.p_cancel_at_period_end,
      grace_period_ends_at: params.p_grace_period_ends_at,
      last_stripe_event_created_at: params.p_last_stripe_event_created_at,
    };
    usersTier = params.p_subscription_tier as string;
    return Promise.resolve({ data: true, error: null });
  });

  const from = vi.fn((table: string) => {
    if (table === "stripe_webhook_events") return { insert: insertEvents, select: selectEvents, update: updateEvents };
    if (table === "subscriptions") return { select: selectSubscriptions, upsert };
    if (table === "subscription_reconciliation_locks") return { upsert: lockUpsert };
    if (table === "users") return { update: updateUsers };
    throw new Error(`unexpected table: ${table}`);
  });

  return {
    from,
    rpc,
    upsert,
    lockUpsert,
    getCurrentRow: () => currentRow,
    getUsersTier: () => usersTier,
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

/** Flushes pending microtasks/timers so a stalled `await` elsewhere has a chance to run before we proceed — used to interleave two concurrent POST calls deterministically in the reconciliation-ownership race tests below. */
function flushAsync() {
  return new Promise((resolve) => setTimeout(resolve, 0));
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
    // The reconciliation lock is acquired BEFORE the Stripe retrieve, keyed
    // by CUSTOMER (not subscription) — see acquireReconciliationLock.
    expect(supabase.lockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ stripe_customer_id: "cus_1", reconciliation_token: expect.any(String) }),
      { onConflict: "stripe_customer_id" },
    );
    expect(retrieveSubscriptionMock.mock.invocationCallOrder[0]).toBeGreaterThan(
      supabase.lockUpsert.mock.invocationCallOrder[0],
    );
    // The canonical write (subscriptions + users.subscription_tier, both
    // atomically) goes through the ownership-checked RPC, not a plain
    // client-side upsert — see writeSubscriptionIfOwner. checkout is an
    // authoritative purchase path, so it may establish/replace canonical
    // identity — see the canonical-identity rule in the RPC.
    expect(supabase.rpc).toHaveBeenCalledWith(
      "reconcile_subscription_if_owner",
      expect.objectContaining({
        p_is_authoritative: true,
        p_user_id: "user-1",
        p_stripe_customer_id: "cus_1",
        p_stripe_subscription_id: "sub_1",
        p_stripe_checkout_session_id: "cs_1",
        p_plan: "premium",
        p_billing_type: "recurring",
        p_status: "active",
        p_subscription_tier: "premium",
      }),
    );
    expect(supabase.updateEvents).toHaveBeenCalledWith(
      expect.objectContaining({ status: "processed", processed_at: expect.any(String) }),
    );
  });

  it("LIFETIME: checkout.session.completed (payment mode) creates a lifetime row via the SAME customer-fenced RPC as recurring reconciliation, and never calls Stripe's subscription API", async () => {
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
    // Lifetime participates in the SAME customer-level reconciliation
    // fence as recurring reconciliation (Fix 2) — see
    // acquireReconciliationLock in handleCheckoutSessionCompleted's
    // payment-mode branch.
    expect(supabase.lockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ stripe_customer_id: "cus_1", reconciliation_token: expect.any(String) }),
      { onConflict: "stripe_customer_id" },
    );
    // The canonical write goes through the SAME ownership-checked RPC as
    // recurring reconciliation — never a plain client-side upsert.
    expect(supabase.upsert).not.toHaveBeenCalled();
    expect(supabase.updateUsers).not.toHaveBeenCalled();
    expect(supabase.rpc).toHaveBeenCalledWith(
      "reconcile_subscription_if_owner",
      expect.objectContaining({
        p_is_authoritative: true,
        p_stripe_customer_id: "cus_1",
        p_stripe_subscription_id: null,
        p_billing_type: "lifetime",
        p_plan: "lifetime",
        p_status: "active",
        p_stripe_payment_intent_id: "pi_1",
        p_subscription_tier: "lifetime",
      }),
    );
  });

  it("PAST_DUE (A): customer.subscription.updated transitioning into past_due sets a fresh 7-day grace period anchored to NOW, never to the event's own created time", async () => {
    vi.useFakeTimers();
    const now = new Date("2026-03-01T00:00:00.000Z");
    vi.setSystemTime(now);
    try {
      const eventCreated = 1_750_100_000;
      const event = stripeEvent({
        type: "customer.subscription.updated",
        created: eventCreated,
        // The event's own payload is deliberately minimal — reconciliation
        // never reads status/price/period from it, only customer + id.
        // There is no "confirmed transition" concept anymore — grace is
        // NEVER anchored to any event's own timestamp (see
        // computeGracePeriodEndsAt) — so this event's created time is
        // simply irrelevant to the outcome.
        object: { id: "sub_1", customer: "cus_1" },
      });
      constructEventMock.mockReturnValue(event);
      retrieveSubscriptionMock.mockResolvedValue(fakeStripeSubscription({ status: "past_due" }));
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
      const rpcParams = supabase.rpc.mock.calls[0][1] as { p_status: string; p_grace_period_ends_at: string };
      expect(rpcParams.p_status).toBe("past_due");
      const graceEndsAt = new Date(rpcParams.p_grace_period_ends_at).getTime();
      expect(graceEndsAt - now.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
    } finally {
      vi.useRealTimers();
    }
  });

  it("DELAYED OLD EVENT (B): an old/unrelated delivery that merely triggers a reconciliation while Stripe is CURRENTLY past_due does not backdate the grace period to that event's own (unrelated) created time", async () => {
    vi.useFakeTimers();
    const now = new Date("2026-06-15T00:00:00.000Z");
    vi.setSystemTime(now);
    try {
      // An old event, long before the subscription actually became
      // past_due. Its `created` time has no relationship to the real
      // transition and must never be trusted as one — grace is always
      // anchored to `now`, unconditionally (see computeGracePeriodEndsAt).
      const oldEventCreated = 1_600_000_000; // long before `now`
      const event = stripeEvent({
        type: "customer.subscription.updated",
        created: oldEventCreated,
        object: { id: "sub_1", customer: "cus_1" },
      });
      constructEventMock.mockReturnValue(event);
      // Stripe's CURRENT truth, fetched fresh, already past_due.
      retrieveSubscriptionMock.mockResolvedValue(fakeStripeSubscription({ status: "past_due" }));
      const supabase = makeSupabaseMock({
        selectSubscriptionResult: {
          data: {
            user_id: "user-1",
            status: "active", // our records have never seen past_due for this row yet
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
      const rpcParams = supabase.rpc.mock.calls[0][1] as { p_status: string; p_grace_period_ends_at: string };
      expect(rpcParams.p_status).toBe("past_due");
      const graceEndsAt = new Date(rpcParams.p_grace_period_ends_at).getTime();
      // NOT anchored to the old event's created time (which would grant
      // far less than 7 days, or even a deadline already in the past).
      expect(graceEndsAt - oldEventCreated * 1000).not.toBe(7 * 24 * 60 * 60 * 1000);
      // Anchored to "now" instead — the safe fallback that can never grant
      // less than the promised 7 days.
      expect(graceEndsAt - now.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
    } finally {
      vi.useRealTimers();
    }
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
    expect(supabase.rpc).toHaveBeenCalledWith(
      "reconcile_subscription_if_owner",
      expect.objectContaining({
        p_status: "past_due", // from retrieve, NOT the stale event's "active"
        p_grace_period_ends_at: "2026-01-01T00:00:00.000Z", // preserved, not reset
      }),
    );
  });

  it("EQUAL-SECOND DISTINCT EVENTS: two events sharing the same created second are both independently reconciled, neither silently skipped", async () => {
    const supabase = makeStatefulSupabaseMock({
      user_id: "user-1",
      status: "active",
      plan: "premium",
      stripe_subscription_id: "sub_1",
      billing_type: "recurring",
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
    expect(supabase.rpc).toHaveBeenCalledWith(
      "reconcile_subscription_if_owner",
      expect.objectContaining({ p_status: "past_due", p_grace_period_ends_at: "2026-01-01T00:00:00.000Z" }),
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
    expect(supabase.rpc).toHaveBeenCalledWith(
      "reconcile_subscription_if_owner",
      expect.objectContaining({ p_status: "canceled", p_cancel_at_period_end: false, p_subscription_tier: "free" }),
    );
  });

  it("GRACE RECOVERY: does not reset the grace window on repeated past_due, clears it on recovery, and starts a fresh one on a later past_due", async () => {
    const supabase = makeStatefulSupabaseMock({
      user_id: "user-1",
      status: "active",
      plan: "premium",
      stripe_subscription_id: "sub_1",
      billing_type: "recurring",
      stripe_checkout_session_id: "cs_1",
      stripe_payment_intent_id: null,
      stripe_price_id: "price_premium_test",
      current_period_end: null,
      grace_period_ends_at: null,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createServiceSupabaseClientMock.mockReturnValue(supabase as any);

    function subscriptionUpdated(id: string) {
      return stripeEvent({ id, type: "customer.subscription.updated", object: { id: "sub_1", customer: "cus_1" } });
    }

    // Grace is anchored to `now`, never to any event's own `created` time
    // (see computeGracePeriodEndsAt) — fake timers let each step assert
    // against a controlled, distinct "now".
    vi.useFakeTimers();
    try {
      // 1) First transition into past_due (C: "first observed past_due")
      //    — starts a fresh 7-day grace window anchored to `now`.
      const t1 = new Date("2026-01-01T00:00:00.000Z");
      vi.setSystemTime(t1);
      constructEventMock.mockReturnValueOnce(subscriptionUpdated("evt_1"));
      retrieveSubscriptionMock.mockResolvedValueOnce(fakeStripeSubscription({ status: "past_due" }));
      await POST(makeRequest("{}"));
      const firstGrace = supabase.getCurrentRow()?.grace_period_ends_at as string;
      expect(new Date(firstGrace).getTime() - t1.getTime()).toBe(7 * 24 * 60 * 60 * 1000);

      // 2) A second past_due update (e.g. a retried/related event), at a
      //    LATER `now`, must not push the deadline back out (C: "repeated
      //    past_due preserves deadline").
      vi.setSystemTime(new Date(t1.getTime() + 1000));
      constructEventMock.mockReturnValueOnce(subscriptionUpdated("evt_2"));
      retrieveSubscriptionMock.mockResolvedValueOnce(fakeStripeSubscription({ status: "past_due" }));
      await POST(makeRequest("{}"));
      expect(supabase.getCurrentRow()?.grace_period_ends_at).toBe(firstGrace);

      // 3) Recovery clears the grace period entirely (D).
      vi.setSystemTime(new Date(t1.getTime() + 2000));
      constructEventMock.mockReturnValueOnce(subscriptionUpdated("evt_3"));
      retrieveSubscriptionMock.mockResolvedValueOnce(fakeStripeSubscription({ status: "active" }));
      await POST(makeRequest("{}"));
      expect(supabase.getCurrentRow()?.grace_period_ends_at).toBeNull();
      expect(supabase.getCurrentRow()?.status).toBe("active");

      // 4) A later, independent past_due transition starts a NEW 7-day
      //    window anchored to the NEW `now` — not a reuse of the first
      //    one (E).
      const t4 = new Date(t1.getTime() + 3000);
      vi.setSystemTime(t4);
      constructEventMock.mockReturnValueOnce(subscriptionUpdated("evt_4"));
      retrieveSubscriptionMock.mockResolvedValueOnce(fakeStripeSubscription({ status: "past_due" }));
      await POST(makeRequest("{}"));
      const secondGrace = supabase.getCurrentRow()?.grace_period_ends_at as string;
      expect(new Date(secondGrace).getTime() - t4.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
      expect(secondGrace).not.toBe(firstGrace);
    } finally {
      vi.useRealTimers();
    }
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
      const failingSupabase = makeSupabaseMock({
        reconcileRpcResult: { data: null, error: { message: "connection reset" } },
      });
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
      expect(retrySupabase.rpc).toHaveBeenCalled();
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
      expect(supabase.rpc).not.toHaveBeenCalled();
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
      expect(supabase.rpc).not.toHaveBeenCalled();
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
      expect(supabase.rpc).toHaveBeenCalled();
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
      expect(supabase.rpc).not.toHaveBeenCalled();
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
      const supabase = makeSupabaseMock({
        reconcileRpcResult: { data: null, error: { message: "connection reset" } },
      });
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
      expect(supabase.rpc).toHaveBeenCalled();
    });

    it("STALE OWNER CANNOT MARK FAILED AFTER RECLAIM: the reclaiming attempt remains authoritative — this request does not pile a redundant retry on top of it", async () => {
      const event = stripeEvent({
        type: "checkout.session.completed",
        object: { id: "cs_1", mode: "subscription", client_reference_id: "user-1", customer: "cus_1", subscription: "sub_1", metadata: { plan: "premium" } },
      });
      constructEventMock.mockReturnValue(event);
      retrieveSubscriptionMock.mockResolvedValue(fakeStripeSubscription({ status: "active" }));
      const supabase = makeSupabaseMock({
        reconcileRpcResult: { data: null, error: { message: "connection reset" } },
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

  describe("subscription reconciliation ownership (Blocker 1 — distinct from the ledger claim_token above)", () => {
    it("STALE SAME-EVENT WRITER: a claimant that retrieved Stripe state and then stalled cannot overwrite a reclaim of the SAME event_id that already wrote newer state", async () => {
      const supabase = makeStatefulSupabaseMock({
        user_id: "user-1",
        status: "active",
        plan: "premium",
        stripe_subscription_id: "sub_1",
        billing_type: "recurring",
        stripe_checkout_session_id: "cs_1",
        stripe_payment_intent_id: null,
        stripe_price_id: "price_premium_test",
        current_period_end: null,
        grace_period_ends_at: null,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createServiceSupabaseClientMock.mockReturnValue(supabase as any);

      // A: claims evt_1, acquires the reconciliation lock, then stalls on
      // its Stripe retrieve — a slow request that hasn't crashed, just
      // hasn't finished yet.
      let resolveARetrieve: (value: unknown) => void = () => {};
      const stalledRetrieve = new Promise((resolve) => {
        resolveARetrieve = resolve;
      });
      const eventA = stripeEvent({ id: "evt_1", type: "customer.subscription.updated", object: { id: "sub_1", customer: "cus_1" } });
      constructEventMock.mockReturnValueOnce(eventA);
      retrieveSubscriptionMock.mockReturnValueOnce(stalledRetrieve);
      const postA = POST(makeRequest("{}"));

      // Let A run up through claiming the ledger row and acquiring the
      // reconciliation lock before B starts.
      await flushAsync();
      expect(supabase.rpc).not.toHaveBeenCalled();

      // B: reclaims the SAME event_id (this mock's ledger unconditionally
      // accepts every claim; the real claim_token CAS that governs actual
      // reclaim eligibility is covered by the "ledger claim/retry/
      // duplicate/ownership semantics" tests above — this test isolates
      // the SEPARATE subscription-lock mechanism). B retrieves and writes
      // NEWER Stripe state, finishing completely before A resumes.
      const eventB = stripeEvent({ id: "evt_1", type: "customer.subscription.updated", object: { id: "sub_1", customer: "cus_1" } });
      constructEventMock.mockReturnValueOnce(eventB);
      retrieveSubscriptionMock.mockResolvedValueOnce(fakeStripeSubscription({ status: "canceled" }));
      const responseB = await POST(makeRequest("{}"));
      expect(responseB.status).toBe(200);
      expect(supabase.getCurrentRow()?.status).toBe("canceled");

      // A resumes: its stalled retrieve finally resolves with the OLD
      // state it originally fetched, before B ever ran.
      resolveARetrieve(fakeStripeSubscription({ status: "past_due" }));
      const responseA = await postA;
      expect(responseA.status).toBe(200);

      // B's write remains authoritative — A's stale resume must not
      // regress the canonical state back to what it originally fetched.
      expect(supabase.getCurrentRow()?.status).toBe("canceled");
    });

    it("DISTINCT EVENT CONCURRENCY: an older Stripe state fetched by one event_id cannot overwrite a newer reconciliation already applied by a wholly distinct, concurrently-processing event_id for the same subscription", async () => {
      const supabase = makeStatefulSupabaseMock({
        user_id: "user-1",
        status: "active",
        plan: "premium",
        stripe_subscription_id: "sub_1",
        billing_type: "recurring",
        stripe_checkout_session_id: "cs_1",
        stripe_payment_intent_id: null,
        stripe_price_id: "price_premium_test",
        current_period_end: null,
        grace_period_ends_at: null,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createServiceSupabaseClientMock.mockReturnValue(supabase as any);

      let resolveARetrieve: (value: unknown) => void = () => {};
      const stalledRetrieve = new Promise((resolve) => {
        resolveARetrieve = resolve;
      });
      // evt_a and evt_b are genuinely DISTINCT Stripe events (never a
      // reclaim of one another) for the SAME underlying subscription.
      const eventA = stripeEvent({ id: "evt_a", type: "customer.subscription.updated", object: { id: "sub_1", customer: "cus_1" } });
      constructEventMock.mockReturnValueOnce(eventA);
      retrieveSubscriptionMock.mockReturnValueOnce(stalledRetrieve);
      const postA = POST(makeRequest("{}"));
      await flushAsync();
      expect(supabase.rpc).not.toHaveBeenCalled();

      const eventB = stripeEvent({ id: "evt_b", type: "customer.subscription.updated", object: { id: "sub_1", customer: "cus_1" } });
      constructEventMock.mockReturnValueOnce(eventB);
      retrieveSubscriptionMock.mockResolvedValueOnce(fakeStripeSubscription({ status: "past_due" }));
      const responseB = await POST(makeRequest("{}"));
      expect(responseB.status).toBe(200);
      expect(supabase.getCurrentRow()?.status).toBe("past_due");

      // A's own (older, now-stale) fetched state resolves after B already
      // committed a newer reconciliation under a completely unrelated
      // event_id.
      resolveARetrieve(fakeStripeSubscription({ status: "active" }));
      const responseA = await postA;
      expect(responseA.status).toBe(200);

      // A's older fetch must not regress B's newer, already-committed state.
      expect(supabase.getCurrentRow()?.status).toBe("past_due");
    });

    it("LOST OWNERSHIP: a stale reconciliation attempt cannot mutate the subscription row, and its own ledger outcome is unaffected by the skip", async () => {
      const event = stripeEvent({
        type: "checkout.session.completed",
        object: { id: "cs_1", mode: "subscription", client_reference_id: "user-1", customer: "cus_1", subscription: "sub_1", metadata: { plan: "premium" } },
      });
      constructEventMock.mockReturnValue(event);
      retrieveSubscriptionMock.mockResolvedValue(fakeStripeSubscription({ status: "active" }));
      const supabase = makeSupabaseMock({
        // Simulates a newer reconciliation attempt for this subscription
        // having already replaced the reconciliation lock's token by the
        // time this request's RPC call runs — reconcile_subscription_if_owner
        // returns false without executing its INSERT/UPDATE statements.
        reconcileRpcResult: { data: false, error: null },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createServiceSupabaseClientMock.mockReturnValue(supabase as any);

      const response = await POST(makeRequest("{}"));

      expect(supabase.rpc).toHaveBeenCalled();
      expect(vi.mocked(console.warn)).toHaveBeenCalledWith(
        expect.stringContaining("lost subscription reconciliation ownership"),
        "sub_1",
      );

      // This event's OWN ledger outcome is entirely unaffected by losing
      // the subscription-lock race — the two are independent mechanisms —
      // and still finalizes normally as processed.
      expect(response.status).toBe(200);
      expect(supabase.updateEvents).toHaveBeenCalledWith(
        expect.objectContaining({ status: "processed", processed_at: expect.any(String) }),
      );
    });

    it("NORMAL OWNER: an uncontested reconciliation acquires the lock before retrieving Stripe state, writes the subscription atomically via the RPC, and finalizes the ledger normally", async () => {
      const event = stripeEvent({
        type: "customer.subscription.updated",
        object: { id: "sub_1", customer: "cus_1" },
      });
      constructEventMock.mockReturnValue(event);
      retrieveSubscriptionMock.mockResolvedValue(fakeStripeSubscription({ status: "active" }));
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
      expect(supabase.lockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({ stripe_customer_id: "cus_1" }),
        { onConflict: "stripe_customer_id" },
      );
      const lockToken = supabase.lockUpsert.mock.calls[0][0].reconciliation_token;
      expect(supabase.rpc).toHaveBeenCalledWith(
        "reconcile_subscription_if_owner",
        expect.objectContaining({ p_reconciliation_token: lockToken, p_is_authoritative: false, p_status: "active" }),
      );
      expect(supabase.updateEvents).toHaveBeenCalledWith(
        expect.objectContaining({ status: "processed", processed_at: expect.any(String) }),
      );
    });
  });

  describe("canonical subscription identity (Fix 2/3 — customer-level fence + canonical-subscription-id rule)", () => {
    it("OLD SUBSCRIPTION AFTER RESUBSCRIBE: a lifecycle event for an old, no-longer-canonical subscription is a benign no-op — canonical identity and tier stay untouched", async () => {
      const supabase = makeStatefulSupabaseMock({
        user_id: "user-1",
        status: "active",
        plan: "premium",
        stripe_subscription_id: "sub_new",
        billing_type: "recurring",
        stripe_checkout_session_id: "cs_new",
        stripe_payment_intent_id: null,
        stripe_price_id: "price_premium_test",
        current_period_end: null,
        grace_period_ends_at: null,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createServiceSupabaseClientMock.mockReturnValue(supabase as any);

      // An old lifecycle event for sub_old — canonical BEFORE the user
      // resubscribed under sub_new — arrives late.
      const event = stripeEvent({ type: "customer.subscription.updated", object: { id: "sub_old", customer: "cus_1" } });
      constructEventMock.mockReturnValue(event);
      retrieveSubscriptionMock.mockResolvedValue(fakeStripeSubscription({ id: "sub_old", status: "canceled" }));

      const response = await POST(makeRequest("{}"));

      expect(response.status).toBe(200);
      // Canonical remains sub_new/active — never regressed to sub_old/canceled.
      expect(supabase.getCurrentRow()?.stripe_subscription_id).toBe("sub_new");
      expect(supabase.getCurrentRow()?.status).toBe("active");
      // No tier write happened at all — the RPC rejected the write before
      // ever reaching the users.subscription_tier update, so tier remains
      // whatever it already was (Premium).
      expect(supabase.getUsersTier()).toBeNull();
    });

    it("OLD SUBSCRIPTION AFTER LIFETIME: a lifecycle event for a recurring subscription is a benign no-op once the user's canonical billing state is Lifetime", async () => {
      const supabase = makeStatefulSupabaseMock({
        user_id: "user-1",
        status: "active",
        plan: "lifetime",
        stripe_subscription_id: null,
        billing_type: "lifetime",
        stripe_checkout_session_id: "cs_lifetime",
        stripe_payment_intent_id: "pi_lifetime",
        stripe_price_id: "price_lifetime_test",
        current_period_end: null,
        grace_period_ends_at: null,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createServiceSupabaseClientMock.mockReturnValue(supabase as any);

      // A late lifecycle event for a recurring subscription that predates
      // (or is otherwise unrelated to) the user's Lifetime purchase.
      const event = stripeEvent({ type: "customer.subscription.updated", object: { id: "sub_old", customer: "cus_1" } });
      constructEventMock.mockReturnValue(event);
      retrieveSubscriptionMock.mockResolvedValue(fakeStripeSubscription({ id: "sub_old", status: "active" }));

      const response = await POST(makeRequest("{}"));

      expect(response.status).toBe(200);
      // Canonical remains Lifetime — never regressed to a recurring state.
      expect(supabase.getCurrentRow()?.billing_type).toBe("lifetime");
      expect(supabase.getCurrentRow()?.stripe_subscription_id).toBeNull();
      expect(supabase.getUsersTier()).toBeNull();
    });

    it("NEW SUBSCRIPTION BEFORE CHECKOUT: a lifecycle event for a not-yet-canonical NEW subscription cannot establish it, but the following authoritative checkout can", async () => {
      const supabase = makeStatefulSupabaseMock({
        user_id: "user-1",
        status: "active",
        plan: "premium",
        stripe_subscription_id: "sub_old",
        billing_type: "recurring",
        stripe_checkout_session_id: "cs_old",
        stripe_payment_intent_id: null,
        stripe_price_id: "price_premium_test",
        current_period_end: null,
        grace_period_ends_at: null,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createServiceSupabaseClientMock.mockReturnValue(supabase as any);

      // Stripe delivers customer.subscription.created for the brand-new
      // sub_new BEFORE the checkout.session.completed that will actually
      // authorize it — Stripe never guarantees delivery order.
      const createdEvent = stripeEvent({
        id: "evt_created",
        type: "customer.subscription.created",
        object: { id: "sub_new", customer: "cus_1" },
      });
      constructEventMock.mockReturnValueOnce(createdEvent);
      retrieveSubscriptionMock.mockResolvedValueOnce(fakeStripeSubscription({ id: "sub_new", status: "active" }));
      const responseCreated = await POST(makeRequest("{}"));
      expect(responseCreated.status).toBe(200);

      // Must NOT have silently replaced canonical sub_old.
      expect(supabase.getCurrentRow()?.stripe_subscription_id).toBe("sub_old");

      // The authoritative checkout for sub_new arrives next.
      const checkoutEvent = stripeEvent({
        id: "evt_checkout",
        type: "checkout.session.completed",
        object: {
          id: "cs_new",
          mode: "subscription",
          client_reference_id: "user-1",
          customer: "cus_1",
          subscription: "sub_new",
          metadata: { plan: "premium" },
        },
      });
      constructEventMock.mockReturnValueOnce(checkoutEvent);
      retrieveSubscriptionMock.mockResolvedValueOnce(fakeStripeSubscription({ id: "sub_new", status: "active" }));
      const responseCheckout = await POST(makeRequest("{}"));
      expect(responseCheckout.status).toBe(200);

      // NOW canonical has been established as sub_new, from fresh retrieved state.
      expect(supabase.getCurrentRow()?.stripe_subscription_id).toBe("sub_new");
      expect(supabase.getCurrentRow()?.status).toBe("active");
    });

    it("LIFETIME VS RECURRING OVERLAP: once an authoritative Lifetime checkout wins the canonical write, a stale recurring reconciliation cannot subsequently overwrite it", async () => {
      const supabase = makeStatefulSupabaseMock({
        user_id: "user-1",
        status: "active",
        plan: "premium",
        stripe_subscription_id: "sub_1",
        billing_type: "recurring",
        stripe_checkout_session_id: "cs_1",
        stripe_payment_intent_id: null,
        stripe_price_id: "price_premium_test",
        current_period_end: null,
        grace_period_ends_at: null,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createServiceSupabaseClientMock.mockReturnValue(supabase as any);

      // Recurring reconciliation (non-authoritative) for the CURRENTLY
      // canonical sub_1 acquires the customer-level lock, then stalls on
      // its Stripe retrieve.
      let resolveRecurringRetrieve: (value: unknown) => void = () => {};
      const stalledRetrieve = new Promise((resolve) => {
        resolveRecurringRetrieve = resolve;
      });
      const lifecycleEvent = stripeEvent({
        id: "evt_lifecycle",
        type: "customer.subscription.updated",
        object: { id: "sub_1", customer: "cus_1" },
      });
      constructEventMock.mockReturnValueOnce(lifecycleEvent);
      retrieveSubscriptionMock.mockReturnValueOnce(stalledRetrieve);
      const postRecurring = POST(makeRequest("{}"));

      await flushAsync();
      expect(supabase.rpc).not.toHaveBeenCalled();

      // A Lifetime checkout for the SAME customer arrives and completes
      // fully — an authoritative write. It acquires the SAME
      // customer-level lock, superseding the recurring attempt's token
      // (Lifetime never calls stripe.subscriptions.retrieve, so nothing
      // here consumes the still-pending stalled retrieve above).
      const lifetimeEvent = stripeEvent({
        id: "evt_lifetime",
        type: "checkout.session.completed",
        object: {
          id: "cs_lifetime",
          mode: "payment",
          client_reference_id: "user-1",
          customer: "cus_1",
          payment_intent: "pi_lifetime",
          metadata: { plan: "lifetime" },
        },
      });
      constructEventMock.mockReturnValueOnce(lifetimeEvent);
      const responseLifetime = await POST(makeRequest("{}"));
      expect(responseLifetime.status).toBe(200);
      expect(supabase.getCurrentRow()?.billing_type).toBe("lifetime");

      // The stalled recurring reconciliation resumes with its own (now
      // stale) retrieved state.
      resolveRecurringRetrieve(fakeStripeSubscription({ id: "sub_1", status: "past_due" }));
      const responseRecurring = await postRecurring;
      expect(responseRecurring.status).toBe(200);

      // Lifetime remains canonical — the stale recurring write must not
      // resurrect the old recurring state.
      expect(supabase.getCurrentRow()?.billing_type).toBe("lifetime");
      expect(supabase.getCurrentRow()?.status).not.toBe("past_due");
    });
  });
});
