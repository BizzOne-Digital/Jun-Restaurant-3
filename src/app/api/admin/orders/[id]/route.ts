import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Order from '@/models/Order'
import { getSessionUser } from '@/lib/auth'
import { ORDER_STATUS } from '@/lib/constants'

// ============================================================
// Admin: Order by ID — GET, PATCH (status update)
// Requires admin role
// ============================================================

async function requireAdmin() {
  const user = await getSessionUser()
  if (!user || user.role !== 'admin') return null
  return user
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
  }

  try {
    await connectDB()
    const { id } = await params
    const order = await Order.findById(id).lean()
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }
    return NextResponse.json({
      success: true,
      data: {
        order: {
          ...order,
          _id: order._id.toString(),
          userId: order.userId.toString(),
          items: order.items.map((item) => ({
            ...item,
            menuItemId: item.menuItemId.toString(),
          })),
        },
      },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch order' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
  }

  try {
    await connectDB()
    const { id } = await params
    const body = await request.json()

    const validStatuses = Object.values(ORDER_STATUS)
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const allowedFields = ['status', 'paymentStatus']
    const update: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (field in body) update[field] = body[field]
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true }
    ).lean()

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        order: {
          ...order,
          _id: order._id.toString(),
          userId: order.userId.toString(),
          items: order.items.map((item) => ({
            ...item,
            menuItemId: item.menuItemId.toString(),
          })),
        },
      },
    })
  } catch (error) {
    console.error('Admin update order error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 })
  }
}
