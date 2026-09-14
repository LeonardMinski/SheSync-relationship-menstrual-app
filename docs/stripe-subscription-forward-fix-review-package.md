# Stripe subscription-sync forward fix — read-only review package

Branch: `fix/stripe-subscription-sync`
HEAD at time of review: `68042f98d501fb1e3bf3bc13debf28ea38c05384`
Status: **read-only review of uncommitted changes.** No commit, push, migration apply, or merge occurred while producing this package.

---

## 1. `git status --short`

```
 M database/subscriptions-entitlement-forward-fix-migration.sql
 M docs/stripe-subscription-migration-review.md
 M src/app/api/webhooks/stripe/route.test.ts
 M src/app/api/webhooks/stripe/route.ts
?? .claude/
?? .ignore
?? .mcp.json
?? docs/stripe-subscription-forward-fix-checkpoint.md
```

## 2. `git diff --stat`

```
 database/subscriptions-entitlement-forward-fix-migration.sql | 145 +++++++-
 docs/stripe-subscription-migration-review.md                 | 139 +++++++
 src/app/api/webhooks/stripe/route.test.ts                    | 400 +++++++++++++++++++--
 src/app/api/webhooks/stripe/route.ts                          | 189 +++++++++-
 4 files changed, 819 insertions(+), 54 deletions(-)
```

## 3. Full diffs

### `database/subscriptions-entitlement-forward-fix-migration.sql`

```diff
diff --git a/database/subscriptions-entitlement-forward-fix-migration.sql b/database/subscriptions-entitlement-forward-fix-migration.sql
index cc5b38ea..c9a51d66 100644
--- a/database/subscriptions-entitlement-forward-fix-migration.sql
+++ b/database/subscriptions-entitlement-forward-fix-migration.sql
@@ -2,7 +2,10 @@
 -- ============================================================
 -- NOT APPLIED. Proposal for review only — see
 -- docs/stripe-subscription-migration-review.md ("Round 3 — Forward Fix")
--- for the full writeup and verification plan.
+-- for the full writeup and verification plan. Section 4 (the
+-- subscription_reconciliation_locks table + reconcile_subscription_if_owner
+-- RPC) was added by the same-day Round-3 correctness re-review that closed
+-- two remaining races — still not applied.
 --
 -- CONTEXT — why this file exists instead of re-running
 -- subscriptions-entitlement-migration.sql:
@@ -180,4 +183,144 @@ grant insert (
   tracking_enabled
 ) on public.users to authenticated;
 
+-- 4. Round-3 correctness review (see
+--    docs/stripe-subscription-migration-review.md): claim_token above
+--    protects only the per-event_id LEDGER outcome (processed/failed). It
+--    does not protect the actual public.subscriptions mutation, so a
+--    claimant that retrieved Stripe state and then stalled past
+--    PROCESSING_CLAIM_STALE_MS could resume after a DIFFERENT attempt — a
+--    reclaim of the same event_id, or a wholly distinct event_id for the
+--    same Stripe subscription — already wrote a newer Stripe-retrieved
+--    state, and overwrite it with its own now-stale snapshot.
+--
+-- Fix: a per-subscription reconciliation fencing token (same
+-- distributed-locking pattern as claim_token, applied one level down —
+-- keyed by Stripe subscription id rather than event id), acquired BEFORE
+-- calling stripe.subscriptions.retrieve() and checked-and-consumed
+-- atomically, in the same transaction as the canonical write, by
+-- reconcile_subscription_if_owner() below. See
+-- acquireReconciliationLock/writeSubscriptionIfOwner in
+-- src/app/api/webhooks/stripe/route.ts.
+create table public.subscription_reconciliation_locks (
+  stripe_subscription_id text primary key,
+  reconciliation_token uuid not null,
+  acquired_at timestamptz not null default now()
+);
+
+alter table public.subscription_reconciliation_locks enable row level security;
+-- No policies: service-role-only, same rationale as stripe_webhook_events
+-- above — nothing here is ever user-facing.
+
+revoke all on public.subscription_reconciliation_locks from anon, authenticated, service_role;
+
+-- service_role's algorithm needs:
+--   INSERT/UPDATE (via upsert) — acquire/replace the current
+--     reconciliation token for a subscription, before retrieving Stripe
+--     state (acquireReconciliationLock)
+--   SELECT — read inside reconcile_subscription_if_owner() below (runs as
+--     the function owner via SECURITY DEFINER, but an explicit grant
+--     keeps this table's own privileges legible without depending on
+--     that implicit bypass)
+-- No DELETE: exactly one lock row per Stripe subscription id, for the
+-- life of that subscription — no cleanup concern distinct from the
+-- subscription itself.
+grant select, insert, update on public.subscription_reconciliation_locks to service_role;
+
+-- Atomically verifies the caller still holds the CURRENT reconciliation
+-- token for this subscription and, only if so, applies the canonical
+-- subscriptions upsert and the users.subscription_tier display-cache
+-- sync in the same transaction. Returns false ("lost ownership") without
+-- writing anything if a later reconciliation attempt has since replaced
+-- the token — the caller must treat that as a benign no-op, never a
+-- failure: some other attempt already applied a Stripe state that is, by
+-- construction, at least as current as this caller's own now-stale
+-- retrieve.
+--
+-- SELECT ... FOR UPDATE is load-bearing: it holds this subscription's
+-- lock row for the remainder of THIS transaction, so a concurrent
+-- acquire (a different reconciliation attempt replacing the token)
+-- cannot interleave between this function's ownership check and its
+-- write — the two are one atomic step, not merely two fast sequential
+-- statements that could race independently.
+create or replace function public.reconcile_subscription_if_owner(
+  p_stripe_subscription_id text,
+  p_reconciliation_token uuid,
+  p_user_id uuid,
+  p_stripe_customer_id text,
+  p_stripe_checkout_session_id text,
+  p_stripe_payment_intent_id text,
+  p_stripe_price_id text,
+  p_plan text,
+  p_billing_type text,
+  p_status text,
+  p_current_period_end timestamptz,
+  p_cancel_at_period_end boolean,
+  p_grace_period_ends_at timestamptz,
+  p_last_stripe_event_created_at timestamptz,
+  p_subscription_tier text
+)
+returns boolean
+language plpgsql
+security definer
+set search_path = pg_catalog, public
+as $$
+declare
+  v_is_current boolean;
+begin
+  select (reconciliation_token = p_reconciliation_token)
+    into v_is_current
+  from public.subscription_reconciliation_locks
+  where stripe_subscription_id = p_stripe_subscription_id
+  for update;
+
+  if v_is_current is not true then
+    return false;
+  end if;
+
+  insert into public.subscriptions (
+    user_id, stripe_customer_id, stripe_subscription_id,
+    stripe_checkout_session_id, stripe_payment_intent_id, stripe_price_id,
+    plan, billing_type, status, current_period_end, cancel_at_period_end,
+    grace_period_ends_at, last_stripe_event_created_at
+  ) values (
+    p_user_id, p_stripe_customer_id, p_stripe_subscription_id,
+    p_stripe_checkout_session_id, p_stripe_payment_intent_id, p_stripe_price_id,
+    p_plan, p_billing_type, p_status, p_current_period_end, p_cancel_at_period_end,
+    p_grace_period_ends_at, p_last_stripe_event_created_at
+  )
+  on conflict (user_id) do update set
+    stripe_customer_id = excluded.stripe_customer_id,
+    stripe_subscription_id = excluded.stripe_subscription_id,
+    stripe_checkout_session_id = excluded.stripe_checkout_session_id,
+    stripe_payment_intent_id = excluded.stripe_payment_intent_id,
+    stripe_price_id = excluded.stripe_price_id,
+    plan = excluded.plan,
+    billing_type = excluded.billing_type,
+    status = excluded.status,
+    current_period_end = excluded.current_period_end,
+    cancel_at_period_end = excluded.cancel_at_period_end,
+    grace_period_ends_at = excluded.grace_period_ends_at,
+    last_stripe_event_created_at = excluded.last_stripe_event_created_at;
+
+  update public.users
+  set subscription_tier = p_subscription_tier
+  where id = p_user_id;
+
+  return true;
+end;
+$$;
+
+revoke all on function public.reconcile_subscription_if_owner(
+  text, uuid, uuid, text, text, text, text, text, text, text,
+  timestamptz, boolean, timestamptz, timestamptz, text
+) from public;
+revoke execute on function public.reconcile_subscription_if_owner(
+  text, uuid, uuid, text, text, text, text, text, text, text,
+  timestamptz, boolean, timestamptz, timestamptz, text
+) from anon, authenticated;
+grant execute on function public.reconcile_subscription_if_owner(
+  text, uuid, uuid, text, text, text, text, text, text, text,
+  timestamptz, boolean, timestamptz, timestamptz, text
+) to service_role;
+
 commit;
```

### `src/app/api/webhooks/stripe/route.ts`

```diff
diff --git a/src/app/api/webhooks/stripe/route.ts b/src/app/api/webhooks/stripe/route.ts
index b88fdc14..db997d57 100644
--- a/src/app/api/webhooks/stripe/route.ts
+++ b/src/app/api/webhooks/stripe/route.ts
@@ -437,6 +437,9 @@ async function handleCheckoutSessionCompleted(supabase: SupabaseClient, event: S
     stripeCustomerId: customerId,
     stripeSubscriptionId: subscriptionId,
     eventCreatedIso,
+    // A Checkout Session object never carries subscription
+    // previous_attributes — there is never transition evidence here.
+    pastDueTransitionConfirmed: false,
     newRowUserId: userId,
     newCheckoutSessionId: session.id,
   })
@@ -451,6 +454,7 @@ async function handleSubscriptionLifecycleEvent(supabase: SupabaseClient, event:
     stripeCustomerId: customerId,
     stripeSubscriptionId: subscription.id,
     eventCreatedIso,
+    pastDueTransitionConfirmed: hasConfirmedPastDueTransition(event),
   })
 }
 
@@ -458,6 +462,14 @@ interface ReconcileSubscriptionInput {
   stripeCustomerId: string
   stripeSubscriptionId: string
   eventCreatedIso: string
+  /**
+   * True only when the triggering event's own payload proves it IS the
+   * exact transition into past_due (see hasConfirmedPastDueTransition) —
+   * used solely to decide whether eventCreatedIso is trustworthy as a
+   * grace-period anchor. checkout.session.completed never has this
+   * evidence (it carries a Checkout Session object, not a Subscription).
+   */
+  pastDueTransitionConfirmed: boolean
   /**
    * Supplied only by checkout.session.completed — the one caller that
    * authoritatively knows the user id and may need to create a brand-new
@@ -476,20 +488,34 @@ interface ReconcileSubscriptionInput {
  * guarantee arrives in order, and which checkout.session.completed and
  * customer.subscription.* can race against each other for the same
  * resubscribing customer — this always re-fetches the subscription's
- * CURRENT state directly from Stripe and writes that. A delivery that is
- * itself "old" (delayed, retried, processed out of order, or even sharing
- * the exact same `created` second as another event) still converges to
- * the same current Stripe truth as a "new" delivery would, so it can
- * never regress canonical state and never needs to guess at a total
- * order across events. Safe to call for a canceled subscription too:
- * Stripe keeps a canceled subscription retrievable indefinitely in its
- * terminal state, so customer.subscription.deleted uses this exact same
- * path rather than a separate handler.
+ * CURRENT state directly from Stripe and writes that. Safe to call for a
+ * canceled subscription too: a canceled subscription remains retrievable
+ * through the Subscription API in this supported flow, so
+ * customer.subscription.deleted uses this exact same path rather than a
+ * separate handler.
+ *
+ * Re-fetching current state alone is NOT sufficient to prevent a
+ * regression, though: a caller can retrieve a subscription's state and
+ * then stall (slow network, GC pause, frozen serverless instance) long
+ * enough for a DIFFERENT reconciliation attempt for the SAME subscription
+ * — a reclaim of the same event_id, or a wholly distinct event_id — to
+ * retrieve a newer state and write it first. The stalled caller would
+ * then resume and overwrite that newer state with its own, now-stale,
+ * snapshot. acquireReconciliationLock/writeSubscriptionIfOwner close that
+ * gap with a per-subscription fencing token: acquired here before the
+ * retrieve, and checked-and-consumed atomically (single-transaction
+ * SELECT ... FOR UPDATE + write, see reconcile_subscription_if_owner in
+ * the forward-fix migration) at the moment the canonical mutation is
+ * applied, so only the most-recently-acquired attempt for this
+ * subscription can ever write.
  */
 async function reconcileSubscriptionFromStripe(
   supabase: SupabaseClient,
   input: ReconcileSubscriptionInput,
 ): Promise<void> {
+  const reconciliationToken = randomUUID()
+  await acquireReconciliationLock(supabase, input.stripeSubscriptionId, reconciliationToken)
+
   const subscription = await stripe.subscriptions.retrieve(input.stripeSubscriptionId)
 
   const status = toKnownStatus(subscription.status)
@@ -525,9 +551,10 @@ async function reconcileSubscriptionFromStripe(
     status,
     input.eventCreatedIso,
     existing?.grace_period_ends_at ?? null,
+    input.pastDueTransitionConfirmed,
   )
 
-  await upsertSubscription(supabase, {
+  const ownershipRetained = await writeSubscriptionIfOwner(supabase, reconciliationToken, {
     userId,
     stripeCustomerId: input.stripeCustomerId,
     stripeSubscriptionId: subscription.id,
@@ -544,6 +571,19 @@ async function reconcileSubscriptionFromStripe(
     gracePeriodEndsAt,
     eventCreatedIso: input.eventCreatedIso,
   })
+
+  if (!ownershipRetained) {
+    // A later reconciliation attempt for this SAME Stripe subscription
+    // (a reclaim of this event_id, or a wholly distinct event_id) already
+    // retrieved and wrote a state that is, by construction, at least as
+    // current as this attempt's own now-stale retrieve — see
+    // writeSubscriptionIfOwner. Not writing here is the correct outcome,
+    // not a failure: the row already reflects Stripe truth.
+    console.warn(
+      '[stripe webhook] lost subscription reconciliation ownership — a newer reconciliation for this subscription already applied more current Stripe state; this attempt\'s write was skipped',
+      subscription.id,
+    )
+  }
 }
 
 /**
@@ -554,18 +594,57 @@ async function reconcileSubscriptionFromStripe(
  * only on the PREVIOUSLY STORED status vs. the newly reconciled one, both
  * read at the moment of this call, never on comparing event timestamps
  * against each other.
+ *
+ * The anchor for a FRESH grace period is NOT simply the triggering
+ * event's `created` timestamp. Reconciliation always re-fetches Stripe's
+ * CURRENT subscription state rather than trusting any event's embedded
+ * snapshot, so the delivery that happens to trigger a given
+ * reconciliation may be old, delayed, or unrelated to the actual moment
+ * the subscription became past_due — using its `created` time would then
+ * anchor (and can even backdate) the grace window to an arbitrary
+ * unrelated instant, silently shortening the customer's promised 7 days.
+ * `hasConfirmedTransition` is true only when THIS delivery's own payload
+ * proves it IS the transition event (see hasConfirmedPastDueTransition) —
+ * only then is its `created` timestamp trustworthy as the transition
+ * instant. Otherwise this fails safe by anchoring to `now`: the current
+ * moment is the earliest instant this reconciliation can prove the
+ * subscription was known to be past_due, so anchoring here can only ever
+ * be as generous as, or more generous than, the true (unproven)
+ * transition time — never shorter than the promised 7 days.
  */
 function computeGracePeriodEndsAt(
   previousStatus: StripeSubscriptionStatus | null,
   newStatus: StripeSubscriptionStatus,
   eventCreatedIso: string,
   existingGracePeriodEndsAt: string | null,
+  hasConfirmedTransition: boolean,
 ): string | null {
   if (newStatus !== 'past_due') return null
   if (previousStatus === 'past_due' && existingGracePeriodEndsAt) {
     return existingGracePeriodEndsAt
   }
-  return new Date(new Date(eventCreatedIso).getTime() + PAST_DUE_GRACE_PERIOD_MS).toISOString()
+  const anchor = hasConfirmedTransition ? new Date(eventCreatedIso) : new Date()
+  return new Date(anchor.getTime() + PAST_DUE_GRACE_PERIOD_MS).toISOString()
+}
+
+/**
+ * True only when THIS event's own payload proves it represents the exact
+ * transition into past_due. Stripe's `previous_attributes` on a
+ * customer.subscription.updated event includes a field only when that
+ * specific API operation actually changed it, so `status` appearing there
+ * (whatever its previous value) confirms this delivery's `created`
+ * timestamp really is the moment status changed — as opposed to an
+ * old/unrelated/retried delivery whose `created` time has no relationship
+ * to the transition at all. checkout.session.completed carries no such
+ * evidence (it is a Checkout Session, not a Subscription, object) and
+ * customer.subscription.created/deleted are not "transition INTO
+ * past_due" events by definition, so every other event type is false
+ * unconditionally.
+ */
+function hasConfirmedPastDueTransition(event: Stripe.Event): boolean {
+  if (event.type !== 'customer.subscription.updated') return false
+  const previousAttributes = (event.data as { previous_attributes?: Record<string, unknown> }).previous_attributes
+  return !!previousAttributes && Object.prototype.hasOwnProperty.call(previousAttributes, 'status')
 }
 
 async function fetchExistingByCustomerId(
@@ -624,6 +703,20 @@ async function upsertSubscription(supabase: SupabaseClient, input: UpsertInput)
  * marked 'processed' — see markProcessed.
  */
 async function syncUserDisplayTier(supabase: SupabaseClient, input: UpsertInput) {
+  const { error } = await supabase
+    .from('users')
+    .update({ subscription_tier: resolveSubscriptionTier(input) })
+    .eq('id', input.userId)
+
+  if (error) {
+    throw new Error(`[stripe webhook] failed to sync users.subscription_tier for user ${input.userId}: ${error.message}`)
+  }
+}
+
+/** Shared by both subscription-write paths — see syncUserDisplayTier and writeSubscriptionIfOwner. */
+function resolveSubscriptionTier(
+  input: Pick<UpsertInput, 'plan' | 'billingType' | 'status' | 'currentPeriodEnd' | 'cancelAtPeriodEnd' | 'gracePeriodEndsAt'>,
+): PurchasablePlan | 'free' {
   const entitlement = computeEntitlement({
     plan: input.plan,
     billing_type: input.billingType,
@@ -632,13 +725,77 @@ async function syncUserDisplayTier(supabase: SupabaseClient, input: UpsertInput)
     cancel_at_period_end: input.cancelAtPeriodEnd,
     grace_period_ends_at: input.gracePeriodEndsAt,
   })
+  return entitlement.entitled ? input.plan : 'free'
+}
 
-  const { error } = await supabase
-    .from('users')
-    .update({ subscription_tier: entitlement.entitled ? input.plan : 'free' })
-    .eq('id', input.userId)
+/**
+ * Acquires this subscription's reconciliation fencing token BEFORE the
+ * Stripe retrieve happens — see reconcileSubscriptionFromStripe. A plain
+ * upsert is sufficient (no compare-and-swap needed here, unlike
+ * tryReclaim): acquiring always succeeds and always wins the slot
+ * immediately, because Postgres serializes concurrent writers to the same
+ * row and whichever commits LAST is left as the current value — which is
+ * exactly the fencing-token property writeSubscriptionIfOwner relies on.
+ */
+async function acquireReconciliationLock(
+  supabase: SupabaseClient,
+  stripeSubscriptionId: string,
+  reconciliationToken: string,
+): Promise<void> {
+  const { error } = await supabase.from('subscription_reconciliation_locks').upsert(
+    {
+      stripe_subscription_id: stripeSubscriptionId,
+      reconciliation_token: reconciliationToken,
+      acquired_at: new Date().toISOString(),
+    },
+    { onConflict: 'stripe_subscription_id' },
+  )
 
   if (error) {
-    throw new Error(`[stripe webhook] failed to sync users.subscription_tier for user ${input.userId}: ${error.message}`)
+    throw new Error(
+      `[stripe webhook] failed to acquire reconciliation lock for subscription ${stripeSubscriptionId}: ${error.message}`,
+    )
   }
 }
+
+/**
+ * Atomically verifies reconciliationToken is still the CURRENT token for
+ * this subscription and, only if so, applies the canonical subscriptions
+ * upsert and the users.subscription_tier sync in one database transaction
+ * — see reconcile_subscription_if_owner in the forward-fix migration.
+ * Returns false ("lost ownership") without writing anything if a later
+ * reconciliation attempt has since replaced the token via
+ * acquireReconciliationLock; the caller must treat that as a benign
+ * no-op, never a failure.
+ */
+async function writeSubscriptionIfOwner(
+  supabase: SupabaseClient,
+  reconciliationToken: string,
+  input: Omit<UpsertInput, 'stripeSubscriptionId'> & { stripeSubscriptionId: string },
+): Promise<boolean> {
+  const { data, error } = await supabase.rpc('reconcile_subscription_if_owner', {
+    p_stripe_subscription_id: input.stripeSubscriptionId,
+    p_reconciliation_token: reconciliationToken,
+    p_user_id: input.userId,
+    p_stripe_customer_id: input.stripeCustomerId,
+    p_stripe_checkout_session_id: input.stripeCheckoutSessionId,
+    p_stripe_payment_intent_id: input.stripePaymentIntentId,
+    p_stripe_price_id: input.stripePriceId,
+    p_plan: input.plan,
+    p_billing_type: input.billingType,
+    p_status: input.status,
+    p_current_period_end: input.currentPeriodEnd,
+    p_cancel_at_period_end: input.cancelAtPeriodEnd,
+    p_grace_period_ends_at: input.gracePeriodEndsAt,
+    p_last_stripe_event_created_at: input.eventCreatedIso,
+    p_subscription_tier: resolveSubscriptionTier(input),
+  })
+
+  if (error) {
+    throw new Error(
+      `[stripe webhook] reconcile_subscription_if_owner RPC failed for subscription ${input.stripeSubscriptionId}: ${error.message}`,
+    )
+  }
+
+  return data === true
+}
```

### `src/app/api/webhooks/stripe/route.test.ts`

```diff
diff --git a/src/app/api/webhooks/stripe/route.test.ts b/src/app/api/webhooks/stripe/route.test.ts
index d8fcb4a1..52bbd9c2 100644
--- a/src/app/api/webhooks/stripe/route.test.ts
+++ b/src/app/api/webhooks/stripe/route.test.ts
@@ -66,6 +66,10 @@ interface SupabaseMockOptions {
   selectSubscriptionResult?: { data: unknown; error: unknown };
   upsertResult?: { error: unknown };
   updateUsersResult?: { error: unknown };
+  /** Response to acquireReconciliationLock: subscription_reconciliation_locks.upsert(...) */
+  lockUpsertResult?: { error: unknown };
+  /** Response to the reconcile_subscription_if_owner RPC: data=true means ownership retained and the write applied; data=false means lost ownership, nothing written. */
+  reconcileRpcResult?: { data: boolean | null; error: unknown };
 }
 
 function makeSupabaseMock(options: SupabaseMockOptions = {}) {
@@ -89,15 +93,21 @@ function makeSupabaseMock(options: SupabaseMockOptions = {}) {
   const eqForUsersUpdate = vi.fn().mockResolvedValue(options.updateUsersResult ?? { error: null });
   const updateUsers = vi.fn().mockReturnValue({ eq: eqForUsersUpdate });
 
+  const lockUpsert = vi.fn().mockResolvedValue(options.lockUpsertResult ?? { error: null });
+
+  const rpc = vi.fn().mockResolvedValue(options.reconcileRpcResult ?? { data: true, error: null });
+
   const from = vi.fn((table: string) => {
     if (table === "stripe_webhook_events") return { insert: insertEvents, select: selectEvents, update: updateEvents };
     if (table === "subscriptions") return { select: selectSubscriptions, upsert };
+    if (table === "subscription_reconciliation_locks") return { upsert: lockUpsert };
     if (table === "users") return { update: updateUsers };
     throw new Error(`unexpected table: ${table}`);
   });
 
   return {
     from,
+    rpc,
     insertEvents,
     selectEvents,
     updateEvents,
@@ -107,6 +117,7 @@ function makeSupabaseMock(options: SupabaseMockOptions = {}) {
     upsert,
     updateUsers,
     eqForUsersUpdate,
+    lockUpsert,
   };
 }
 
@@ -119,6 +130,13 @@ function makeSupabaseMock(options: SupabaseMockOptions = {}) {
  */
 function makeStatefulSupabaseMock(initialRow: Record<string, unknown> | null) {
   let currentRow = initialRow;
+  let usersTier: string | null = null;
+  // Models the single-row subscription_reconciliation_locks state for
+  // "sub_1" (the only subscription id used by these stateful tests): an
+  // upsert unconditionally overwrites it (real Postgres semantics for a
+  // single-row PK — whichever write commits LAST wins), and the RPC below
+  // only applies a write when its token still matches this current value.
+  let currentLockToken: string | null = null;
   let eventCounter = 0;
 
   const insertEvents = vi.fn().mockImplementation(() => {
@@ -132,6 +150,9 @@ function makeStatefulSupabaseMock(initialRow: Record<string, unknown> | null) {
   const eqForSelect = vi.fn().mockReturnValue({ maybeSingle });
   const selectSubscriptions = vi.fn().mockReturnValue({ eq: eqForSelect });
 
+  // Retained for the LIFETIME (one-time-payment) path, which still writes
+  // directly — it never retrieves external Stripe state, so it has no
+  // analogous stale-overwrite race and needs no reconciliation lock.
   const upsert = vi.fn().mockImplementation((payload: Record<string, unknown>) => {
     currentRow = { ...currentRow, ...payload };
     return Promise.resolve({ error: null });
@@ -140,32 +161,79 @@ function makeStatefulSupabaseMock(initialRow: Record<string, unknown> | null) {
   const eqForUsersUpdate = vi.fn().mockResolvedValue({ error: null });
   const updateUsers = vi.fn().mockReturnValue({ eq: eqForUsersUpdate });
 
+  const lockUpsert = vi.fn().mockImplementation((payload: Record<string, unknown>) => {
+    currentLockToken = payload.reconciliation_token as string;
+    return Promise.resolve({ error: null });
+  });
+
+  const rpc = vi.fn().mockImplementation((fnName: string, params: Record<string, unknown>) => {
+    if (fnName !== "reconcile_subscription_if_owner") {
+      throw new Error(`unexpected rpc: ${fnName}`);
+    }
+    if (params.p_reconciliation_token !== currentLockToken) {
+      return Promise.resolve({ data: false, error: null });
+    }
+    currentRow = {
+      ...currentRow,
+      user_id: params.p_user_id,
+      stripe_customer_id: params.p_stripe_customer_id,
+      stripe_subscription_id: params.p_stripe_subscription_id,
+      stripe_checkout_session_id: params.p_stripe_checkout_session_id,
+      stripe_payment_intent_id: params.p_stripe_payment_intent_id,
+      stripe_price_id: params.p_stripe_price_id,
+      plan: params.p_plan,
+      billing_type: params.p_billing_type,
+      status: params.p_status,
+      current_period_end: params.p_current_period_end,
+      cancel_at_period_end: params.p_cancel_at_period_end,
+      grace_period_ends_at: params.p_grace_period_ends_at,
+      last_stripe_event_created_at: params.p_last_stripe_event_created_at,
+    };
+    usersTier = params.p_subscription_tier as string;
+    return Promise.resolve({ data: true, error: null });
+  });
+
   const from = vi.fn((table: string) => {
     if (table === "stripe_webhook_events") return { insert: insertEvents, select: selectEvents, update: updateEvents };
     if (table === "subscriptions") return { select: selectSubscriptions, upsert };
+    if (table === "subscription_reconciliation_locks") return { upsert: lockUpsert };
     if (table === "users") return { update: updateUsers };
     throw new Error(`unexpected table: ${table}`);
   });
 
   return {
     from,
+    rpc,
     upsert,
     getCurrentRow: () => currentRow,
+    getUsersTier: () => usersTier,
     get eventCount() {
       return eventCounter;
     },
   };
 }
 
-function stripeEvent(overrides: { id?: string; type: string; created?: number; object: unknown }) {
+function stripeEvent(overrides: {
+  id?: string;
+  type: string;
+  created?: number;
+  object: unknown;
+  /** Stripe's own evidence of what changed in this exact update — see hasConfirmedPastDueTransition. */
+  previousAttributes?: Record<string, unknown>;
+}) {
   return {
     id: overrides.id ?? "evt_1",
     type: overrides.type,
     created: overrides.created ?? 1_750_000_000,
-    data: { object: overrides.object },
+    data: { object: overrides.object, previous_attributes: overrides.previousAttributes },
   };
 }
 
+/** Flushes pending microtasks/timers so a stalled `await` elsewhere has a chance to run before we proceed — used to interleave two concurrent POST calls deterministically in the reconciliation-ownership race tests below. */
+function flushAsync() {
+  return new Promise((resolve) => setTimeout(resolve, 0));
+}
+
 /** A fake Stripe.Subscription as returned by stripe.subscriptions.retrieve — the ONLY source of truth reconcileSubscriptionFromStripe writes from. */
 function fakeStripeSubscription(overrides: {
   id?: string;
@@ -243,20 +311,30 @@ describe("POST /api/webhooks/stripe", () => {
 
     expect(response.status).toBe(200);
     expect(retrieveSubscriptionMock).toHaveBeenCalledWith("sub_1");
-    expect(supabase.upsert).toHaveBeenCalledWith(
+    // The reconciliation lock is acquired BEFORE the Stripe retrieve.
+    expect(supabase.lockUpsert).toHaveBeenCalledWith(
+      expect.objectContaining({ stripe_subscription_id: "sub_1", reconciliation_token: expect.any(String) }),
+      { onConflict: "stripe_subscription_id" },
+    );
+    expect(retrieveSubscriptionMock.mock.invocationCallOrder[0]).toBeGreaterThan(
+      supabase.lockUpsert.mock.invocationCallOrder[0],
+    );
+    // The canonical write (subscriptions + users.subscription_tier, both
+    // atomically) goes through the ownership-checked RPC, not a plain
+    // client-side upsert — see writeSubscriptionIfOwner.
+    expect(supabase.rpc).toHaveBeenCalledWith(
+      "reconcile_subscription_if_owner",
       expect.objectContaining({
-        user_id: "user-1",
-        stripe_customer_id: "cus_1",
-        stripe_subscription_id: "sub_1",
-        stripe_checkout_session_id: "cs_1",
-        plan: "premium",
-        billing_type: "recurring",
-        status: "active",
+        p_user_id: "user-1",
+        p_stripe_customer_id: "cus_1",
+        p_stripe_subscription_id: "sub_1",
+        p_stripe_checkout_session_id: "cs_1",
+        p_plan: "premium",
+        p_billing_type: "recurring",
+        p_status: "active",
+        p_subscription_tier: "premium",
       }),
-      { onConflict: "user_id" },
     );
-    expect(supabase.updateUsers).toHaveBeenCalledWith({ subscription_tier: "premium" });
-    expect(supabase.eqForUsersUpdate).toHaveBeenCalledWith("id", "user-1");
     expect(supabase.updateEvents).toHaveBeenCalledWith(
       expect.objectContaining({ status: "processed", processed_at: expect.any(String) }),
     );
@@ -304,6 +382,11 @@ describe("POST /api/webhooks/stripe", () => {
       // The event's own payload is deliberately minimal — reconciliation
       // never reads status/price/period from it, only customer + id.
       object: { id: "sub_1", customer: "cus_1" },
+      // previous_attributes.status present proves THIS delivery is the
+      // actual active→past_due transition — see
+      // hasConfirmedPastDueTransition — which is what makes anchoring the
+      // grace period to this event's `created` time correct.
+      previousAttributes: { status: "active" },
     });
     constructEventMock.mockReturnValue(event);
     retrieveSubscriptionMock.mockResolvedValue(
@@ -330,13 +413,68 @@ describe("POST /api/webhooks/stripe", () => {
     const response = await POST(makeRequest("{}"));
 
     expect(response.status).toBe(200);
-    const upsertPayload = supabase.upsert.mock.calls[0][0] as { status: string; grace_period_ends_at: string };
-    expect(upsertPayload.status).toBe("past_due");
-    const graceEndsAt = new Date(upsertPayload.grace_period_ends_at).getTime();
+    const rpcParams = supabase.rpc.mock.calls[0][1] as { p_status: string; p_grace_period_ends_at: string };
+    expect(rpcParams.p_status).toBe("past_due");
+    const graceEndsAt = new Date(rpcParams.p_grace_period_ends_at).getTime();
     const eventCreatedMs = eventCreated * 1000;
     expect(graceEndsAt - eventCreatedMs).toBe(7 * 24 * 60 * 60 * 1000);
   });
 
+  it("DELAYED OLD EVENT: an old/unrelated delivery that merely triggers a reconciliation while Stripe is CURRENTLY past_due does not backdate the grace period to that event's own (unrelated) created time", async () => {
+    vi.useFakeTimers();
+    const now = new Date("2026-06-15T00:00:00.000Z");
+    vi.setSystemTime(now);
+    try {
+      // An old event whose own update did NOT change status (no
+      // previous_attributes.status at all) — e.g. a delayed delivery for
+      // some unrelated field, long before the subscription actually
+      // became past_due. Its `created` time has no relationship to the
+      // real transition and must not be trusted as one.
+      const oldEventCreated = 1_600_000_000; // long before `now`
+      const event = stripeEvent({
+        type: "customer.subscription.updated",
+        created: oldEventCreated,
+        object: { id: "sub_1", customer: "cus_1" },
+        previousAttributes: { default_payment_method: "pm_old" },
+      });
+      constructEventMock.mockReturnValue(event);
+      // Stripe's CURRENT truth, fetched fresh, already past_due.
+      retrieveSubscriptionMock.mockResolvedValue(fakeStripeSubscription({ status: "past_due" }));
+      const supabase = makeSupabaseMock({
+        selectSubscriptionResult: {
+          data: {
+            user_id: "user-1",
+            status: "active", // our records have never seen past_due for this row yet
+            plan: "premium",
+            stripe_checkout_session_id: "cs_1",
+            stripe_payment_intent_id: null,
+            stripe_price_id: "price_premium_test",
+            current_period_end: null,
+            grace_period_ends_at: null,
+          },
+          error: null,
+        },
+      });
+      // eslint-disable-next-line @typescript-eslint/no-explicit-any
+      createServiceSupabaseClientMock.mockReturnValue(supabase as any);
+
+      const response = await POST(makeRequest("{}"));
+
+      expect(response.status).toBe(200);
+      const rpcParams = supabase.rpc.mock.calls[0][1] as { p_status: string; p_grace_period_ends_at: string };
+      expect(rpcParams.p_status).toBe("past_due");
+      const graceEndsAt = new Date(rpcParams.p_grace_period_ends_at).getTime();
+      // NOT anchored to the old event's created time (which would grant
+      // far less than 7 days, or even a deadline already in the past).
+      expect(graceEndsAt - oldEventCreated * 1000).not.toBe(7 * 24 * 60 * 60 * 1000);
+      // Anchored to "now" instead — the safe fallback that can never grant
+      // less than the promised 7 days.
+      expect(graceEndsAt - now.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
+    } finally {
+      vi.useRealTimers();
+    }
+  });
+
   it("OLDER EVENT AFTER NEWER STATE: reconciles to Stripe's CURRENT retrieved state, never to the stale event's own embedded fields", async () => {
     const event = stripeEvent({
       type: "customer.subscription.updated",
@@ -378,12 +516,12 @@ describe("POST /api/webhooks/stripe", () => {
 
     expect(response.status).toBe(200);
     expect(retrieveSubscriptionMock).toHaveBeenCalledWith("sub_1");
-    expect(supabase.upsert).toHaveBeenCalledWith(
+    expect(supabase.rpc).toHaveBeenCalledWith(
+      "reconcile_subscription_if_owner",
       expect.objectContaining({
-        status: "past_due", // from retrieve, NOT the stale event's "active"
-        grace_period_ends_at: "2026-01-01T00:00:00.000Z", // preserved, not reset
+        p_status: "past_due", // from retrieve, NOT the stale event's "active"
+        p_grace_period_ends_at: "2026-01-01T00:00:00.000Z", // preserved, not reset
       }),
-      { onConflict: "user_id" },
     );
   });
 
@@ -461,9 +599,9 @@ describe("POST /api/webhooks/stripe", () => {
     const response = await POST(makeRequest("{}"));
 
     expect(response.status).toBe(200);
-    expect(supabase.upsert).toHaveBeenCalledWith(
-      expect.objectContaining({ status: "past_due", grace_period_ends_at: "2026-01-01T00:00:00.000Z" }),
-      { onConflict: "user_id" },
+    expect(supabase.rpc).toHaveBeenCalledWith(
+      "reconcile_subscription_if_owner",
+      expect.objectContaining({ p_status: "past_due", p_grace_period_ends_at: "2026-01-01T00:00:00.000Z" }),
     );
   });
 
@@ -499,11 +637,10 @@ describe("POST /api/webhooks/stripe", () => {
 
     expect(response.status).toBe(200);
     expect(retrieveSubscriptionMock).toHaveBeenCalledWith("sub_1");
-    expect(supabase.upsert).toHaveBeenCalledWith(
-      expect.objectContaining({ status: "canceled", cancel_at_period_end: false }),
-      { onConflict: "user_id" },
+    expect(supabase.rpc).toHaveBeenCalledWith(
+      "reconcile_subscription_if_owner",
+      expect.objectContaining({ p_status: "canceled", p_cancel_at_period_end: false, p_subscription_tier: "free" }),
     );
-    expect(supabase.updateUsers).toHaveBeenCalledWith({ subscription_tier: "free" });
   });
 
   it("GRACE RECOVERY: does not reset the grace window on repeated past_due, clears it on recovery, and starts a fresh one on a later past_due", async () => {
@@ -520,18 +657,21 @@ describe("POST /api/webhooks/stripe", () => {
     // eslint-disable-next-line @typescript-eslint/no-explicit-any
     createServiceSupabaseClientMock.mockReturnValue(supabase as any);
 
-    function subscriptionUpdated(id: string, created: number) {
+    function subscriptionUpdated(id: string, created: number, previousAttributes?: Record<string, unknown>) {
       return stripeEvent({
         id,
         type: "customer.subscription.updated",
         created,
         object: { id: "sub_1", customer: "cus_1" },
+        previousAttributes,
       });
     }
 
     // 1) First transition into past_due — starts a 7-day grace window.
+    //    previous_attributes.status proves this delivery IS the
+    //    active→past_due transition, so its created time anchors the grace.
     const t1 = 1_750_000_000;
-    constructEventMock.mockReturnValueOnce(subscriptionUpdated("evt_1", t1));
+    constructEventMock.mockReturnValueOnce(subscriptionUpdated("evt_1", t1, { status: "active" }));
     retrieveSubscriptionMock.mockResolvedValueOnce(fakeStripeSubscription({ status: "past_due", currentPeriodEnd: t1 + 1000 }));
     await POST(makeRequest("{}"));
     const firstGrace = supabase.getCurrentRow()?.grace_period_ends_at as string;
@@ -554,9 +694,10 @@ describe("POST /api/webhooks/stripe", () => {
     expect(supabase.getCurrentRow()?.status).toBe("active");
 
     // 4) A later, independent past_due transition starts a NEW 7-day
-    //    window — not a reuse of the first one.
+    //    window — not a reuse of the first one. Again backed by genuine
+    //    transition evidence.
     const t4 = t3 + 1000;
-    constructEventMock.mockReturnValueOnce(subscriptionUpdated("evt_4", t4));
+    constructEventMock.mockReturnValueOnce(subscriptionUpdated("evt_4", t4, { status: "active" }));
     retrieveSubscriptionMock.mockResolvedValueOnce(fakeStripeSubscription({ status: "past_due", currentPeriodEnd: t4 + 1000 }));
     await POST(makeRequest("{}"));
     const secondGrace = supabase.getCurrentRow()?.grace_period_ends_at as string;
@@ -581,7 +722,9 @@ describe("POST /api/webhooks/stripe", () => {
 
       // --- First delivery: claims cleanly, but the billing mutation itself fails. ---
       constructEventMock.mockReturnValueOnce(event);
-      const failingSupabase = makeSupabaseMock({ upsertResult: { error: { message: "connection reset" } } });
+      const failingSupabase = makeSupabaseMock({
+        reconcileRpcResult: { data: null, error: { message: "connection reset" } },
+      });
       // eslint-disable-next-line @typescript-eslint/no-explicit-any
       createServiceSupabaseClientMock.mockReturnValueOnce(failingSupabase as any);
 
@@ -606,7 +749,7 @@ describe("POST /api/webhooks/stripe", () => {
       const retryResponse = await POST(makeRequest("{}"));
 
       expect(retryResponse.status).toBe(200);
-      expect(retrySupabase.upsert).toHaveBeenCalled();
+      expect(retrySupabase.rpc).toHaveBeenCalled();
       expect(retrySupabase.updateEvents).toHaveBeenCalledWith(
         expect.objectContaining({ status: "processed" }),
       );
@@ -632,6 +775,7 @@ describe("POST /api/webhooks/stripe", () => {
       expect(body.duplicate).toBe(true);
       expect(retrieveSubscriptionMock).not.toHaveBeenCalled();
       expect(supabase.upsert).not.toHaveBeenCalled();
+      expect(supabase.rpc).not.toHaveBeenCalled();
       // Already terminal — must not even attempt a reclaim update.
       expect(supabase.updateEvents).not.toHaveBeenCalled();
     });
@@ -658,6 +802,7 @@ describe("POST /api/webhooks/stripe", () => {
       expect(body.duplicate).toBe(true);
       expect(retrieveSubscriptionMock).not.toHaveBeenCalled();
       expect(supabase.upsert).not.toHaveBeenCalled();
+      expect(supabase.rpc).not.toHaveBeenCalled();
       // Must not attempt to reclaim a claim that's still plausibly live.
       expect(supabase.updateEvents).not.toHaveBeenCalled();
     });
@@ -682,7 +827,7 @@ describe("POST /api/webhooks/stripe", () => {
       const response = await POST(makeRequest("{}"));
 
       expect(response.status).toBe(200);
-      expect(supabase.upsert).toHaveBeenCalled();
+      expect(supabase.rpc).toHaveBeenCalled();
       expect(supabase.updateEvents).toHaveBeenCalledWith(expect.objectContaining({ status: "processed" }));
     });
 
@@ -709,6 +854,7 @@ describe("POST /api/webhooks/stripe", () => {
       expect(body.duplicate).toBe(true);
       expect(retrieveSubscriptionMock).not.toHaveBeenCalled();
       expect(supabase.upsert).not.toHaveBeenCalled();
+      expect(supabase.rpc).not.toHaveBeenCalled();
     });
 
     it("CURRENT OWNER CAN MARK PROCESSED: finalizes using the exact claim_token this request itself was issued", async () => {
@@ -749,7 +895,9 @@ describe("POST /api/webhooks/stripe", () => {
       });
       constructEventMock.mockReturnValue(event);
       retrieveSubscriptionMock.mockResolvedValue(fakeStripeSubscription({ status: "active" }));
-      const supabase = makeSupabaseMock({ upsertResult: { error: { message: "connection reset" } } });
+      const supabase = makeSupabaseMock({
+        reconcileRpcResult: { data: null, error: { message: "connection reset" } },
+      });
       // eslint-disable-next-line @typescript-eslint/no-explicit-any
       createServiceSupabaseClientMock.mockReturnValue(supabase as any);
 
@@ -796,7 +944,7 @@ describe("POST /api/webhooks/stripe", () => {
       // whatever the reclaiming attempt establishes, not this one.
       expect(response.status).toBe(200);
       expect(body.duplicate).toBeUndefined();
-      expect(supabase.upsert).toHaveBeenCalled();
+      expect(supabase.rpc).toHaveBeenCalled();
     });
 
     it("STALE OWNER CANNOT MARK FAILED AFTER RECLAIM: the reclaiming attempt remains authoritative — this request does not pile a redundant retry on top of it", async () => {
@@ -807,7 +955,7 @@ describe("POST /api/webhooks/stripe", () => {
       constructEventMock.mockReturnValue(event);
       retrieveSubscriptionMock.mockResolvedValue(fakeStripeSubscription({ status: "active" }));
       const supabase = makeSupabaseMock({
-        upsertResult: { error: { message: "connection reset" } },
+        reconcileRpcResult: { data: null, error: { message: "connection reset" } },
         // Ownership was already lost to a reclaiming attempt by the time
         // this request tries to mark itself failed.
         ledgerFinalizeResult: { data: [], error: null },
@@ -826,4 +974,182 @@ describe("POST /api/webhooks/stripe", () => {
       expect(body.ownershipLost).toBe(true);
     });
   });
+
+  describe("subscription reconciliation ownership (Blocker 1 — distinct from the ledger claim_token above)", () => {
+    it("STALE SAME-EVENT WRITER: a claimant that retrieved Stripe state and then stalled cannot overwrite a reclaim of the SAME event_id that already wrote newer state", async () => {
+      const supabase = makeStatefulSupabaseMock({
+        user_id: "user-1",
+        status: "active",
+        plan: "premium",
+        stripe_checkout_session_id: "cs_1",
+        stripe_payment_intent_id: null,
+        stripe_price_id: "price_premium_test",
+        current_period_end: null,
+        grace_period_ends_at: null,
+      });
+      // eslint-disable-next-line @typescript-eslint/no-explicit-any
+      createServiceSupabaseClientMock.mockReturnValue(supabase as any);
+
+      // A: claims evt_1, acquires the reconciliation lock, then stalls on
+      // its Stripe retrieve — a slow request that hasn't crashed, just
+      // hasn't finished yet.
+      let resolveARetrieve: (value: unknown) => void = () => {};
+      const stalledRetrieve = new Promise((resolve) => {
+        resolveARetrieve = resolve;
+      });
+      const eventA = stripeEvent({ id: "evt_1", type: "customer.subscription.updated", object: { id: "sub_1", customer: "cus_1" } });
+      constructEventMock.mockReturnValueOnce(eventA);
+      retrieveSubscriptionMock.mockReturnValueOnce(stalledRetrieve);
+      const postA = POST(makeRequest("{}"));
+
+      // Let A run up through claiming the ledger row and acquiring the
+      // reconciliation lock before B starts.
+      await flushAsync();
+      expect(supabase.rpc).not.toHaveBeenCalled();
+
+      // B: reclaims the SAME event_id (this mock's ledger unconditionally
+      // accepts every claim; the real claim_token CAS that governs actual
+      // reclaim eligibility is covered by the "ledger claim/retry/
+      // duplicate/ownership semantics" tests above — this test isolates
+      // the SEPARATE subscription-lock mechanism). B retrieves and writes
+      // NEWER Stripe state, finishing completely before A resumes.
+      const eventB = stripeEvent({ id: "evt_1", type: "customer.subscription.updated", object: { id: "sub_1", customer: "cus_1" } });
+      constructEventMock.mockReturnValueOnce(eventB);
+      retrieveSubscriptionMock.mockResolvedValueOnce(fakeStripeSubscription({ status: "canceled" }));
+      const responseB = await POST(makeRequest("{}"));
+      expect(responseB.status).toBe(200);
+      expect(supabase.getCurrentRow()?.status).toBe("canceled");
+
+      // A resumes: its stalled retrieve finally resolves with the OLD
+      // state it originally fetched, before B ever ran.
+      resolveARetrieve(fakeStripeSubscription({ status: "past_due" }));
+      const responseA = await postA;
+      expect(responseA.status).toBe(200);
+
+      // B's write remains authoritative — A's stale resume must not
+      // regress the canonical state back to what it originally fetched.
+      expect(supabase.getCurrentRow()?.status).toBe("canceled");
+    });
+
+    it("DISTINCT EVENT CONCURRENCY: an older Stripe state fetched by one event_id cannot overwrite a newer reconciliation already applied by a wholly distinct, concurrently-processing event_id for the same subscription", async () => {
+      const supabase = makeStatefulSupabaseMock({
+        user_id: "user-1",
+        status: "active",
+        plan: "premium",
+        stripe_checkout_session_id: "cs_1",
+        stripe_payment_intent_id: null,
+        stripe_price_id: "price_premium_test",
+        current_period_end: null,
+        grace_period_ends_at: null,
+      });
+      // eslint-disable-next-line @typescript-eslint/no-explicit-any
+      createServiceSupabaseClientMock.mockReturnValue(supabase as any);
+
+      let resolveARetrieve: (value: unknown) => void = () => {};
+      const stalledRetrieve = new Promise((resolve) => {
+        resolveARetrieve = resolve;
+      });
+      // evt_a and evt_b are genuinely DISTINCT Stripe events (never a
+      // reclaim of one another) for the SAME underlying subscription.
+      const eventA = stripeEvent({ id: "evt_a", type: "customer.subscription.updated", object: { id: "sub_1", customer: "cus_1" } });
+      constructEventMock.mockReturnValueOnce(eventA);
+      retrieveSubscriptionMock.mockReturnValueOnce(stalledRetrieve);
+      const postA = POST(makeRequest("{}"));
+      await flushAsync();
+      expect(supabase.rpc).not.toHaveBeenCalled();
+
+      const eventB = stripeEvent({ id: "evt_b", type: "customer.subscription.updated", object: { id: "sub_1", customer: "cus_1" } });
+      constructEventMock.mockReturnValueOnce(eventB);
+      retrieveSubscriptionMock.mockResolvedValueOnce(fakeStripeSubscription({ status: "past_due" }));
+      const responseB = await POST(makeRequest("{}"));
+      expect(responseB.status).toBe(200);
+      expect(supabase.getCurrentRow()?.status).toBe("past_due");
+
+      // A's own (older, now-stale) fetched state resolves after B already
+      // committed a newer reconciliation under a completely unrelated
+      // event_id.
+      resolveARetrieve(fakeStripeSubscription({ status: "active" }));
+      const responseA = await postA;
+      expect(responseA.status).toBe(200);
+
+      // A's older fetch must not regress B's newer, already-committed state.
+      expect(supabase.getCurrentRow()?.status).toBe("past_due");
+    });
+
+    it("LOST OWNERSHIP: a stale reconciliation attempt cannot mutate the subscription row, and its own ledger outcome is unaffected by the skip", async () => {
+      const event = stripeEvent({
+        type: "checkout.session.completed",
+        object: { id: "cs_1", mode: "subscription", client_reference_id: "user-1", customer: "cus_1", subscription: "sub_1", metadata: { plan: "premium" } },
+      });
+      constructEventMock.mockReturnValue(event);
+      retrieveSubscriptionMock.mockResolvedValue(fakeStripeSubscription({ status: "active" }));
+      const supabase = makeSupabaseMock({
+        // Simulates a newer reconciliation attempt for this subscription
+        // having already replaced the reconciliation lock's token by the
+        // time this request's RPC call runs — reconcile_subscription_if_owner
+        // returns false without executing its INSERT/UPDATE statements.
+        reconcileRpcResult: { data: false, error: null },
+      });
+      // eslint-disable-next-line @typescript-eslint/no-explicit-any
+      createServiceSupabaseClientMock.mockReturnValue(supabase as any);
+
+      const response = await POST(makeRequest("{}"));
+
+      expect(supabase.rpc).toHaveBeenCalled();
+      expect(vi.mocked(console.warn)).toHaveBeenCalledWith(
+        expect.stringContaining("lost subscription reconciliation ownership"),
+        "sub_1",
+      );
+
+      // This event's OWN ledger outcome is entirely unaffected by losing
+      // the subscription-lock race — the two are independent mechanisms —
+      // and still finalizes normally as processed.
+      expect(response.status).toBe(200);
+      expect(supabase.updateEvents).toHaveBeenCalledWith(
+        expect.objectContaining({ status: "processed", processed_at: expect.any(String) }),
+      );
+    });
+
+    it("NORMAL OWNER: an uncontested reconciliation acquires the lock before retrieving Stripe state, writes the subscription atomically via the RPC, and finalizes the ledger normally", async () => {
+      const event = stripeEvent({
+        type: "customer.subscription.updated",
+        object: { id: "sub_1", customer: "cus_1" },
+      });
+      constructEventMock.mockReturnValue(event);
+      retrieveSubscriptionMock.mockResolvedValue(fakeStripeSubscription({ status: "active" }));
+      const supabase = makeSupabaseMock({
+        selectSubscriptionResult: {
+          data: {
+            user_id: "user-1",
+            status: "past_due",
+            plan: "premium",
+            stripe_checkout_session_id: "cs_1",
+            stripe_payment_intent_id: null,
+            stripe_price_id: "price_premium_test",
+            current_period_end: null,
+            grace_period_ends_at: "2026-01-01T00:00:00.000Z",
+          },
+          error: null,
+        },
+      });
+      // eslint-disable-next-line @typescript-eslint/no-explicit-any
+      createServiceSupabaseClientMock.mockReturnValue(supabase as any);
+
+      const response = await POST(makeRequest("{}"));
+
+      expect(response.status).toBe(200);
+      expect(supabase.lockUpsert).toHaveBeenCalledWith(
+        expect.objectContaining({ stripe_subscription_id: "sub_1" }),
+        { onConflict: "stripe_subscription_id" },
+      );
+      const lockToken = supabase.lockUpsert.mock.calls[0][0].reconciliation_token;
+      expect(supabase.rpc).toHaveBeenCalledWith(
+        "reconcile_subscription_if_owner",
+        expect.objectContaining({ p_reconciliation_token: lockToken, p_status: "active" }),
+      );
+      expect(supabase.updateEvents).toHaveBeenCalledWith(
+        expect.objectContaining({ status: "processed", processed_at: expect.any(String) }),
+      );
+    });
+  });
 });
```

*(`docs/stripe-subscription-migration-review.md` was also modified — it's the round-3 writeup doc, not reproduced in full here.)*

## 4. Complete SQL — new table + RPC + grants/RLS/security

```sql
create table public.subscription_reconciliation_locks (
  stripe_subscription_id text primary key,
  reconciliation_token uuid not null,
  acquired_at timestamptz not null default now()
);

alter table public.subscription_reconciliation_locks enable row level security;
-- No policies: service-role-only, same rationale as stripe_webhook_events.

revoke all on public.subscription_reconciliation_locks from anon, authenticated, service_role;
grant select, insert, update on public.subscription_reconciliation_locks to service_role;
-- No delete — one lock row per subscription, for its lifetime.

create or replace function public.reconcile_subscription_if_owner(
  p_stripe_subscription_id text,
  p_reconciliation_token uuid,
  p_user_id uuid,
  p_stripe_customer_id text,
  p_stripe_checkout_session_id text,
  p_stripe_payment_intent_id text,
  p_stripe_price_id text,
  p_plan text,
  p_billing_type text,
  p_status text,
  p_current_period_end timestamptz,
  p_cancel_at_period_end boolean,
  p_grace_period_ends_at timestamptz,
  p_last_stripe_event_created_at timestamptz,
  p_subscription_tier text
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_is_current boolean;
begin
  select (reconciliation_token = p_reconciliation_token)
    into v_is_current
  from public.subscription_reconciliation_locks
  where stripe_subscription_id = p_stripe_subscription_id
  for update;

  if v_is_current is not true then
    return false;
  end if;

  insert into public.subscriptions (
    user_id, stripe_customer_id, stripe_subscription_id,
    stripe_checkout_session_id, stripe_payment_intent_id, stripe_price_id,
    plan, billing_type, status, current_period_end, cancel_at_period_end,
    grace_period_ends_at, last_stripe_event_created_at
  ) values (
    p_user_id, p_stripe_customer_id, p_stripe_subscription_id,
    p_stripe_checkout_session_id, p_stripe_payment_intent_id, p_stripe_price_id,
    p_plan, p_billing_type, p_status, p_current_period_end, p_cancel_at_period_end,
    p_grace_period_ends_at, p_last_stripe_event_created_at
  )
  on conflict (user_id) do update set
    stripe_customer_id = excluded.stripe_customer_id,
    stripe_subscription_id = excluded.stripe_subscription_id,
    stripe_checkout_session_id = excluded.stripe_checkout_session_id,
    stripe_payment_intent_id = excluded.stripe_payment_intent_id,
    stripe_price_id = excluded.stripe_price_id,
    plan = excluded.plan,
    billing_type = excluded.billing_type,
    status = excluded.status,
    current_period_end = excluded.current_period_end,
    cancel_at_period_end = excluded.cancel_at_period_end,
    grace_period_ends_at = excluded.grace_period_ends_at,
    last_stripe_event_created_at = excluded.last_stripe_event_created_at;

  update public.users
  set subscription_tier = p_subscription_tier
  where id = p_user_id;

  return true;
end;
$$;

revoke all on function public.reconcile_subscription_if_owner(
  text, uuid, uuid, text, text, text, text, text, text, text,
  timestamptz, boolean, timestamptz, timestamptz, text
) from public;
revoke execute on function public.reconcile_subscription_if_owner(
  text, uuid, uuid, text, text, text, text, text, text, text,
  timestamptz, boolean, timestamptz, timestamptz, text
) from anon, authenticated;
grant execute on function public.reconcile_subscription_if_owner(
  text, uuid, uuid, text, text, text, text, text, text, text,
  timestamptz, boolean, timestamptz, timestamptz, text
) to service_role;
```

**Security posture**: `security definer` + `set search_path = pg_catalog, public` (fully qualified, no mutable search path — closes the classic SECURITY DEFINER search_path hijack vector), `revoke all` from `public`/`anon`/`authenticated` then `grant execute` only to `service_role`. Table itself has RLS enabled with zero policies and all grants revoked except `service_role` — matches the existing `stripe_webhook_events` pattern in the base migration.

## 5. Complete implementations

```typescript
async function reconcileSubscriptionFromStripe(
  supabase: SupabaseClient,
  input: ReconcileSubscriptionInput,
): Promise<void> {
  const reconciliationToken = randomUUID()
  await acquireReconciliationLock(supabase, input.stripeSubscriptionId, reconciliationToken)

  const subscription = await stripe.subscriptions.retrieve(input.stripeSubscriptionId)

  const status = toKnownStatus(subscription.status)
  if (!status) {
    throw new Error(`[stripe webhook] subscription ${subscription.id} has unrecognized status "${subscription.status}"`)
  }

  const item = subscription.items.data[0]
  const priceId = item?.price?.id ?? null
  const plan = planForPriceId(priceId)
  if (!plan) {
    throw new Error(`[stripe webhook] subscription ${subscription.id} has unrecognized price "${priceId}"`)
  }

  const existing = await fetchExistingByCustomerId(supabase, input.stripeCustomerId)

  const userId = existing?.user_id ?? input.newRowUserId
  if (!userId) {
    throw new Error(
      `[stripe webhook] subscription event for customer ${input.stripeCustomerId} has no existing row yet (checkout.session.completed may not have landed)`,
    )
  }

  const gracePeriodEndsAt = computeGracePeriodEndsAt(
    existing?.status ?? null,
    status,
    input.eventCreatedIso,
    existing?.grace_period_ends_at ?? null,
    input.pastDueTransitionConfirmed,
  )

  const ownershipRetained = await writeSubscriptionIfOwner(supabase, reconciliationToken, {
    userId,
    stripeCustomerId: input.stripeCustomerId,
    stripeSubscriptionId: subscription.id,
    stripeCheckoutSessionId: input.newCheckoutSessionId ?? existing?.stripe_checkout_session_id ?? null,
    stripePaymentIntentId: existing?.stripe_payment_intent_id ?? null,
    stripePriceId: priceId!,
    plan,
    billingType: 'recurring',
    status,
    currentPeriodEnd: item?.current_period_end
      ? new Date(item.current_period_end * 1000).toISOString()
      : null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
    gracePeriodEndsAt,
    eventCreatedIso: input.eventCreatedIso,
  })

  if (!ownershipRetained) {
    console.warn(
      '[stripe webhook] lost subscription reconciliation ownership — a newer reconciliation for this subscription already applied more current Stripe state; this attempt\'s write was skipped',
      subscription.id,
    )
  }
}

async function acquireReconciliationLock(
  supabase: SupabaseClient,
  stripeSubscriptionId: string,
  reconciliationToken: string,
): Promise<void> {
  const { error } = await supabase.from('subscription_reconciliation_locks').upsert(
    {
      stripe_subscription_id: stripeSubscriptionId,
      reconciliation_token: reconciliationToken,
      acquired_at: new Date().toISOString(),
    },
    { onConflict: 'stripe_subscription_id' },
  )

  if (error) {
    throw new Error(
      `[stripe webhook] failed to acquire reconciliation lock for subscription ${stripeSubscriptionId}: ${error.message}`,
    )
  }
}

async function writeSubscriptionIfOwner(
  supabase: SupabaseClient,
  reconciliationToken: string,
  input: Omit<UpsertInput, 'stripeSubscriptionId'> & { stripeSubscriptionId: string },
): Promise<boolean> {
  const { data, error } = await supabase.rpc('reconcile_subscription_if_owner', {
    p_stripe_subscription_id: input.stripeSubscriptionId,
    p_reconciliation_token: reconciliationToken,
    p_user_id: input.userId,
    p_stripe_customer_id: input.stripeCustomerId,
    p_stripe_checkout_session_id: input.stripeCheckoutSessionId,
    p_stripe_payment_intent_id: input.stripePaymentIntentId,
    p_stripe_price_id: input.stripePriceId,
    p_plan: input.plan,
    p_billing_type: input.billingType,
    p_status: input.status,
    p_current_period_end: input.currentPeriodEnd,
    p_cancel_at_period_end: input.cancelAtPeriodEnd,
    p_grace_period_ends_at: input.gracePeriodEndsAt,
    p_last_stripe_event_created_at: input.eventCreatedIso,
    p_subscription_tier: resolveSubscriptionTier(input),
  })

  if (error) {
    throw new Error(
      `[stripe webhook] reconcile_subscription_if_owner RPC failed for subscription ${input.stripeSubscriptionId}: ${error.message}`,
    )
  }

  return data === true
}

function hasConfirmedPastDueTransition(event: Stripe.Event): boolean {
  if (event.type !== 'customer.subscription.updated') return false
  const previousAttributes = (event.data as { previous_attributes?: Record<string, unknown> }).previous_attributes
  return !!previousAttributes && Object.prototype.hasOwnProperty.call(previousAttributes, 'status')
}

function computeGracePeriodEndsAt(
  previousStatus: StripeSubscriptionStatus | null,
  newStatus: StripeSubscriptionStatus,
  eventCreatedIso: string,
  existingGracePeriodEndsAt: string | null,
  hasConfirmedTransition: boolean,
): string | null {
  if (newStatus !== 'past_due') return null
  if (previousStatus === 'past_due' && existingGracePeriodEndsAt) {
    return existingGracePeriodEndsAt
  }
  const anchor = hasConfirmedTransition ? new Date(eventCreatedIso) : new Date()
  return new Date(anchor.getTime() + PAST_DUE_GRACE_PERIOD_MS).toISOString()
}
```

(`resolveSubscriptionTier` is the pre-existing `computeEntitlement`-driven logic, factored out so both `syncUserDisplayTier` — the lifetime/one-time path — and `writeSubscriptionIfOwner` compute the tier identically.)

## 6. Fencing algorithm, step by step

The mechanism: `subscription_reconciliation_locks` holds **one row per Stripe subscription id**, with a `reconciliation_token` (UUID) column. `acquireReconciliationLock` unconditionally upserts a fresh token for this attempt *before* calling `stripe.subscriptions.retrieve`. `reconcile_subscription_if_owner` later checks — atomically, with the write, in one transaction, under `SELECT ... FOR UPDATE` — whether that token is *still* the current one before writing anything.

**Scenario A — same event reclaimed after timeout**
1. Request A claims ledger row for `evt_1`, generates token `T_A`, upserts it into the lock row for `sub_1` (now `sub_1 → T_A`), then calls `stripe.subscriptions.retrieve` and stalls (slow network / frozen instance).
2. A's ledger claim goes stale (`PROCESSING_CLAIM_STALE_MS` elapses). Request B reclaims the *same* `evt_1` via the separate `claim_token` CAS on `stripe_webhook_events` (round-1/2 mechanism, untouched here).
3. B generates token `T_B`, upserts the lock row — since it's a single-row PK, the upsert simply replaces the value: `sub_1 → T_B`.
4. B retrieves current Stripe state and calls `reconcile_subscription_if_owner(sub_1, T_B, ...)`. The row's token equals `T_B` → `v_is_current = true` → subscriptions + users write commit, function returns `true`.
5. A finally resumes with its (now stale) retrieved state and calls `reconcile_subscription_if_owner(sub_1, T_A, ...)`. The row's token is now `T_B` ≠ `T_A` → `v_is_current = false` → function returns `false` without touching either table. A logs the "lost ownership" warning and moves on; A's own ledger row still finalizes as `processed` (independent mechanism, see §9).

**Scenario B — two distinct webhook event IDs for the same subscription**
Identical mechanism — the lock is keyed by `stripe_subscription_id`, not by event id, so it doesn't matter whether the racing attempts share an event id or not. Event A (`evt_a`) acquires `T_A`, stalls on retrieve. Event B (`evt_b`, a wholly unrelated delivery for the same subscription) starts concurrently, acquires `T_B` (overwriting the row), retrieves current state, and writes via the RPC — succeeds, token matches. A resumes, calls the RPC with its stale `T_A` — mismatch against the now-current `T_B` — returns `false`, no write.

**Scenario C — stale request resuming after a newer reconciliation completed (general case)**
This is the invariant both scenarios above rely on: whichever `acquireReconciliationLock` call is the *last to commit* before a given RPC call's `SELECT ... FOR UPDATE` runs owns the row at that instant. Postgres serializes concurrent writers to the same PK row — the last commit wins, and there is no code path where two different callers can each believe they hold the winning token simultaneously. The `FOR UPDATE` clause additionally guarantees that once an RPC invocation has read the row (taking the row lock for that transaction), no concurrent `acquireReconciliationLock` upsert on the same row can complete until that transaction ends — so the read-token-then-write step inside the RPC cannot be interleaved by a concurrent acquire. A stale caller's own `await` on `stripe.subscriptions.retrieve()` is what creates the "old" branch; the RPC call itself is what forces the up-to-date ownership check at the last possible moment, right before the mutation.

## 7. What makes the RPC atomic

`reconcile_subscription_if_owner` is a single PL/pgSQL function invoked through PostgREST's `rpc()` as one SQL statement. Postgres executes an entire function body invoked as a single statement within one implicit transaction: the `SELECT ... FOR UPDATE` ownership check, the `INSERT ... ON CONFLICT` upsert into `subscriptions`, and the `UPDATE public.users` all happen inside that same transaction. Two properties follow:

- **All-or-nothing**: if any statement inside raises (e.g. a constraint violation), the whole function aborts and none of the writes — not the subscriptions upsert, not the users update — take effect. There's no possible state where `subscriptions` reflects a new status but `users.subscription_tier` doesn't (or vice versa).
- **No interleaving on the ownership check**: `SELECT ... FOR UPDATE` takes a row-level lock on the specific `subscription_reconciliation_locks` row for the duration of the transaction. A concurrent `acquireReconciliationLock` upsert targeting the same row (an `UPDATE` under the hood, since it's a PK conflict) will block until this transaction commits or rolls back — so the "check the token, then apply the write" sequence can never be split by a race window; it behaves as one atomic step from the perspective of any other caller.

## 8. How the RPC proves ownership

- **Token**: a client-generated random UUID (`randomUUID()` from Node's `crypto`), one freshly minted per call to `reconcileSubscriptionFromStripe` — i.e. per reconciliation *attempt*, not per event or per subscription.
- **Where stored**: `public.subscription_reconciliation_locks.reconciliation_token`, one row per `stripe_subscription_id` (primary key). `acquireReconciliationLock` upserts it there *before* the Stripe retrieve, so the "current owner" is always whoever most recently started an attempt for that subscription.
- **Comparison**: inside the transaction, `reconcile_subscription_if_owner` does `select (reconciliation_token = p_reconciliation_token) into v_is_current ... for update`, then `if v_is_current is not true then return false`. Note this also fails safe if the row doesn't exist at all (`v_is_current` is `null`, not `true`).
- **If ownership changed**: the function returns `false` and executes neither the `subscriptions` upsert nor the `users` update. `writeSubscriptionIfOwner` propagates that as `false`; `reconcileSubscriptionFromStripe` treats it as a benign no-op — logs a `console.warn` and returns normally (no throw, no retry triggered). The event's own ledger row still gets marked `processed` (see next section).

## 9. Can a stale writer still update these tables?

- **`public.subscriptions`** — **No.** The only write path is `reconcile_subscription_if_owner`, and the `INSERT ... ON CONFLICT` statement is unreachable once `v_is_current is not true`.
- **`users.subscription_tier`** — **No**, for the reconciliation path specifically: the `UPDATE public.users` sits after the same ownership guard inside the same transaction, so it's unreachable under exactly the same condition. (The separate one-time/lifetime-purchase path, `upsertSubscription` → `syncUserDisplayTier`, still writes `users` directly without a lock — but that path never calls `stripe.subscriptions.retrieve`, so it has no analogous stale-overwrite race to guard against; see the test-file comment on `makeStatefulSupabaseMock`'s `upsert` mock.)
- **`stripe_webhook_events`** — **Yes, deliberately.** Losing the subscription-reconciliation race does not fail the request or block the ledger update. The "LOST OWNERSHIP" test asserts `response.status === 200` and `updateEvents` called with `status: "processed"` even when `reconcile_subscription_if_owner` returns `false`. This is correct by design: `stripe_webhook_events` and `subscription_reconciliation_locks` are two independent fencing mechanisms guarding two independent things — the first guards "did *this event* get a terminal outcome recorded," the second guards "did *this subscription's* row get the most current Stripe state." A request can legitimately lose the second race while still being the rightful (or reclaiming) owner of the first — its own event was still handled, it just didn't need to write subscription state because someone newer already did.

## 10. `past_due` transition detection

- **Qualifying event types**: only `customer.subscription.updated`. `hasConfirmedPastDueTransition` returns `false` immediately for every other `event.type` — including `checkout.session.completed` (hardcoded to `pastDueTransitionConfirmed: false` at the call site, since a Checkout Session object structurally never carries subscription `previous_attributes`) and `customer.subscription.created` / `customer.subscription.deleted` (neither can represent a transition *into* `past_due` by definition, and the function's type guard excludes them regardless).
- **Field inspected**: `event.data.previous_attributes`, specifically whether it has an *own property* named `status` — `Object.prototype.hasOwnProperty.call(previousAttributes, 'status')`. Stripe only includes a key in `previous_attributes` when that specific API operation actually changed that field, so the mere presence of the key (regardless of its value) is proof this exact delivery changed `status`.
- **When evidence is absent**: `hasConfirmedTransition` is `false`, and `computeGracePeriodEndsAt` anchors the fresh grace window to `new Date()` (wall-clock now) instead of `eventCreatedIso`.
- **Why the fallback can't shorten the 7-day promise**: reconciliation always re-fetches Stripe's *current* state rather than trusting the event's embedded snapshot, so the delivery that happens to trigger a reconciliation call may be arbitrarily old or unrelated to the actual transition instant. "Now" (the wall-clock moment the reconciliation code is actually running) is provably ≥ any real, already-occurred transition instant — you cannot process a webhook before the underlying Stripe event happened. So anchoring to "now" can only ever grant a grace deadline that is *later than or equal to* what anchoring to the true (but unproven) transition instant would have produced. It never grants less than the promised `PAST_DUE_GRACE_PERIOD_MS` (7 days) from the earliest safe instant; it can only ever be more generous when the true transition time can't be proven.

## 11. The 5 new tests

1. **`DELAYED OLD EVENT: an old/unrelated delivery that merely triggers a reconciliation while Stripe is CURRENTLY past_due does not backdate the grace period to that event's own (unrelated) created time`** — proves the grace-period backdating fix: an old event with no `previous_attributes.status` evidence anchors the new 7-day window to `now`, not to its own stale `created` timestamp.
2. **`STALE SAME-EVENT WRITER: a claimant that retrieved Stripe state and then stalled cannot overwrite a reclaim of the SAME event_id that already wrote newer state`** — proves fencing scenario A (§6): a stalled request resuming after its *own event_id* was reclaimed and already wrote newer state cannot regress it.
3. **`DISTINCT EVENT CONCURRENCY: an older Stripe state fetched by one event_id cannot overwrite a newer reconciliation already applied by a wholly distinct, concurrently-processing event_id for the same subscription`** — proves fencing scenario B (§6): the lock is keyed by subscription id, not event id, so two genuinely unrelated event ids racing on the same subscription are fenced identically.
4. **`LOST OWNERSHIP: a stale reconciliation attempt cannot mutate the subscription row, and its own ledger outcome is unaffected by the skip`** — proves the two independent-mechanism claim in §9: `reconcile_subscription_if_owner` returning `false` blocks the subscription/user writes but still lets the event's own ledger row finalize as `processed`.
5. **`NORMAL OWNER: an uncontested reconciliation acquires the lock before retrieving Stripe state, writes the subscription atomically via the RPC, and finalizes the ledger normally`** — proves the happy path: lock acquired strictly before `stripe.subscriptions.retrieve`, the exact acquired token is what's passed to the RPC, and the ledger still finalizes normally.

## 12. Validation

| Check | Result |
|---|---|
| `npx tsc --noEmit` | Clean — no errors |
| `npm run lint` (`next lint`) | Passes — only 2 pre-existing, unrelated warnings (`layout.tsx` custom font, `Avatar.tsx` `<img>` vs `next/image`) |
| `npm run test:ci` (vitest) | **824/824 passed**, 104/104 test files |
| `npm run build` (`next build`) | Succeeds — all 63 routes compiled/prerendered, including `/api/webhooks/stripe` |

## 13. No live DB mutation

Confirmed. This review ran only local, non-mutating commands: `git status`/`diff`/`rev-parse`/`reflog`/`log`, and `npx tsc`, `npm run lint`, `npm run test:ci`, `npm run build`. No Supabase MCP tool (`apply_migration`, `execute_sql`, etc.) was invoked at any point, and none of the above commands touch a remote database. The migration file remains exactly what it is: an unapplied `.sql` file under `database/`.

## 14. HEAD confirmation

```
$ git rev-parse HEAD
68042f98d501fb1e3bf3bc13debf28ea38c05384
```
Matches the required commit exactly. `git reflog` shows no commits after it; `git status --short` shows the identical uncommitted file set throughout the review.

## 15. STOP.

No commits, pushes, migrations, merges, or further edits were made. Working tree left exactly as found.
