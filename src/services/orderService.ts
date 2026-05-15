import { connectDB } from '@/lib/db'
import Order from '@/models/Order'
import MenuItem from '@/models/MenuItem'
import type { IOrderDocument, IOrderItemEmbed, IDeliveryAddress } from '@/models/Order'
import { generateOrderNumber, calculateOrderTotals } from '@/lib/utils'
import { PAYMENT_STATUS, ORDER_STATUS } from '@/lib/constants'
import type { PlaceOrderInput } from '@/validation/orderSchemas'
import type { IOrder } from '@/types'
import type { Types } from 'mongoose'

// ============================================================
// Order service — place orders, fetch history, update counts
// ============================================================

type LeanOrder = Omit<IOrderDocument, keyof Document> & {
  _id: Types.ObjectId
  createdAt: Date
  updatedAt: Date
  items: (IOrderItemEmbed & { menuItemId: Types.ObjectId })[]
  userId: Types.ObjectId
  deliveryAddress: IDeliveryAddress | null
  tipPercentage: number
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  paymentIntentId?: string
}

/**
 * Place a new order.
 * - Calculates totals server-side (never trust client totals)
 * - Saves order to MongoDB
 * - Increments orderedCount on each MenuItem
 */
export async function placeOrder(
  userId: string,
  input: PlaceOrderInput,
  paymentOptions?: {
    paymentStatus?: string
    paymentIntentId?: string
    customerName?: string
    customerEmail?: string
    customerPhone?: string
  }
): Promise<IOrder> {
  await connectDB()

  // Server-side total calculation — never trust client-submitted totals
  const cartItems = input.items.map((item) => ({
    id: item.menuItemId,
    name: item.nameSnapshot,
    price: item.priceSnapshot,
    quantity: item.quantity,
    imageUrl: item.imageSnapshot,
    categoryId: '',
  }))

  const { subtotal, tipAmount, total } = calculateOrderTotals(
    cartItems,
    input.tipPercentage
  )

  const orderNumber = generateOrderNumber()

  const order = await Order.create({
    orderNumber,
    userId,
    items: input.items.map((item) => ({
      menuItemId: item.menuItemId,
      nameSnapshot: item.nameSnapshot,
      priceSnapshot: item.priceSnapshot,
      quantity: item.quantity,
      imageSnapshot: item.imageSnapshot,
    })),
    orderType: input.orderType,
    deliveryAddress: input.deliveryAddress ?? null,
    subtotal,
    tipPercentage: input.tipPercentage,
    tipAmount,
    total,
    currency: 'AUD',
    status: ORDER_STATUS.PLACED,
    paymentStatus: paymentOptions?.paymentStatus ?? PAYMENT_STATUS.PAY_AT_STORE,
    ...(paymentOptions?.paymentIntentId ? { paymentIntentId: paymentOptions.paymentIntentId } : {}),
    ...(paymentOptions?.customerName ? { customerName: paymentOptions.customerName } : {}),
    ...(paymentOptions?.customerEmail ? { customerEmail: paymentOptions.customerEmail } : {}),
    ...(paymentOptions?.customerPhone ? { customerPhone: paymentOptions.customerPhone } : {}),
  })

  // Increment orderedCount for each item in the order
  // Using bulkWrite for efficiency
  const bulkOps = input.items.map((item) => ({
    updateOne: {
      filter: { _id: item.menuItemId },
      update: { $inc: { orderedCount: item.quantity } },
    },
  }))

  if (bulkOps.length > 0) {
    await MenuItem.bulkWrite(bulkOps)
  }

  return serializeOrder(order.toObject() as unknown as LeanOrder)
}

/**
 * Get all orders for a specific user, sorted newest first.
 */
export async function getUserOrders(userId: string): Promise<IOrder[]> {
  await connectDB()

  const orders = await Order.find({ userId })
    .sort({ createdAt: -1 })
    .lean() as unknown as LeanOrder[]

  return orders.map(serializeOrder)
}

/**
 * Get a single order by ID, verifying it belongs to the user.
 */
export async function getOrderById(
  orderId: string,
  userId: string
): Promise<IOrder | null> {
  await connectDB()

  const order = await Order.findOne({ _id: orderId, userId })
    .lean() as unknown as LeanOrder | null
  if (!order) return null

  return serializeOrder(order)
}

// ---- helpers ----

function serializeOrder(order: LeanOrder): IOrder {
  return {
    _id: order._id.toString(),
    orderNumber: order.orderNumber,
    userId: order.userId.toString(),
    items: order.items.map((item) => ({
      menuItemId: item.menuItemId.toString(),
      nameSnapshot: item.nameSnapshot,
      priceSnapshot: item.priceSnapshot,
      quantity: item.quantity,
      imageSnapshot: item.imageSnapshot,
    })),
    orderType: order.orderType,
    deliveryAddress: order.deliveryAddress ?? null,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    subtotal: order.subtotal,
    // Cast is safe — tipPercentage is validated as 0|15|20|25 at input
    tipPercentage: order.tipPercentage as 0 | 15 | 20 | 25,
    tipAmount: order.tipAmount,
    total: order.total,
    currency: 'AUD',
    status: order.status as import('@/lib/constants').OrderStatus,
    paymentStatus: order.paymentStatus as import('@/lib/constants').PaymentStatus,
    paymentIntentId: order.paymentIntentId,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  }
}
