import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import { createServiceSupabaseClient } from '@/lib/supabase/service'
import {
  computeEntitlement,
  PAST_DUE_GRACE_PERIOD_MS,
  type BillingStatus,
  type BillingType,
} from '@/lib/entitlement'
import { isPurchasablePlan, planForPriceId, priceIdForPlan, type PurchasablePlan } from '@/lib/stripe/plans'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

const webhookSecret = env.STRIPE_WEBHOOK_SECRET!

/**
 * How long a 'processing' ledger claim is trusted as "someone is actively
 * handling this right now" before it's treated as abandoned (the claiming
 * request crashed/timed out without reaching markProcessed/markFailed) and
 * becomes eligible for another request to reclaim and retry. Generous
 * relative to real webhook processing time (a handful of DB round trips),
 * short enough that a genuine crash doesn't block retries indefinitely —
 * Stripe's own retry schedule spans hours/days, so the next natural retry
 * will find the claim stale and proceed.
 */
const PROCESSING_CLAIM_STALE_MS = 60_000

/** Stripe's subscription status enum minus 'none' (a real subscription always has one of these). */
type StripeSubscriptionStatus = Exclude<BillingStatus, 'none'>

const KNOWN_SUBSCRIPTION_STATUSES: readonly StripeSubscriptionStatus[] = [
  'active',
  'trialing',
  'past_due',
  'paused',
  'unpaid',
  'incomplete',
  'incomplete_expired',
  'canceled',
]

function toKnownStatus(status: string): StripeSubscriptionStatus | null {
  return (KNOWN_SUBSCRIPTION_STATUSES as readonly string[]).includes(status)
    ? (status as StripeSubscriptionStatus)
    : null
}

interface ExistingSubscriptionRow {
  user_id: string
  status: StripeSubscriptionStatus
  plan: PurchasablePlan
  stripe_checkout_session_id: string | null
  stripe_payment_intent_id: string | null
  stripe_price_id: string | null
  current_period_end: string | null
  grace_period_ends_at: string | null
}

interface UpsertInput {
  userId: string
  stripeCustomerId: string
  stripeSubscriptionId: string | null
  stripeCheckoutSessionId: string | null
  stripePaymentIntentId: string | null
  stripePriceId: string
  plan: PurchasablePlan
  billingType: BillingType
  status: StripeSubscriptionStatus
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  gracePeriodEndsAt: string | null
  eventCreatedIso: string
}

type ClaimOutcome = { outcome: 'duplicate' } | { outcome: 'claimed'; claimToken: string }
type FinalizeOutcome = 'finalized' | 'lost_ownership'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceSupabaseClient()
  const eventCreatedIso = new Date(event.created * 1000).toISOString()

  // Held across the try/catch so a processing failure can finalize the
  // SAME claim this request won — never a stranger's. Stays null until
  // claimEvent actually wins ownership.
  let claimToken: string | null = null

  try {
    const claim = await claimEvent(supabase, event.id, event.type, eventCreatedIso)

    if (claim.outcome === 'duplicate') {
      // Covers three cases the caller can't tell apart and doesn't need to:
      // this exact event was already fully processed, a concurrent request
      // is actively processing it right now, or a concurrent request just
      // won the race to reclaim it. In every case, this request must not
      // touch billing state — the owning request (this one or the other)
      // is responsible for the outcome.
      return NextResponse.json({ received: true, duplicate: true })
    }

    // claim.outcome === 'claimed': this request now exclusively owns
    // processing this event_id, identified by claimToken. Nothing below
    // may return successfully without either completing the required
    // mutation or throwing.
    claimToken = claim.claimToken

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(supabase, event)
        break
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionLifecycleEvent(supabase, event)
        break
      default:
        console.log(`[stripe webhook] unhandled event type: ${event.type}`)
    }

    const finalizeResult = await markProcessed(supabase, event.id, claimToken)
    if (finalizeResult === 'lost_ownership') {
      // A later attempt reclaimed this event_id as abandoned before we
      // finished (we were merely slow, not actually dead) and now owns
      // the ledger outcome. The mutation THIS request just performed
      // already committed and is safe to have run twice — every handler
      // above converges to Stripe's own current state rather than
      // applying a one-shot delta — so there is nothing left to retry.
      // Responding 200 avoids piling a redundant extra Stripe retry on
      // top of the reclaiming attempt's own response.
      console.warn(
        '[stripe webhook] lost ledger ownership before finalizing as processed — a later attempt already reclaimed this event; not retried',
        event.id,
        event.type,
      )
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[stripe webhook] processing failed — event left retryable', event.id, event.type, error)

    if (claimToken) {
      const finalizeResult = await markFailed(supabase, event.id, claimToken)
      if (finalizeResult === 'lost_ownership') {
        // Same reasoning as the success path above, mirrored for
        // failure: a later attempt already owns this event_id, so its
        // own response (success or failure) is what should drive any
        // further Stripe retry — this request adding a 500 on top would
        // just be a redundant third attempt.
        console.warn(
          '[stripe webhook] lost ledger ownership while marking failed — a later attempt already reclaimed this event; not retried further',
          event.id,
          event.type,
        )
        return NextResponse.json({ received: true, ownershipLost: true })
      }
    }

    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

/**
 * Claims exclusive ownership of processing this event_id, or reports that
 * someone else already has (or already finished) — see ClaimOutcome. A
 * successful claim (fresh or reclaimed) always returns a freshly-generated
 * claimToken that is this attempt's, and only this attempt's, proof of
 * ownership — see markProcessed/markFailed. Never mutates billing state
 * itself.
 */
async function claimEvent(
  supabase: SupabaseClient,
  eventId: string,
  eventType: string,
  eventCreatedIso: string,
): Promise<ClaimOutcome> {
  const nowIso = new Date().toISOString()
  const claimToken = randomUUID()

  const { error: insertError } = await supabase.from('stripe_webhook_events').insert({
    event_id: eventId,
    event_type: eventType,
    event_created_at: eventCreatedIso,
    status: 'processing',
    started_at: nowIso,
    claim_token: claimToken,
  })

  if (!insertError) return { outcome: 'claimed', claimToken }

  if (insertError.code !== '23505') {
    throw new Error(`[stripe webhook] failed to claim event ${eventId}: ${insertError.message}`)
  }

  // Unique violation: a ledger row for this event_id already exists.
  const { data: existingRow, error: fetchError } = await supabase
    .from('stripe_webhook_events')
    .select('status, started_at')
    .eq('event_id', eventId)
    .maybeSingle()

  if (fetchError || !existingRow) {
    throw new Error(
      `[stripe webhook] claim conflict on event ${eventId} but could not read the existing ledger row` +
        (fetchError ? `: ${fetchError.message}` : ' (row missing)'),
    )
  }

  if (existingRow.status === 'processed') {
    return { outcome: 'duplicate' }
  }

  if (existingRow.status === 'failed') {
    // RETRY OF FAILED EVENT: reclaim it under a BRAND NEW claim token. A
    // compare-and-swap UPDATE (WHERE status = 'failed') means at most one
    // concurrent retry wins; the other sees 0 rows affected and backs off
    // as a duplicate rather than processing the same event twice.
    const reclaimToken = randomUUID()
    const reclaimed = await tryReclaim(supabase, eventId, { status: 'failed' }, reclaimToken)
    return reclaimed ? { outcome: 'claimed', claimToken: reclaimToken } : { outcome: 'duplicate' }
  }

  // status === 'processing': either a genuinely concurrent delivery of the
  // same event (Stripe does sometimes do this), or an orphaned claim from a
  // request that crashed before reaching markProcessed/markFailed. Only the
  // second case is safe to reclaim.
  const claimAgeMs = Date.now() - new Date(existingRow.started_at).getTime()
  if (claimAgeMs < PROCESSING_CLAIM_STALE_MS) {
    // CONCURRENT DUPLICATE WHILE FIRST REQUEST IS PROCESSING: the other
    // request owns this event and is still within its normal processing
    // window. Do not process it a second time.
    return { outcome: 'duplicate' }
  }

  const staleBeforeIso = new Date(Date.now() - PROCESSING_CLAIM_STALE_MS).toISOString()
  const reclaimToken = randomUUID()
  const reclaimed = await tryReclaim(
    supabase,
    eventId,
    { status: 'processing', startedBeforeIso: staleBeforeIso },
    reclaimToken,
  )
  return reclaimed ? { outcome: 'claimed', claimToken: reclaimToken } : { outcome: 'duplicate' }
}

/**
 * Compare-and-swap reclaim: flips a row to 'processing' with a fresh
 * started_at and a brand-new claim_token ONLY if it's still in the exact
 * state just observed. Returns whether THIS call won the race — a
 * concurrent caller attempting the same reclaim will see 0 rows affected
 * and correctly back off instead of both proceeding to process the same
 * event. The new claim_token is what makes the ORIGINAL (now-superseded)
 * claimant structurally unable to finalize this row later — see
 * markProcessed/markFailed.
 */
async function tryReclaim(
  supabase: SupabaseClient,
  eventId: string,
  expected: { status: 'failed' } | { status: 'processing'; startedBeforeIso: string },
  newClaimToken: string,
): Promise<boolean> {
  let query = supabase
    .from('stripe_webhook_events')
    .update({ status: 'processing', started_at: new Date().toISOString(), claim_token: newClaimToken })
    .eq('event_id', eventId)
    .eq('status', expected.status)

  if (expected.status === 'processing') {
    query = query.lt('started_at', expected.startedBeforeIso)
  }

  const { data, error } = await query.select('event_id')

  if (error) {
    throw new Error(`[stripe webhook] failed to reclaim event ${eventId}: ${error.message}`)
  }

  return (data?.length ?? 0) > 0
}

/**
 * Finalizes a claim as successfully processed — but ONLY if claimToken
 * still matches the row's current claim_token. If a later attempt has
 * since reclaimed this event_id (see tryReclaim), claim_token has already
 * changed, so this compare-and-swap affects 0 rows: this stale claimant
 * cannot alter an attempt it no longer owns. Callers must branch on the
 * result explicitly rather than assume success — see POST's handling.
 */
async function markProcessed(
  supabase: SupabaseClient,
  eventId: string,
  claimToken: string,
): Promise<FinalizeOutcome> {
  const { data, error } = await supabase
    .from('stripe_webhook_events')
    .update({ status: 'processed', processed_at: new Date().toISOString() })
    .eq('event_id', eventId)
    .eq('claim_token', claimToken)
    .select('event_id')

  if (error) {
    // The billing mutation already committed — retrying is safe (every
    // mutation above is an idempotent, Stripe-truth-reconciling upsert),
    // so surfacing this as a failure (→ 500 → Stripe retries) is the
    // correct, safe fallback rather than silently leaving the ledger row
    // stuck on 'processing'.
    throw new Error(`[stripe webhook] failed to mark event ${eventId} processed: ${error.message}`)
  }

  return (data?.length ?? 0) > 0 ? 'finalized' : 'lost_ownership'
}

/**
 * Best-effort mirror of markProcessed for the failure path — same
 * claim_token compare-and-swap, so a stale claimant can never mark a
 * reclaimed attempt failed either. A DB error here (as opposed to a clean
 * 0-row CAS miss) says nothing about who owns the row, so it's treated as
 * 'finalized' (i.e. proceed with the normal 500 → Stripe-retry response)
 * rather than 'lost_ownership' — matching the original best-effort
 * behavior of this path: we're already returning 500 regardless, and
 * PROCESSING_CLAIM_STALE_MS still makes an unresolved row eligible for
 * reclaim on the next retry either way.
 */
async function markFailed(supabase: SupabaseClient, eventId: string, claimToken: string): Promise<FinalizeOutcome> {
  const { data, error } = await supabase
    .from('stripe_webhook_events')
    .update({ status: 'failed' })
    .eq('event_id', eventId)
    .eq('claim_token', claimToken)
    .select('event_id')

  if (error) {
    console.error('[stripe webhook] failed to mark event failed (will self-heal via stale-claim reclaim)', eventId, error)
    return 'finalized'
  }

  return (data?.length ?? 0) > 0 ? 'finalized' : 'lost_ownership'
}

async function handleCheckoutSessionCompleted(supabase: SupabaseClient, event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session
  const userId = session.client_reference_id || session.metadata?.userId

  if (!userId) {
    throw new Error(`[stripe webhook] checkout.session.completed ${session.id} has no userId`)
  }

  const plan = session.metadata?.plan
  if (!isPurchasablePlan(plan)) {
    throw new Error(`[stripe webhook] checkout.session.completed ${session.id} has unrecognized plan metadata "${plan}"`)
  }

  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id
  if (!customerId) {
    throw new Error(`[stripe webhook] checkout.session.completed ${session.id} has no customer`)
  }

  const eventCreatedIso = new Date(event.created * 1000).toISOString()

  if (session.mode === 'payment') {
    // Lifetime: a one-time payment, never a recurring subscription
    // object. This event is the complete and final state for this row —
    // unlike the subscription-mode branch below, there is no ongoing
    // Stripe subscription to reconcile against later, so checkout remains
    // the sole and permanent source of truth here.
    const priceId = priceIdForPlan(plan)
    if (!priceId) {
      // Server misconfiguration (missing STRIPE_PRICE_* env var). POST
      // /api/checkout already refuses to create a session for an
      // unconfigured price, so this should be unreachable in practice —
      // but if config changed between session creation and webhook
      // delivery, fail loudly and retryably rather than writing a row
      // with a null stripe_price_id (NOT NULL — see the forward-fix
      // migration).
      throw new Error(`[stripe webhook] no Stripe price configured for plan "${plan}" (checkout.session.completed ${session.id})`)
    }

    const paymentIntentId =
      typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null

    // Lifetime participates in the SAME customer-level reconciliation
    // fence and canonical-identity RPC as recurring reconciliation — see
    // reconcileSubscriptionFromStripe's docstring. Without this, an
    // in-flight recurring reconciliation for this same customer (e.g. an
    // old subscription's lifecycle event, or a resubscribe race) could
    // interleave with this checkout and the two writes could clobber each
    // other; and a stale recurring write arriving after this authoritative
    // lifetime write must never resurrect the old recurring state (see
    // Fix 2/3 in the migration's reconcile_subscription_if_owner).
    const reconciliationToken = randomUUID()
    await acquireReconciliationLock(supabase, customerId, reconciliationToken)

    const ownershipRetained = await writeSubscriptionIfOwner(supabase, reconciliationToken, true, {
      userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: null,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
      stripePriceId: priceId,
      plan,
      billingType: 'lifetime',
      status: 'active',
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      gracePeriodEndsAt: null,
      eventCreatedIso,
    })

    if (!ownershipRetained) {
      // Vanishingly unlikely (this is the authoritative path — it always
      // wins the canonical-identity check) but still possible if a LATER
      // reconciliation attempt for this same customer has since replaced
      // the fencing token outright. Safe to no-op: that later attempt is,
      // by construction, more current than this one.
      console.warn(
        '[stripe webhook] lost subscription reconciliation ownership — a newer reconciliation for this customer already applied more current state; this lifetime checkout write was skipped',
        customerId,
      )
    }
    return
  }

  // Subscription mode: this event only ESTABLISHES the customer↔user
  // linkage (and, for a brand-new customer, the row itself) — it never
  // authoritatively writes status/current_period_end/cancel_at_period_end
  // /grace state itself. Those are looked up fresh from Stripe's CURRENT
  // subscription object via reconcileSubscriptionFromStripe, exactly like
  // every customer.subscription.* event. That means this event can be
  // delivered in any order relative to a subscription-lifecycle event for
  // the same subscription (Stripe does not guarantee order, and a
  // resubscribing user reuses their existing customer id — see POST
  // /api/checkout — so the two can race either way) without either one
  // ever regressing the other: both converge to the same Stripe truth.
  const subscriptionId =
    typeof session.subscription === 'string' ? session.subscription : session.subscription?.id ?? null

  if (!subscriptionId) {
    throw new Error(`[stripe webhook] checkout.session.completed ${session.id} is subscription-mode but has no subscription id`)
  }

  await reconcileSubscriptionFromStripe(supabase, {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    eventCreatedIso,
    // checkout.session.completed is an authoritative purchase path: it
    // may establish or replace which Stripe subscription is canonical
    // for this user (e.g. a resubscribe) — see the canonical-identity
    // rule in reconcile_subscription_if_owner.
    isAuthoritative: true,
    newRowUserId: userId,
    newCheckoutSessionId: session.id,
  })
}

async function handleSubscriptionLifecycleEvent(supabase: SupabaseClient, event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id
  const eventCreatedIso = new Date(event.created * 1000).toISOString()

  await reconcileSubscriptionFromStripe(supabase, {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    eventCreatedIso,
    // A normal lifecycle event must never SWITCH which subscription (or
    // billing state) is canonical for the user — only reconcile the one
    // that already is. See the canonical-identity rule in
    // reconcile_subscription_if_owner.
    isAuthoritative: false,
  })
}

interface ReconcileSubscriptionInput {
  stripeCustomerId: string
  stripeSubscriptionId: string
  eventCreatedIso: string
  /**
   * True only for an authoritative purchase/checkout path — the only kind
   * of event allowed to establish or replace which Stripe subscription
   * (or lifetime billing state) is canonical for this user. A normal
   * customer.subscription.* lifecycle event is never authoritative: it
   * may only reconcile the subscription that is ALREADY canonical, never
   * switch to a different one. Enforced atomically inside
   * reconcile_subscription_if_owner, not merely by this client-side flag
   * — see that function's comments in the forward-fix migration.
   */
  isAuthoritative: boolean
  /**
   * Supplied only by checkout.session.completed — the one caller that
   * authoritatively knows the user id and may need to create a brand-new
   * row for a first-time customer. Every other subscription-lifecycle
   * event omits this; it's a (retryable) error for no row to exist yet in
   * that case — see below.
   */
  newRowUserId?: string
  /** Supplied only by checkout.session.completed, which just learned this session id. Every other caller preserves whatever the existing row already has. */
  newCheckoutSessionId?: string
}

/**
 * The single source of subscription-lifecycle writes. Rather than trust
 * the triggering event's own embedded snapshot — which Stripe does not
 * guarantee arrives in order, and which checkout.session.completed and
 * customer.subscription.* can race against each other for the same
 * resubscribing customer — this always re-fetches the subscription's
 * CURRENT state directly from Stripe and writes that. Safe to call for a
 * canceled subscription too: a canceled subscription remains retrievable
 * through the Subscription API in this supported flow, so
 * customer.subscription.deleted uses this exact same path rather than a
 * separate handler.
 *
 * Re-fetching current state alone is NOT sufficient to prevent a
 * regression, though: a caller can retrieve a subscription's state and
 * then stall (slow network, GC pause, frozen serverless instance) long
 * enough for a DIFFERENT reconciliation attempt for the SAME CUSTOMER —
 * a reclaim of the same event_id, a wholly distinct event_id for the
 * same subscription, a resubscribe under a brand-new subscription id, or
 * a Lifetime checkout — to retrieve/establish a newer state and write it
 * first. The stalled caller would then resume and overwrite that newer
 * state with its own, now-stale, snapshot. acquireReconciliationLock/
 * writeSubscriptionIfOwner close that gap with a per-CUSTOMER fencing
 * token (not per-subscription — see the migration's table comment for
 * why): acquired here before the retrieve, and checked-and-consumed
 * atomically (single-transaction SELECT ... FOR UPDATE + write, see
 * reconcile_subscription_if_owner in the forward-fix migration) at the
 * moment the canonical mutation is applied, so only the
 * most-recently-acquired attempt for this CUSTOMER can ever write.
 *
 * The fencing token alone still isn't enough to stop a normal lifecycle
 * event from silently switching which subscription is canonical (e.g. an
 * old, noncanonical subscription's event arriving after a resubscribe).
 * See `input.isAuthoritative` and the canonical-identity rule enforced
 * inside reconcile_subscription_if_owner.
 */
async function reconcileSubscriptionFromStripe(
  supabase: SupabaseClient,
  input: ReconcileSubscriptionInput,
): Promise<void> {
  const reconciliationToken = randomUUID()
  await acquireReconciliationLock(supabase, input.stripeCustomerId, reconciliationToken)

  const subscription = await stripe.subscriptions.retrieve(input.stripeSubscriptionId)

  const status = toKnownStatus(subscription.status)
  if (!status) {
    throw new Error(`[stripe webhook] subscription ${subscription.id} has unrecognized status "${subscription.status}"`)
  }

  // As of the 2025 flexible-billing-mode API, current_period_end lives on
  // each subscription item rather than the subscription itself. Our
  // checkout always creates exactly one line item per subscription, so
  // the first item's period is the subscription's period.
  const item = subscription.items.data[0]
  const priceId = item?.price?.id ?? null
  const plan = planForPriceId(priceId)
  if (!plan) {
    throw new Error(`[stripe webhook] subscription ${subscription.id} has unrecognized price "${priceId}"`)
  }

  const existing = await fetchExistingByCustomerId(supabase, input.stripeCustomerId)

  const userId = existing?.user_id ?? input.newRowUserId
  if (!userId) {
    // A subscription-lifecycle event (not checkout.session.completed)
    // arrived before checkout ever established this row. Retryable:
    // Stripe's own retry, delivered after checkout lands, will find it.
    throw new Error(
      `[stripe webhook] subscription event for customer ${input.stripeCustomerId} has no existing row yet (checkout.session.completed may not have landed)`,
    )
  }

  const gracePeriodEndsAt = computeGracePeriodEndsAt(
    existing?.status ?? null,
    status,
    existing?.grace_period_ends_at ?? null,
  )

  const ownershipRetained = await writeSubscriptionIfOwner(supabase, reconciliationToken, input.isAuthoritative, {
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
    // Two independent, non-error reasons collapse to the same false
    // here — see reconcile_subscription_if_owner: (1) a later
    // reconciliation attempt for this SAME CUSTOMER already retrieved
    // and wrote a state that is, by construction, at least as current as
    // this attempt's own now-stale retrieve, or (2) this is a normal
    // lifecycle event for a subscription/billing state that is no longer
    // (or never was) canonical for this user — a benign no-op, not a
    // regression. Either way there is nothing to retry: the canonical row
    // already reflects the correct Stripe truth.
    console.warn(
      '[stripe webhook] lost subscription reconciliation ownership (fencing token superseded, or this event is not canonical for the current subscription/billing state) — write skipped',
      subscription.id,
    )
  }
}

/**
 * A grace period is granted from the FIRST RELIABLE OBSERVATION of the
 * CURRENT past_due state — deliberately never reconstructed from any
 * webhook event's own `created` timestamp, confirmed transition evidence
 * or not.
 *
 * Why not even a "confirmed" transition event: Stripe's
 * `previous_attributes.status` on a delayed/out-of-order event proves
 * only that status changed at SOME earlier point — never that it was the
 * transition BEHIND THE STATE THIS RECONCILIATION JUST RETRIEVED.
 * Example: active→past_due (event A), past_due→active (event B),
 * active→past_due (event C) — if delayed event A arrives after C, its
 * `previous_attributes.status` is present and "confirmed" by the old
 * rule, but anchoring to A's `created` time would backdate the grace
 * window for transition C, potentially shortening or even
 * already-expiring the customer's promised 7 days. There is no way to
 * distinguish this from a genuine first transition using only the
 * triggering event's own payload, so this stops trying: it NEVER anchors
 * to an event timestamp.
 *
 * Instead: any status other than past_due carries no grace. Repeated/
 * related events while already past_due must not push the deadline back
 * out (depends only on the PREVIOUSLY STORED status vs. the newly
 * reconciled one, both read at the moment of this call — never on
 * comparing event timestamps). Every OTHER transition into past_due
 * anchors a fresh 7-day window to `now` — the current moment being the
 * earliest instant this reconciliation can prove the CURRENT past_due
 * state was observed, so this can only ever grant a window equal to or
 * MORE generous than the true (unknowable) transition instant, never
 * shorter than the promised 7 days. A delayed delivery may make the
 * grace slightly more generous; it must never make it shorter.
 */
function computeGracePeriodEndsAt(
  previousStatus: StripeSubscriptionStatus | null,
  newStatus: StripeSubscriptionStatus,
  existingGracePeriodEndsAt: string | null,
): string | null {
  if (newStatus !== 'past_due') return null
  if (previousStatus === 'past_due' && existingGracePeriodEndsAt) {
    return existingGracePeriodEndsAt
  }
  return new Date(Date.now() + PAST_DUE_GRACE_PERIOD_MS).toISOString()
}

async function fetchExistingByCustomerId(
  supabase: SupabaseClient,
  customerId: string,
): Promise<ExistingSubscriptionRow | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select(
      'user_id, status, plan, stripe_checkout_session_id, stripe_payment_intent_id, stripe_price_id, current_period_end, grace_period_ends_at',
    )
    .eq('stripe_customer_id', customerId)
    .maybeSingle()

  if (error) {
    throw new Error(`[stripe webhook] failed to look up existing subscription by customer ${customerId}: ${error.message}`)
  }

  return data as ExistingSubscriptionRow | null
}

/**
 * public.users.subscription_tier is a display-only cache (see
 * src/components/layout/Sidebar.tsx) — never read for authorization
 * anywhere. Computed here and written atomically alongside the canonical
 * subscriptions row inside reconcile_subscription_if_owner (see
 * writeSubscriptionIfOwner) so the label can never observably drift from
 * the row it's derived from.
 */
function resolveSubscriptionTier(
  input: Pick<UpsertInput, 'plan' | 'billingType' | 'status' | 'currentPeriodEnd' | 'cancelAtPeriodEnd' | 'gracePeriodEndsAt'>,
): PurchasablePlan | 'free' {
  const entitlement = computeEntitlement({
    plan: input.plan,
    billing_type: input.billingType,
    status: input.status,
    current_period_end: input.currentPeriodEnd,
    cancel_at_period_end: input.cancelAtPeriodEnd,
    grace_period_ends_at: input.gracePeriodEndsAt,
  })
  return entitlement.entitled ? input.plan : 'free'
}

/**
 * Acquires this CUSTOMER's reconciliation fencing token BEFORE any
 * external retrieve or canonical write happens — see
 * reconcileSubscriptionFromStripe and the Lifetime checkout branch of
 * handleCheckoutSessionCompleted, the two callers. Keyed by
 * stripe_customer_id, not stripe_subscription_id: public.subscriptions is
 * canonical per USER/CUSTOMER (one row, upserted ON CONFLICT (user_id)),
 * so every entitlement-changing webhook path for a given customer —
 * recurring checkout, every subscription lifecycle event, and Lifetime
 * checkout — must contend for the SAME lock row, or a resubscribe/
 * Lifetime-vs-recurring race could write through two different,
 * mutually-blind lock rows and still clobber the one shared canonical
 * row. A plain upsert is sufficient (no compare-and-swap needed here,
 * unlike tryReclaim): acquiring always succeeds and always wins the slot
 * immediately, because Postgres serializes concurrent writers to the same
 * row and whichever commits LAST is left as the current value — which is
 * exactly the fencing-token property writeSubscriptionIfOwner relies on.
 */
async function acquireReconciliationLock(
  supabase: SupabaseClient,
  stripeCustomerId: string,
  reconciliationToken: string,
): Promise<void> {
  const { error } = await supabase.from('subscription_reconciliation_locks').upsert(
    {
      stripe_customer_id: stripeCustomerId,
      reconciliation_token: reconciliationToken,
      acquired_at: new Date().toISOString(),
    },
    { onConflict: 'stripe_customer_id' },
  )

  if (error) {
    throw new Error(
      `[stripe webhook] failed to acquire reconciliation lock for customer ${stripeCustomerId}: ${error.message}`,
    )
  }
}

/**
 * Atomically verifies reconciliationToken is still the CURRENT token for
 * this customer and, only if so, applies the canonical subscriptions
 * upsert and the users.subscription_tier sync in one database transaction
 * — see reconcile_subscription_if_owner in the forward-fix migration.
 * Returns false ("lost ownership") without writing anything if EITHER:
 * (1) a later reconciliation attempt for this same customer has since
 * replaced the fencing token via acquireReconciliationLock, or (2)
 * isAuthoritative is false and the subscription/billing state this call
 * is trying to write is no longer (or never was) canonical for this user
 * — see the canonical-identity rule inside the RPC. The caller must treat
 * either case as a benign no-op, never a failure.
 *
 * isAuthoritative must be true ONLY for a purchase/checkout path (may
 * establish/replace canonical identity) and false for every ordinary
 * customer.subscription.* lifecycle event (may only reconcile the
 * subscription that is already canonical).
 */
async function writeSubscriptionIfOwner(
  supabase: SupabaseClient,
  reconciliationToken: string,
  isAuthoritative: boolean,
  input: UpsertInput,
): Promise<boolean> {
  const { data, error } = await supabase.rpc('reconcile_subscription_if_owner', {
    p_stripe_customer_id: input.stripeCustomerId,
    p_reconciliation_token: reconciliationToken,
    p_is_authoritative: isAuthoritative,
    p_user_id: input.userId,
    p_stripe_subscription_id: input.stripeSubscriptionId,
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
      `[stripe webhook] reconcile_subscription_if_owner RPC failed for customer ${input.stripeCustomerId}: ${error.message}`,
    )
  }

  return data === true
}
