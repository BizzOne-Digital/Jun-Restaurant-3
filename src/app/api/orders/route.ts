import { NextRequest, NextResponse } from 'next/server'
import { placeOrderSchema } from '@/validation/orderSchemas'
import { placeOrder, getUserOrders } from '@/services/orderService'
import { getSessionUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'You must be logged in to place an order' },
        { status: 401 }
      )
    }

    // Admins cannot place orders
    if (user.role === 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin accounts cannot place orders' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate input
    const result = placeOrderSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const order = await placeOrder(user.id, result.data)

    return NextResponse.json(
      { success: true, data: { order } },
      { status: 201 }
    )
  } catch (error) {
    console.error('Order placement error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to place order' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const orders = await getUserOrders(user.id)
    return NextResponse.json({ success: true, data: { orders } })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
