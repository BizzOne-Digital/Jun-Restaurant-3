'use client'

import React from 'react'
import Image from 'next/image'
import { useCartStore } from '@/store/cartStore'
import { formatPrice } from '@/lib/utils'
import { DEFAULT_FOOD_IMAGE } from '@/lib/constants'
import type { CartItem as CartItemType } from '@/types'

interface CartItemProps {
  item: CartItemType
  compact?: boolean
}

export function CartItemRow({ item, compact = false }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore()
  const lineTotal = item.price * item.quantity
  const isDiscounted = item.originalPrice != null && item.originalPrice > item.price

  if (compact) {
    return (
      <div className="flex items-center justify-between py-2 text-sm border-b border-restaurant-border last:border-0">
        <span className="text-restaurant-text line-clamp-1 flex-1 mr-2">
          {item.name}
          {isDiscounted && <span className="ml-1 text-xs text-red-500 font-semibold">🏷️</span>}
          <span className="text-restaurant-muted"> × {item.quantity}</span>
        </span>
        <span className="font-semibold text-brand-red flex-shrink-0">{formatPrice(lineTotal)}</span>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-4 py-4 border-b border-restaurant-border last:border-0 group">
      {/* Image */}
      <div
        className="relative flex-shrink-0 rounded-xl overflow-hidden bg-spice-50 shadow-sm"
        style={{ width: '72px', height: '72px' }}
      >
        <Image
          src={item.imageUrl || DEFAULT_FOOD_IMAGE}
          alt={item.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="72px"
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-restaurant-text text-sm leading-snug line-clamp-2 mb-1">
          {item.name}
        </h4>

        {/* Price per unit — show strikethrough if discounted */}
        <div className="flex items-baseline gap-1.5 mb-2">
          <p className="text-xs text-brand-red font-semibold">{formatPrice(item.price)} each</p>
          {isDiscounted && (
            <>
              <p className="text-xs text-restaurant-muted line-through">{formatPrice(item.originalPrice!)}</p>
              <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-semibold">
                {Math.round(((item.originalPrice! - item.price) / item.originalPrice!) * 100)}% OFF
              </span>
            </>
          )}
        </div>

        {/* Qty controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl overflow-hidden border border-restaurant-border bg-restaurant-bg shadow-inner-warm">
            <button
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              aria-label={`Decrease quantity of ${item.name}`}
              className="w-8 h-8 flex items-center justify-center text-restaurant-muted hover:text-brand-red hover:bg-spice-50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-red font-medium"
            >
              −
            </button>
            <span
              aria-live="polite"
              aria-label={`${item.name} quantity: ${item.quantity}`}
              className="w-8 h-8 flex items-center justify-center text-sm font-bold text-restaurant-text"
            >
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              aria-label={`Increase quantity of ${item.name}`}
              className="w-8 h-8 flex items-center justify-center text-restaurant-muted hover:text-brand-red hover:bg-spice-50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-red font-medium"
            >
              +
            </button>
          </div>

          <button
            onClick={() => removeItem(item.id)}
            aria-label={`Remove ${item.name} from cart`}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-1 py-0.5"
          >
            Remove
          </button>
        </div>
      </div>

      {/* Line total */}
      <div className="flex-shrink-0 text-right">
        <span className="font-bold text-brand-red">{formatPrice(lineTotal)}</span>
        {isDiscounted && (
          <p className="text-xs text-restaurant-muted line-through">
            {formatPrice(item.originalPrice! * item.quantity)}
          </p>
        )}
      </div>
    </div>
  )
}
