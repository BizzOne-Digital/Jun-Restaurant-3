import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { connectDB } from '@/lib/db'
import Order from '@/models/Order'

// ============================================================
// POST /api/payments/webhook
// Stripe webhook — handles async payment events.
// Register this URL in your Stripe dashboard:
//   https://dashboard.stripe.com/webhooks
//   URL: https://yourdomain.com/api/payments/webhook
//   Events to listen for: payment_intent.succeeded, payment_intent.payment_failed
// ============================================================

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    await connectDB()

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object
        // Update order paymentStatus if it was created with this paymentIntentId
        await Order.updateOne(
          { paymentIntentId: pi.id },
          { $set: { paymentStatus: 'paid' } }
        )
        break
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object
        await Order.updateOne(
          { paymentIntentId: pi.id },
          { $set: { paymentStatus: 'pending' } }
        )
        break
      }

      default:
        // Unhandled event type — ignore
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
