import { NextRequest, NextResponse } from 'next/server'
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
  last_stripe_event_created_at: string | null
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

type ClaimResult = 'claimed' | 'duplicate'

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

  try {
    const claim = await claimEvent(supabase, event.id, event.type, eventCreatedIso)

    if (claim === 'duplicate') {
      // Covers three cases the caller can't tell apart and doesn't need to:
      // this exact event was already fully processed, a concurrent request
      // is actively processing it right now, or a concurrent request just
      // won the race to reclaim it. In every case, this request must not
      // touch billing state — the owning request (this one or the other)
      // is responsible for the outcome.
      return NextResponse.json({ received: true, duplicate: true })
    }

    // claim === 'claimed': this request now exclusively owns processing
    // this event_id. Nothing below may return successfully without either
    // completing the required mutation or throwing.
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(supabase, event)
        break
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(supabase, event)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(supabase, event)
        break
      default:
        console.log(`[stripe webhook] unhandled event type: ${event.type}`)
    }

    await markProcessed(supabase, event.id)
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[stripe webhook] processing failed — event left retryable', event.id, event.type, error)
    await markFailed(supabase, event.id)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

/**
 * Claims exclusive ownership of processing this event_id, or reports that
 * someone else already has (or already finished) — see the module-level
 * ClaimResult doc. Never mutates billing state itself.
 */
async function claimEvent(
  supabase: SupabaseClient,
  eventId: string,
  eventType: string,
  eventCreatedIso: string,
): Promise<ClaimResult> {
  const nowIso = new Date().toISOString()

  const { error: insertError } = await supabase.from('stripe_webhook_events').insert({
    event_id: eventId,
    event_type: eventType,
    event_created_at: eventCreatedIso,
    status: 'processing',
    started_at: nowIso,
  })

  if (!insertError) return 'claimed'

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
    return 'duplicate'
  }

  if (existingRow.status === 'failed') {
    // RETRY OF FAILED EVENT: reclaim it. A compare-and-swap UPDATE (WHERE
    // status = 'failed') means at most one concurrent retry wins; the
    // other sees 0 rows affected and backs off as a duplicate rather than
    // processing the same event twice.
    return (await tryReclaim(supabase, eventId, { status: 'failed' })) ? 'claimed' : 'duplicate'
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
    return 'duplicate'
  }

  const staleBeforeIso = new Date(Date.now() - PROCESSING_CLAIM_STALE_MS).toISOString()
  return (await tryReclaim(supabase, eventId, { status: 'processing', startedBeforeIso: staleBeforeIso }))
    ? 'claimed'
    : 'duplicate'
}

/**
 * Compare-and-swap reclaim: flips a row to 'processing' with a fresh
 * started_at ONLY if it's still in the exact state just observed. Returns
 * whether THIS call won the race — a concurrent caller attempting the same
 * reclaim will see 0 rows affected and correctly back off instead of both
 * proceeding to process the same event.
 */
async function tryReclaim(
  supabase: SupabaseClient,
  eventId: string,
  expected: { status: 'failed' } | { status: 'processing'; startedBeforeIso: string },
): Promise<boolean> {
  let query = supabase
    .from('stripe_webhook_events')
    .update({ status: 'processing', started_at: new Date().toISOString() })
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

async function markProcessed(supabase: SupabaseClient, eventId: string) {
  const { error } = await supabase
    .from('stripe_webhook_events')
    .update({ status: 'processed', processed_at: new Date().toISOString() })
    .eq('event_id', eventId)

  if (error) {
    // The billing mutation already committed — retrying is safe (every
    // mutation below is an idempotent upsert), so surfacing this as a
    // failure (→ 500 → Stripe retries) is the correct, safe fallback
    // rather than silently leaving the ledger row stuck on 'processing'.
    throw new Error(`[stripe webhook] failed to mark event ${eventId} processed: ${error.message}`)
  }
}

async function markFailed(supabase: SupabaseClient, eventId: string) {
  // Best-effort: we're already on the failure path and returning 500
  // regardless. If this update itself fails, the row is left on
  // 'processing' — PROCESSING_CLAIM_STALE_MS still makes it eligible for
  // reclaim on the next retry, so nothing is stuck permanently.
  const { error } = await supabase.from('stripe_webhook_events').update({ status: 'failed' }).eq('event_id', eventId)

  if (error) {
    console.error('[stripe webhook] failed to mark event failed (will self-heal via stale-claim reclaim)', eventId, error)
  }
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

  const priceId = priceIdForPlan(plan)
  if (!priceId) {
    // Server misconfiguration (missing STRIPE_PRICE_* env var). POST
    // /api/checkout already refuses to create a session for an
    // unconfigured price, so this should be unreachable in practice — but
    // if config changed between session creation and webhook delivery,
    // fail loudly and retryably rather than writing a row with a null
    // stripe_price_id (now NOT NULL — see the migration).
    throw new Error(`[stripe webhook] no Stripe price configured for plan "${plan}" (checkout.session.completed ${session.id})`)
  }

  const eventCreatedIso = new Date(event.created * 1000).toISOString()

  // Order-safety: checkout.session.completed is usually the FIRST event
  // for a subscription, but Stripe does not guarantee delivery order, and
  // a resubscribing user reuses their existing Stripe customer id (see
  // POST /api/checkout) — so a newer subscription-lifecycle event can
  // legitimately reach this row before this older checkout event does.
  // Apply the exact same last_stripe_event_created_at guard used for
  // subscription updated/deleted events, looked up by user_id (the one
  // identifier checkout always carries, unlike stripe_customer_id which
  // this exact call is what first attaches to the row for a new
  // customer).
  const existing = await fetchExistingByUserId(supabase, userId)
  if (existing && isStaleEvent(existing.last_stripe_event_created_at, eventCreatedIso)) {
    console.log('[stripe webhook] ignoring out-of-order checkout.session.completed', session.id, event.id)
    return
  }

  if (session.mode === 'payment') {
    // Lifetime: a one-time payment, never a recurring subscription
    // object. This event is the complete and final state — nothing else
    // will ever update this row's status.
    const paymentIntentId =
      typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null

    await upsertSubscription(supabase, {
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
    return
  }

  // Subscription mode: establish the customer↔user linkage now. The
  // customer.subscription.created event Stripe sends immediately after
  // this one carries the authoritative status/current_period_end/price
  // and will update this same row (looked up by stripe_customer_id) —
  // unless, per the ordering guard above, it already has.
  const subscriptionId =
    typeof session.subscription === 'string' ? session.subscription : session.subscription?.id ?? null

  await upsertSubscription(supabase, {
    userId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: null,
    stripePriceId: priceId,
    plan,
    billingType: 'recurring',
    status: 'active',
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    gracePeriodEndsAt: null,
    eventCreatedIso,
  })
}

async function handleSubscriptionUpdated(supabase: SupabaseClient, event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id
  const eventCreatedIso = new Date(event.created * 1000).toISOString()

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

  const existing = await fetchExistingByCustomerId(supabase, customerId)
  if (!existing) {
    // Retryable: if this event was delivered before checkout.session.completed
    // (Stripe doesn't guarantee order), the row simply doesn't exist yet.
    // Failing here (rather than silently dropping) means the next Stripe
    // retry — by which point checkout.session.completed will very likely
    // have landed — can actually apply it.
    throw new Error(
      `[stripe webhook] subscription event for customer ${customerId} has no existing row yet (checkout.session.completed may not have landed)`,
    )
  }

  if (isStaleEvent(existing.last_stripe_event_created_at, eventCreatedIso)) {
    console.log('[stripe webhook] ignoring out-of-order subscription event', subscription.id, event.id)
    return
  }

  const gracePeriodEndsAt = computeGracePeriodEndsAt(
    existing.status,
    status,
    eventCreatedIso,
    existing.grace_period_ends_at,
  )

  await upsertSubscription(supabase, {
    userId: existing.user_id,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    stripeCheckoutSessionId: existing.stripe_checkout_session_id,
    stripePaymentIntentId: existing.stripe_payment_intent_id,
    stripePriceId: priceId,
    plan,
    billingType: 'recurring',
    status,
    currentPeriodEnd: item?.current_period_end
      ? new Date(item.current_period_end * 1000).toISOString()
      : null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
    gracePeriodEndsAt,
    eventCreatedIso,
  })
}

async function handleSubscriptionDeleted(supabase: SupabaseClient, event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id
  const eventCreatedIso = new Date(event.created * 1000).toISOString()

  const existing = await fetchExistingByCustomerId(supabase, customerId)
  if (!existing) {
    throw new Error(`[stripe webhook] subscription.deleted for customer ${customerId} has no existing row`)
  }

  if (isStaleEvent(existing.last_stripe_event_created_at, eventCreatedIso)) {
    console.log('[stripe webhook] ignoring out-of-order subscription.deleted event', subscription.id, event.id)
    return
  }

  if (!existing.stripe_price_id) {
    // Defensive: cannot happen given stripe_price_id is NOT NULL and every
    // write path that creates a row supplies one — but narrows the type
    // without a non-null assertion.
    throw new Error(`[stripe webhook] existing row for customer ${customerId} unexpectedly has no stripe_price_id`)
  }

  await upsertSubscription(supabase, {
    userId: existing.user_id,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    stripeCheckoutSessionId: existing.stripe_checkout_session_id,
    stripePaymentIntentId: existing.stripe_payment_intent_id,
    stripePriceId: existing.stripe_price_id,
    plan: existing.plan,
    billingType: 'recurring',
    status: 'canceled',
    currentPeriodEnd: subscription.items.data[0]?.current_period_end
      ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString()
      : existing.current_period_end,
    cancelAtPeriodEnd: true,
    gracePeriodEndsAt: null,
    eventCreatedIso,
  })
}

function isStaleEvent(lastEventCreatedIso: string | null, incomingEventCreatedIso: string): boolean {
  if (!lastEventCreatedIso) return false
  return new Date(lastEventCreatedIso).getTime() >= new Date(incomingEventCreatedIso).getTime()
}

/**
 * A grace period is granted from the FIRST transition into past_due —
 * repeated/related events while already past_due must not push the
 * deadline back out. Any status other than past_due carries none.
 */
function computeGracePeriodEndsAt(
  previousStatus: StripeSubscriptionStatus,
  newStatus: StripeSubscriptionStatus,
  eventCreatedIso: string,
  existingGracePeriodEndsAt: string | null,
): string | null {
  if (newStatus !== 'past_due') return null
  if (previousStatus === 'past_due' && existingGracePeriodEndsAt) {
    return existingGracePeriodEndsAt
  }
  return new Date(new Date(eventCreatedIso).getTime() + PAST_DUE_GRACE_PERIOD_MS).toISOString()
}

async function fetchExistingByCustomerId(
  supabase: SupabaseClient,
  customerId: string,
): Promise<ExistingSubscriptionRow | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select(
      'user_id, status, plan, stripe_checkout_session_id, stripe_payment_intent_id, stripe_price_id, current_period_end, grace_period_ends_at, last_stripe_event_created_at',
    )
    .eq('stripe_customer_id', customerId)
    .maybeSingle()

  if (error) {
    throw new Error(`[stripe webhook] failed to look up existing subscription by customer ${customerId}: ${error.message}`)
  }

  return data as ExistingSubscriptionRow | null
}

async function fetchExistingByUserId(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ last_stripe_event_created_at: string | null } | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('last_stripe_event_created_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(`[stripe webhook] failed to look up existing subscription by user ${userId}: ${error.message}`)
  }

  return data as { last_stripe_event_created_at: string | null } | null
}

async function upsertSubscription(supabase: SupabaseClient, input: UpsertInput) {
  const { error } = await supabase.from('subscriptions').upsert(
    {
      user_id: input.userId,
      stripe_customer_id: input.stripeCustomerId,
      stripe_subscription_id: input.stripeSubscriptionId,
      stripe_checkout_session_id: input.stripeCheckoutSessionId,
      stripe_payment_intent_id: input.stripePaymentIntentId,
      stripe_price_id: input.stripePriceId,
      plan: input.plan,
      billing_type: input.billingType,
      status: input.status,
      current_period_end: input.currentPeriodEnd,
      cancel_at_period_end: input.cancelAtPeriodEnd,
      grace_period_ends_at: input.gracePeriodEndsAt,
      last_stripe_event_created_at: input.eventCreatedIso,
    },
    { onConflict: 'user_id' },
  )

  if (error) {
    throw new Error(`[stripe webhook] failed to upsert subscription for user ${input.userId}: ${error.message}`)
  }

  await syncUserDisplayTier(supabase, input)
}

/**
 * public.users.subscription_tier is a display-only cache (see
 * src/components/layout/Sidebar.tsx) — never read for authorization
 * anywhere. Kept in lock-step here so the label stays honest without
 * every consumer needing to query public.subscriptions. Treated as
 * required (throws on failure, same as the subscriptions upsert itself)
 * rather than best-effort: a request that partially succeeds must not be
 * marked 'processed' — see markProcessed.
 */
async function syncUserDisplayTier(supabase: SupabaseClient, input: UpsertInput) {
  const entitlement = computeEntitlement({
    plan: input.plan,
    billing_type: input.billingType,
    status: input.status,
    current_period_end: input.currentPeriodEnd,
    cancel_at_period_end: input.cancelAtPeriodEnd,
    grace_period_ends_at: input.gracePeriodEndsAt,
  })

  const { error } = await supabase
    .from('users')
    .update({ subscription_tier: entitlement.entitled ? input.plan : 'free' })
    .eq('id', input.userId)

  if (error) {
    throw new Error(`[stripe webhook] failed to sync users.subscription_tier for user ${input.userId}: ${error.message}`)
  }
}
