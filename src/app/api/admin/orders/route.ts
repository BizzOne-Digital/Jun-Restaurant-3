import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Order from '@/models/Order'
import { getSessionUser } from '@/lib/auth'

// ============================================================
// Admin: Orders — GET all orders (paginated)
// Requires admin role
// ============================================================

export async function GET(request: NextRequest) {
  const user = await getSessionUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
  }

  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20')))
    const status = searchParams.get('status') ?? undefined
    const paymentStatus = searchParams.get('paymentStatus') ?? undefined
    const skip = (page - 1) * limit

    const filter: Record<string, unknown> = {}
    if (status) filter.status = status
    if (paymentStatus) filter.paymentStatus = paymentStatus

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ])

    return NextResponse.json({
      success: true,
      data: {
        orders: orders.map((o) => ({
          ...o,
          _id: o._id.toString(),
          userId: o.userId.toString(),
          items: o.items.map((item) => ({
            ...item,
            menuItemId: item.menuItemId.toString(),
          })),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 })
  }
}
