import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { authenticateRequest } from '@/lib/api/authentication'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { priceId } = await request.json()
    // userId always comes from the authenticated session, never the
    // request body — a client-supplied id would let anyone attach a
    // checkout session (and its resulting subscription) to any account.
    const userId = user.id

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      )
    }

    // Determine subscription mode based on price ID
    const isLifetime = priceId.includes('lifetime')
    const mode = isLifetime ? 'payment' : 'subscription'

    // Determine plan type from price ID
    let planType = 'premium'
    if (priceId.includes('vip')) {
      planType = 'vip'
    } else if (priceId.includes('lifetime')) {
      planType = 'lifetime'
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

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
        plan: planType
      }
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