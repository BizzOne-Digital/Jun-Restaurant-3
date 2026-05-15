import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import MenuItem from '@/models/MenuItem'
import MenuCategory from '@/models/MenuCategory'
import Order from '@/models/Order'
import { getSessionUser } from '@/lib/auth'
import { POPULAR_ORDER_THRESHOLD } from '@/lib/constants'

export async function GET() {
  const user = await getSessionUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
  }

  try {
    await connectDB()

    const [
      totalItems,
      availableItems,
      discountedItems,
      popularItems,
      totalCategories,
      totalOrders,
      paidOrders,
      completedOrders,
    ] = await Promise.all([
      MenuItem.countDocuments({}),
      MenuItem.countDocuments({ isAvailable: true }),
      MenuItem.countDocuments({ discountActive: true }),
      MenuItem.countDocuments({
        $or: [
          { isPopularOverride: true },
          { isPopularOverride: { $ne: false }, orderedCount: { $gte: POPULAR_ORDER_THRESHOLD } },
        ],
      }),
      MenuCategory.countDocuments({ isActive: true }),
      Order.countDocuments({}),
      Order.countDocuments({ paymentStatus: 'paid' }),
      Order.countDocuments({ status: 'completed' }),
    ])

    // Revenue from paid orders
    const revenueAgg = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ])
    const revenue = revenueAgg[0]?.total ?? 0

    // Active pipeline = placed + preparing + ready
    const activePipeline = await Order.countDocuments({
      status: { $in: ['placed', 'preparing', 'ready'] },
    })

    // Daily sales last 7 days (paid orders only)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const dailySales = await Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$total' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    // Order status breakdown
    const statusBreakdown = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ])

    // Popular items (top 6 by orderedCount)
    const popularMenuItems = await MenuItem.find({ isAvailable: true })
      .sort({ orderedCount: -1 })
      .limit(6)
      .select('name orderedCount price')
      .lean()

    // Recent orders (last 8)
    const recentOrders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(8)
      .select('orderNumber total status createdAt userId')
      .lean()

    return NextResponse.json({
      success: true,
      data: {
        totalItems,
        availableItems,
        discountedItems,
        popularItems,
        totalCategories,
        totalOrders,
        paidOrders,
        completedOrders,
        revenue: Math.round(revenue * 100) / 100,
        activePipeline,
        dailySales,
        statusBreakdown,
        popularMenuItems: popularMenuItems.map((i) => ({
          _id: i._id.toString(),
          name: i.name,
          orderedCount: i.orderedCount,
          price: i.price,
        })),
        recentOrders: recentOrders.map((o) => ({
          _id: o._id.toString(),
          orderNumber: o.orderNumber,
          total: o.total,
          status: o.status,
          createdAt: o.createdAt.toISOString(),
        })),
      },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 })
  }
}
