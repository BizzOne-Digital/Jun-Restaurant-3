'use client'

import React from 'react'
import Link from 'next/link'
import { useCartStore } from '@/store/cartStore'
import { CartItemRow } from '@/components/cart/CartItem'
import { CartSummary } from '@/components/cart/CartSummary'
import { Button } from '@/components/ui/Button'

// ============================================================
// Cart page
// ============================================================

export default function CartPage() {
  const items = useCartStore((s) => s.items)
  const clearCart = useCartStore((s) => s.clearCart)

  return (
    <div className="min-h-screen bg-restaurant-bg">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-serif text-3xl font-bold text-restaurant-text mb-8">
          Your Cart
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4" aria-hidden="true">🛒</p>
            <h2 className="text-xl font-semibold text-restaurant-text mb-2">
              Your cart is empty
            </h2>
            <p className="text-restaurant-muted mb-6">
              Add some delicious dishes to get started.
            </p>
            <Link href="/menu">
              <Button size="lg">Browse Menu</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Cart items */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-card border border-restaurant-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-restaurant-text">
                    {items.length} item{items.length !== 1 ? 's' : ''}
                  </h2>
                  <button
                    onClick={clearCart}
                    className="text-sm text-red-500 hover:text-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-1"
                  >
                    Clear cart
                  </button>
                </div>

                <div>
                  {items.map((item) => (
                    <CartItemRow key={item.id} item={item} />
                  ))}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="md:col-span-1">
              <CartSummary />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
