import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getSessionUser } from '@/lib/auth'
import { placeOrder } from '@/services/orderService'
import { placeOrderSchema } from '@/validation/orderSchemas'

// ============================================================
// POST /api/payments/confirm-order
// Called after Stripe payment succeeds on the client.
// Verifies the PaymentIntent is actually paid, then creates the order.
// ============================================================

export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { paymentIntentId, orderData } = body

    if (!paymentIntentId) {
      return NextResponse.json({ success: false, error: 'paymentIntentId is required' }, { status: 400 })
    }

    // Verify payment with Stripe — never trust the client's claim
    const stripe = getStripe()
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { success: false, error: `Payment not completed (status: ${paymentIntent.status})` },
        { status: 400 }
      )
    }

    // Validate order data
    const result = placeOrderSchema.safeParse(orderData)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid order data', details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    // Place the order with paymentStatus = 'paid'
    const order = await placeOrder(user.id, result.data, {
      paymentStatus: 'paid',
      paymentIntentId,
    })

    return NextResponse.json({ success: true, data: { order } }, { status: 201 })
  } catch (error) {
    console.error('Confirm order error:', error)
    return NextResponse.json({ success: false, error: 'Failed to confirm order' }, { status: 500 })
  }
}
