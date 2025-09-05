import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

export async function POST(request: NextRequest) {
  try {
    const { priceId, userId, userEmail } = await request.json()

    if (!priceId || !userId) {
      return NextResponse.json(
        { error: 'Price ID and User ID are required' },
        { status: 400 }
      )
    }

    // Validate price ID against our known plans
    const validPriceIds = {
      premium: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_premium_monthly',
      vip: process.env.STRIPE_VIP_PRICE_ID || 'price_vip_monthly'
    }

    if (!Object.values(validPriceIds).includes(priceId)) {
      return NextResponse.json(
        { error: 'Invalid price ID' },
        { status: 400 }
      )
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing?canceled=true`,
      customer_email: userEmail,
      metadata: {
        userId: userId,
        plan: priceId === validPriceIds.premium ? 'premium' : 'vip'
      },
      subscription_data: {
        metadata: {
          userId: userId,
          plan: priceId === validPriceIds.premium ? 'premium' : 'vip'
        }
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    })

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
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

// Get available subscription plans
export async function GET() {
  try {
    const plans = [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        interval: 'forever',
        features: [
          'Basic cycle tracking',
          'Mood and symptom logging',
          '7-day data history',
          'Basic AI coach access (5 questions/day)',
          'Community support'
        ],
        limitations: [
          'Limited AI coach interactions',
          'Basic analytics only',
          'No partner sharing',
          'No premium features'
        ]
      },
      {
        id: 'premium',
        name: 'Premium',
        price: 15,
        currency: 'GBP',
        interval: 'month',
        priceId: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_premium_monthly',
        features: [
          'Everything in Free',
          'Unlimited AI coach access',
          'Advanced cycle analytics',
          'Partner sharing & sync',
          'Intimacy deck access',
          'Fantasy vault',
          'Custom notifications',
          'Data export',
          'Priority support'
        ],
        popular: true
      },
      {
        id: 'vip',
        name: 'VIP',
        price: 39,
        currency: 'GBP',
        interval: 'month',
        priceId: process.env.STRIPE_VIP_PRICE_ID || 'price_vip_monthly',
        features: [
          'Everything in Premium',
          'Personalized AI coaching',
          'Advanced relationship insights',
          'Custom meal plans',
          'Workout recommendations',
          '1-on-1 wellness consultation',
          'Early access to new features',
          'White-label options',
          'Dedicated support'
        ]
      }
    ]

    return NextResponse.json({ plans })

  } catch (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription plans' },
      { status: 500 }
    )
  }
}