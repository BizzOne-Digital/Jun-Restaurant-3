import mongoose, { Schema, Document, Model, Types } from 'mongoose'
import { ORDER_STATUS, PAYMENT_STATUS, ORDER_TYPE } from '@/lib/constants'

// ============================================================
// Order model
// ============================================================

export interface IOrderItemEmbed {
  menuItemId: Types.ObjectId
  nameSnapshot: string
  priceSnapshot: number
  quantity: number
  imageSnapshot: string
}

export interface IDeliveryAddress {
  fullName: string
  phone: string
  streetAddress: string
  suburb: string
  state: string
  postcode: string
  notes?: string
}

export interface IOrderDocument extends Document {
  orderNumber: string
  userId?: Types.ObjectId
  items: IOrderItemEmbed[]
  orderType: 'pickup' | 'delivery'
  deliveryAddress: IDeliveryAddress | null
  customerName?: string      // Customer name (always present for pickup; delivery uses deliveryAddress.fullName)
  customerEmail?: string     // Customer email for confirmation emails
  customerPhone?: string     // Customer phone (pickup orders)
  subtotal: number
  tipPercentage: number
  tipAmount: number
  total: number
  currency: 'AUD'
  status: string
  paymentStatus: string
  paymentIntentId?: string   // Stripe PaymentIntent ID (set when paid online)
  customerConfirmationEmailSentAt?: Date
  merchantOrderEmailSentAt?: Date
  emailError?: string
  createdAt: Date
  updatedAt: Date
}

const OrderItemSchema = new Schema<IOrderItemEmbed>(
  {
    menuItemId: {
      type: Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true,
    },
    nameSnapshot: { type: String, required: true },
    priceSnapshot: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    imageSnapshot: { type: String, default: '' },
  },
  { _id: false }
)

const DeliveryAddressSchema = new Schema<IDeliveryAddress>(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    streetAddress: { type: String, required: true },
    suburb: { type: String, required: true },
    state: { type: String, required: true },
    postcode: { type: String, required: true },
    notes: { type: String },
  },
  { _id: false }
)

const OrderSchema = new Schema<IOrderDocument>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: (items: IOrderItemEmbed[]) => items.length > 0,
        message: 'Order must contain at least one item',
      },
    },
    orderType: {
      type: String,
      enum: Object.values(ORDER_TYPE),
      required: true,
    },
    deliveryAddress: {
      type: DeliveryAddressSchema,
      default: null,
    },
    subtotal: { type: Number, required: true, min: 0 },
    tipPercentage: { type: Number, required: true, min: 0, max: 100 },
    tipAmount: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'AUD', enum: ['AUD'] },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PLACED,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PAY_AT_STORE,
    },
    paymentIntentId: {
      type: String,
      default: null,
      index: true,
    },
    customerName: { type: String, default: null },
    customerEmail: { type: String, default: null },
    customerPhone: { type: String, default: null },
    customerConfirmationEmailSentAt: { type: Date, default: null },
    merchantOrderEmailSentAt: { type: Date, default: null },
    emailError: { type: String, default: null },
  },
  {
    timestamps: true,
  }
)

// Index for user order history queries
OrderSchema.index({ userId: 1, createdAt: -1 })

const Order: Model<IOrderDocument> =
  mongoose.models.Order ?? mongoose.model<IOrderDocument>('Order', OrderSchema)

export default Order
