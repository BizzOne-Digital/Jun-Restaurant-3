import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getSessionUser } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import MenuItem from '@/models/MenuItem'

// ============================================================
// POST /api/payments/create-intent
// Creates a Stripe Checkout Session and returns the hosted URL.
// The client redirects the browser to that URL.
//
// On success Stripe redirects to:
//   /checkout/success?session_id={CHECKOUT_SESSION_ID}
// On cancel Stripe redirects to:
//   /checkout
// ============================================================

interface CartItemInput {
  menuItemId: string
  name: string
  quantity: number
  imageUrl?: string
}

interface OrderMeta {
  orderType: string
  tipPercentage: number
  deliveryAddress?: Record<string, string> | null
  customerName?: string
  customerEmail?: string
  customerPhone?: string
}

export async function POST(request: NextRequest) {
  // Optional auth — guests are allowed to place orders
  const user = await getSessionUser()
  if (user?.role === 'admin') {
    return NextResponse.json({ success: false, error: 'Admin accounts cannot place orders' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const {
      items,
      orderMeta,
    }: { items: CartItemInput[]; orderMeta: OrderMeta } = body

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Cart is empty' }, { status: 400 })
    }

    await connectDB()

    // Build Stripe line_items — verify prices server-side
    const lineItems: {
      price_data: {
        currency: string
        product_data: { name: string; images?: string[] }
        unit_amount: number
      }
      quantity: number
    }[] = []

    let subtotal = 0

    for (const cartItem of items) {
      const dbItem = await MenuItem.findById(cartItem.menuItemId).lean()
      if (!dbItem || !dbItem.isAvailable) {
        return NextResponse.json(
          { success: false, error: `"${cartItem.name}" is no longer available` },
          { status: 400 }
        )
      }

      const effectivePrice =
        dbItem.discountActive && dbItem.discountPrice != null
          ? dbItem.discountPrice
          : dbItem.price

      subtotal += effectivePrice * cartItem.quantity

      const productData: { name: string; images?: string[] } = {
        name: dbItem.name,
      }

      // Only include absolute image URLs (Stripe requires https://)
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
      if (cartItem.imageUrl && cartItem.imageUrl.startsWith('http')) {
        productData.images = [cartItem.imageUrl]
      } else if (cartItem.imageUrl && appUrl.startsWith('https')) {
        productData.images = [`${appUrl}${cartItem.imageUrl}`]
      }

      lineItems.push({
        price_data: {
          currency: 'aud',
          product_data: productData,
          unit_amount: Math.round(effectivePrice * 100),
        },
        quantity: cartItem.quantity,
      })
    }

    // Add tip as a separate line item if applicable
    const tipPct = orderMeta.tipPercentage ?? 0
    if (tipPct > 0) {
      const tipAmount = Math.round(subtotal * (tipPct / 100) * 100) / 100
      lineItems.push({
        price_data: {
          currency: 'aud',
          product_data: { name: `Tip (${tipPct}%)` },
          unit_amount: Math.round(tipAmount * 100),
        },
        quantity: 1,
      })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      customer_email: orderMeta.customerEmail || user?.email || undefined,
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout`,
      metadata: {
        userId: user?.id ?? 'guest',
        userEmail: orderMeta.customerEmail ?? user?.email ?? '',
        orderType: orderMeta.orderType,
        tipPercentage: String(tipPct),
        // Encode order data so we can reconstruct it on success
        orderDataJson: JSON.stringify({
          orderType: orderMeta.orderType,
          tipPercentage: tipPct,
          deliveryAddress: orderMeta.deliveryAddress ?? null,
          customerName: orderMeta.customerName ?? null,
          customerEmail: orderMeta.customerEmail ?? null,
          customerPhone: orderMeta.customerPhone ?? null,
          items: items.map((i) => ({ menuItemId: i.menuItemId, name: i.name, quantity: i.quantity, imageUrl: i.imageUrl ?? '' })),
        }),
      },
      payment_intent_data: {
        metadata: {
          userId: user?.id ?? 'guest',
        },
      },
    })

    if (!session.url) {
      return NextResponse.json({ success: false, error: 'Failed to create checkout session' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: { url: session.url },
    })
  } catch (error) {
    console.error('Create checkout session error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create payment session' }, { status: 500 })
  }
}
