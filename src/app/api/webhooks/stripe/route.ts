import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    console.log('Received Stripe webhook:', event.type)

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    const userId = session.metadata?.userId
    const plan = session.metadata?.plan

    if (!userId || !plan) {
      console.error('Missing userId or plan in session metadata')
      return
    }

    // Get the subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

    // Update user subscription in Supabase
    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscription.id,
        plan: plan,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error updating subscription in Supabase:', error)
      return
    }

    // Update user's subscription tier
    const { error: userError } = await supabase
      .from('users')
      .update({ 
        subscription_tier: plan,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (userError) {
      console.error('Error updating user subscription tier:', userError)
    }

    console.log(`Subscription created for user ${userId}: ${plan}`)

  } catch (error) {
    console.error('Error handling checkout session completed:', error)
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  try {
    if (!invoice.subscription) return

    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
    const userId = subscription.metadata?.userId

    if (!userId) {
      console.error('Missing userId in subscription metadata')
      return
    }

    // Update subscription status
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)

    if (error) {
      console.error('Error updating subscription after payment:', error)
    }

    console.log(`Invoice paid for subscription ${subscription.id}`)

  } catch (error) {
    console.error('Error handling invoice paid:', error)
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    if (!invoice.subscription) return

    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
    const userId = subscription.metadata?.userId

    if (!userId) {
      console.error('Missing userId in subscription metadata')
      return
    }

    // Update subscription status to past_due
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)

    if (error) {
      console.error('Error updating subscription after payment failure:', error)
    }

    console.log(`Payment failed for subscription ${subscription.id}`)

  } catch (error) {
    console.error('Error handling invoice payment failed:', error)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const userId = subscription.metadata?.userId

    if (!userId) {
      console.error('Missing userId in subscription metadata')
      return
    }

    // Update subscription in Supabase
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)

    if (error) {
      console.error('Error updating subscription:', error)
    }

    console.log(`Subscription updated: ${subscription.id}`)

  } catch (error) {
    console.error('Error handling subscription updated:', error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const userId = subscription.metadata?.userId

    if (!userId) {
      console.error('Missing userId in subscription metadata')
      return
    }

    // Update subscription status to canceled
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)

    if (error) {
      console.error('Error updating canceled subscription:', error)
    }

    // Downgrade user to free tier
    const { error: userError } = await supabase
      .from('users')
      .update({ 
        subscription_tier: 'free',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (userError) {
      console.error('Error downgrading user to free tier:', userError)
    }

    console.log(`Subscription canceled: ${subscription.id}`)

  } catch (error) {
    console.error('Error handling subscription deleted:', error)
  }
}
