import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

type InvoiceWithSubscription = Stripe.Invoice & {
  subscription?: string | Stripe.Subscription | null
}

// Uses the anon key deliberately unauthenticated (there is no end-user
// session in a webhook request) — see docs/ROADMAP.md "Not yet real:
// Premium entitlement": this means auth.uid() is null for every write
// below, so RLS silently rejects them against the live schema today.
// Fixing that requires a service-role client, which is a real
// architecture change (and a bigger blast radius) out of scope here.
function createWebhookSupabaseClient() {
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createWebhookSupabaseClient()
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.client_reference_id || session.metadata?.userId

        if (!userId) {
          console.error('No user ID found in session:', session.id)
          break
        }

        // Determine subscription tier from metadata or price
        let subscriptionTier = 'premium' // default
        if (session.metadata?.plan) {
          subscriptionTier = session.metadata.plan
        }

        const updateData: Record<string, unknown> = {
          subscription_tier: subscriptionTier,
          subscription_status: 'active'
        }

        // Add subscription ID for recurring subscriptions
        if (session.mode === 'subscription' && session.subscription) {
          updateData.stripe_subscription_id = session.subscription
        }

        const { error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', userId)
          .single()

        if (error) {
          console.error('Database update error:', error)
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
        }

        console.log(`Updated user ${userId} to ${subscriptionTier} tier`)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as InvoiceWithSubscription
        const userId = invoice.metadata?.userId
        const subscriptionId = invoice.subscription

        if (!userId && !subscriptionId) {
          console.error('No user ID or subscription ID found in invoice:', invoice.id)
          break
        }

        const { error } = await supabase
          .from('users')
          .update({ subscription_status: 'active' })
          .eq('stripe_subscription_id', subscriptionId)
          .single()

        if (error) {
          console.error('Database update error:', error)
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
        }

        console.log(`Updated subscription status to active for subscription ${subscriptionId}`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as InvoiceWithSubscription
        const userId = invoice.metadata?.userId
        const subscriptionId = invoice.subscription

        if (!userId && !subscriptionId) {
          console.error('No user ID or subscription ID found in invoice:', invoice.id)
          break
        }

        const { error } = await supabase
          .from('users')
          .update({ subscription_status: 'past_due' })
          .eq('stripe_subscription_id', subscriptionId)
          .single()

        if (error) {
          console.error('Database update error:', error)
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
        }

        console.log(`Updated subscription status to past_due for subscription ${subscriptionId}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        if (!userId) {
          console.error('No user ID found in subscription:', subscription.id)
          break
        }

        const { error } = await supabase
          .from('users')
          .update({
            subscription_tier: 'free',
            subscription_status: 'canceled',
            stripe_subscription_id: null
          })
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (error) {
          console.error('Database update error:', error)
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
        }

        console.log(`Canceled subscription for user ${userId}`)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
        return NextResponse.json({ message: `Unhandled event type: ${event.type}` })
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
