import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getSessionUser } from '@/lib/auth'
import { placeOrder } from '@/services/orderService'
import { connectDB } from '@/lib/db'
import MenuItem from '@/models/MenuItem'
import Order from '@/models/Order'
import { sendMerchantOrderEmail, sendCustomerConfirmationEmail } from '@/lib/mailgun'

// ============================================================
// POST /api/payments/verify-session
// Called from /checkout/success after Stripe redirects back.
// Verifies the Checkout Session is paid, then creates the order.
// Idempotent — safe to call multiple times for the same session.
// ============================================================

export async function POST(request: NextRequest) {
  // Auth is optional — guest orders are allowed
  const user = await getSessionUser()

  try {
    const { sessionId } = await request.json()
    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'sessionId is required' }, { status: 400 })
    }

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    // Verify payment status
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { success: false, error: `Payment not completed (status: ${session.payment_status})` },
        { status: 400 }
      )
    }


    await connectDB()

    // Idempotency — if we already created an order for this session, return it
    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id ?? sessionId

    const existing = await Order.findOne({ paymentIntentId }).lean()
    if (existing) {
      return NextResponse.json({
        success: true,
        data: {
          order: {
            ...existing,
            _id: existing._id.toString(),
            userId: existing.userId?.toString() ?? 'guest',
            items: existing.items.map((item) => ({
              ...item,
              menuItemId: item.menuItemId.toString(),
            })),
          },
        },
      })
    }

    // Parse the order data we stored in session metadata
    const orderDataJson = session.metadata?.orderDataJson
    if (!orderDataJson) {
      return NextResponse.json({ success: false, error: 'Order data missing from session' }, { status: 400 })
    }

    const orderMeta = JSON.parse(orderDataJson) as {
      orderType: 'pickup' | 'delivery'
      tipPercentage: number
      deliveryAddress: Record<string, string> | null
      customerName: string | null
      customerEmail: string | null
      customerPhone: string | null
      items: { menuItemId: string; name: string; quantity: number; imageUrl: string }[]
    }

    // Resolve current prices from DB (server-side, authoritative)
    const resolvedItems = await Promise.all(
      orderMeta.items.map(async (i) => {
        const dbItem = await MenuItem.findById(i.menuItemId).lean()
        const price =
          dbItem?.discountActive && dbItem.discountPrice != null
            ? dbItem.discountPrice
            : dbItem?.price ?? 0
        return {
          menuItemId: i.menuItemId,
          nameSnapshot: i.name,
          priceSnapshot: price,
          quantity: i.quantity,
          imageSnapshot: i.imageUrl,
        }
      })
    )

    const resolvedUserId =
      session.metadata?.userId && session.metadata.userId !== 'guest'
        ? session.metadata.userId
        : (user?.id ?? null)

    const order = await placeOrder(
      resolvedUserId,
      {
        items: resolvedItems,
        orderType: orderMeta.orderType,
        deliveryAddress: orderMeta.deliveryAddress as Parameters<typeof placeOrder>[1]['deliveryAddress'],
        tipPercentage: orderMeta.tipPercentage as 0 | 15 | 20 | 25,
      },
      {
        paymentStatus: 'paid',
        paymentIntentId,
        customerName: orderMeta.customerName ?? session.metadata?.userEmail ?? undefined,
        customerEmail: orderMeta.customerEmail ?? session.metadata?.userEmail ?? undefined,
        customerPhone: orderMeta.customerPhone ?? undefined,
      }
    )

    // Send confirmation emails — fire-and-forget, never block order success
    try {
      await Promise.all([
        sendMerchantOrderEmail(order),
        sendCustomerConfirmationEmail(order),
      ])
      // Mark email timestamps on the order document
      await Order.updateOne(
        { orderNumber: order.orderNumber },
        {
          $set: {
            merchantOrderEmailSentAt: new Date(),
            customerConfirmationEmailSentAt: order.customerEmail ? new Date() : null,
          },
        }
      )
    } catch (emailErr) {
      console.error('[verify-session] Email sending failed (order still succeeded):', emailErr)
      await Order.updateOne(
        { orderNumber: order.orderNumber },
        { $set: { emailError: String(emailErr) } }
      ).catch(() => {/* ignore */})
    }

    return NextResponse.json({ success: true, data: { order } }, { status: 201 })
  } catch (error) {
    console.error('Verify session error:', error)
    return NextResponse.json({ success: false, error: 'Failed to verify payment' }, { status: 500 })
  }
}
