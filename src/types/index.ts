import type { OrderStatus, PaymentStatus, OrderType, UserRole, TipPercentage } from '@/lib/constants'

// ============================================================
// Shared TypeScript interfaces
// ============================================================

export interface IUser {
  _id: string
  name: string
  email: string
  role: UserRole
  addresses: IAddress[]
  createdAt: string
  updatedAt: string
}

export interface IAddress {
  fullName: string
  phone: string
  streetAddress: string
  suburb: string
  state: string
  postcode: string
  notes?: string
}

export interface IMenuCategory {
  _id: string
  name: string
  slug: string
  displayOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface IMenuItem {
  _id: string
  categoryId: string
  name: string
  slug: string
  description: string
  price: number
  currency: 'AUD'
  imageUrl: string
  isAvailable: boolean
  orderedCount: number
  tags: string[]
  // Discount — admin-controlled
  discountActive: boolean
  discountPercentage: number | null
  discountPrice: number | null
  // Popular — auto or admin override
  isPopularOverride: boolean | null
  // Computed on the client/service layer
  effectiveSalePrice?: number | null  // the actual price to charge when discounted
  isPopular?: boolean                 // resolved from orderedCount + override
  createdAt: string
  updatedAt: string
}

export interface IOrderItem {
  menuItemId: string
  nameSnapshot: string
  priceSnapshot: number
  quantity: number
  imageSnapshot: string
}

export interface IOrder {
  _id: string
  orderNumber: string
  userId?: string
  items: IOrderItem[]
  orderType: OrderType
  deliveryAddress: IAddress | null
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  subtotal: number
  tipPercentage: TipPercentage
  tipAmount: number
  total: number
  currency: 'AUD'
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentIntentId?: string
  createdAt: string
  updatedAt: string
}

// Cart item — client-side only (not stored in DB directly)
export interface CartItem {
  id: string          // menuItemId
  name: string
  price: number       // effective price (discounted if applicable)
  originalPrice?: number  // base price before discount, for display only
  quantity: number
  imageUrl: string
  categoryId: string
  specialInstructions?: string  // optional note from item detail modal
}

// Auth session user (safe subset — no passwordHash)
export interface SessionUser {
  id: string
  name: string
  email: string
  role: UserRole
}

// API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Grouped menu data
export interface MenuGroupedByCategory {
  category: IMenuCategory
  items: IMenuItem[]
}
