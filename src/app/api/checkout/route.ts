import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { authenticateRequest } from '@/lib/api/authentication'
import { billingTypeForPlan, isPurchasablePlan, priceIdForPlan } from '@/lib/stripe/plans'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request)
    if (!user || !supabase) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { plan } = await request.json().catch(() => ({}))
    // userId always comes from the authenticated session, never the
    // request body — a client-supplied id would let anyone attach a
    // checkout session (and its resulting subscription) to any account.
    const userId = user.id

    // The browser sends an internal plan identifier only — never a raw
    // Stripe Price ID. The server owns the plan → Price ID mapping (see
    // src/lib/stripe/plans.ts), so a client can never determine its own
    // entitlement by supplying an arbitrary price.
    if (!isPurchasablePlan(plan)) {
      return NextResponse.json({ error: 'Unknown plan' }, { status: 400 })
    }

    const priceId = priceIdForPlan(plan)
    if (!priceId) {
      console.error(`[checkout] no Stripe price configured for plan "${plan}"`)
      return NextResponse.json(
        { error: 'This plan is not available right now. Please try again later.' },
        { status: 500 },
      )
    }

    const mode = billingTypeForPlan(plan) === 'lifetime' ? 'payment' : 'subscription'

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Reuse the caller's existing Stripe customer if we already have one
    // on file, rather than letting Stripe mint a new, unlinked customer
    // on every checkout attempt.
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle()
    const existingCustomerId = (existingSubscription as { stripe_customer_id?: string } | null)
      ?.stripe_customer_id

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode,
      success_url: `${baseUrl}/dashboard?success=true`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
      client_reference_id: userId,
      metadata: {
        userId,
        plan,
      },
      ...(existingCustomerId
        ? { customer: existingCustomerId }
        : user.email
          ? { customer_email: user.email }
          : {}),
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    return NextResponse.json({
      url: session.url,
      sessionId: session.id
    })

  } catch (error) {
    console.error('Stripe checkout error:', error)

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
