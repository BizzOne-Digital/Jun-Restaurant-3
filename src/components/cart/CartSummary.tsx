'use client'

import React from 'react'
import Link from 'next/link'
import { useCartStore } from '@/store/cartStore'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

export function CartSummary() {
  const items = useCartStore((s) => s.items)
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  if (items.length === 0) return null

  return (
    <div className="bg-white rounded-card-lg border border-restaurant-border p-6 sticky top-24 shadow-card overflow-hidden">
      {/* Top accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-red via-brand-gold to-brand-red" />

      <h2 className="font-serif text-xl font-bold text-restaurant-text mb-5 mt-1">
        Order Summary
      </h2>

      <div className="space-y-3 mb-5">
        <div className="flex justify-between text-sm">
          <span className="text-restaurant-muted">Items ({itemCount})</span>
          <span className="font-medium text-restaurant-text">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-restaurant-muted">Tip</span>
          <span className="text-restaurant-muted italic">At checkout</span>
        </div>
      </div>

      <div className="border-t border-restaurant-border pt-4 mb-6">
        <div className="flex justify-between font-bold text-restaurant-text text-lg">
          <span>Subtotal</span>
          <span className="text-brand-red">{formatPrice(subtotal)}</span>
        </div>
        <p className="text-xs text-restaurant-muted mt-1">
          Tip and final total calculated at checkout
        </p>
      </div>

      <Link href="/checkout">
        <Button className="w-full" size="lg">
          Proceed to Checkout →
        </Button>
      </Link>

      <Link
        href="/menu"
        className="block text-center text-sm text-restaurant-muted hover:text-brand-red transition-colors mt-3 focus:outline-none focus:ring-2 focus:ring-brand-red rounded py-1"
      >
        ← Continue Shopping
      </Link>

      {/* Pay at store notice */}
      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
        <p className="text-xs text-amber-800 text-center">
          💳 Pay at store — no online payment required
        </p>
      </div>
    </div>
  )
}
