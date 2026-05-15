import React from 'react'
import { formatPrice } from '@/lib/utils'

// ============================================================
// Order totals — subtotal, tip, total as separate line items
// ============================================================

interface OrderTotalsProps {
  subtotal: number
  tipPercentage: number
  tipAmount: number
  total: number
}

export function OrderTotals({
  subtotal,
  tipPercentage,
  tipAmount,
  total,
}: OrderTotalsProps) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
      <div className="flex justify-between text-sm text-restaurant-muted">
        <span>Subtotal</span>
        <span>{formatPrice(subtotal)}</span>
      </div>
      <div className="flex justify-between text-sm text-restaurant-muted">
        <span>Tip ({tipPercentage}%)</span>
        <span>{formatPrice(tipAmount)}</span>
      </div>
      {/* Future fees (delivery, service, tax) would be added here as separate lines */}
      <div className="border-t border-restaurant-border pt-2 flex justify-between font-bold text-restaurant-text text-base">
        <span>Total</span>
        <span className="text-brand-red">{formatPrice(total)}</span>
      </div>
      <p className="text-xs text-restaurant-muted">
        All prices in AUD
      </p>
    </div>
  )
}
