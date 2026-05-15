import type { CartItem } from '@/types'

// ============================================================
// Utility functions
// ============================================================

/**
 * Format a number as AUD currency string
 * e.g. 18.8 → "$18.80"
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
  }).format(amount)
}

/**
 * Convert a string to a URL-safe slug
 * e.g. "Kung Pao Chicken 宫保鸡丁" → "kung-pao-chicken"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, '') // remove CJK characters
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .replace(/^-+|-+$/g, '')
}

/**
 * Generate a unique order number
 * Format: MCC-YYYYMMDD-XXXX (e.g. MCC-20240515-0042)
 */
export function generateOrderNumber(): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 9000) + 1000
  return `MCC-${date}-${random}`
}

/**
 * Calculate order totals from cart items and tip percentage.
 *
 * Formula:
 *   itemSubtotal = Σ (price × quantity)
 *   tipAmount    = itemSubtotal × (tipPercentage / 100)
 *   orderTotal   = itemSubtotal + tipAmount
 *
 * Note: delivery fees, service fees, and taxes are NOT included here.
 * They must be added as separate line items if introduced in the future.
 */
export function calculateOrderTotals(
  items: CartItem[],
  tipPercentage: number
): { subtotal: number; tipAmount: number; total: number } {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )
  const subtotalRounded = Math.round(subtotal * 100) / 100
  const tipAmount = Math.round(subtotalRounded * (tipPercentage / 100) * 100) / 100
  const total = Math.round((subtotalRounded + tipAmount) * 100) / 100

  return { subtotal: subtotalRounded, tipAmount, total }
}

/**
 * Get the total item count in the cart
 */
export function getCartItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

/**
 * Truncate text to a max length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '…'
}

/**
 * Safely parse a JSON string, returning null on failure
 */
export function safeJsonParse<T>(json: string): T | null {
  try {
    return JSON.parse(json) as T
  } catch {
    return null
  }
}
