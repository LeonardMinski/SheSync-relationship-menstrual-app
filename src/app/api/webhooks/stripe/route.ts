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
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as any)
        break
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as any)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as any)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as any)
        break
      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
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

    // Update user subscription in Supabase
    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        plan: plan,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error updating subscription in Supabase:', error)
      return
    }

    console.log(`Subscription created for user ${userId} with plan ${plan}`)

  } catch (error) {
    console.error('Error handling checkout session completed:', error)
  }
}

async function handleInvoicePaid(invoice: any) {
  try {
    console.log('Invoice paid:', invoice.id)
    // TODO: Implement proper invoice handling when needed
  } catch (error) {
    console.error('Error handling invoice paid:', error)
  }
}

async function handleInvoicePaymentFailed(invoice: any) {
  try {
    console.log('Invoice payment failed:', invoice.id)
    // TODO: Handle failed payments (e.g., suspend subscription)
  } catch (error) {
    console.error('Error handling invoice payment failed:', error)
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  try {
    const userId = subscription.metadata?.userId
    if (!userId) {
      console.error('Missing userId in subscription metadata')
      return
    }

    // Update subscription status in Supabase
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: subscription.status,
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

async function handleSubscriptionDeleted(subscription: any) {
  try {
    // Update subscription status to cancelled
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)

    if (error) {
      console.error('Error cancelling subscription:', error)
    }

    console.log(`Subscription cancelled: ${subscription.id}`)
  } catch (error) {
    console.error('Error handling subscription deleted:', error)
  }
}