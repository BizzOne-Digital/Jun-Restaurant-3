'use client'

import React from 'react'
import Image from 'next/image'
import { useCartStore } from '@/store/cartStore'
import { PopularBadge } from './PopularBadge'
import { formatPrice } from '@/lib/utils'
import { DEFAULT_FOOD_IMAGE } from '@/lib/constants'
import type { IMenuItem } from '@/types'

// ============================================================
// MenuItemCard — compact card that opens the detail modal on click
// ============================================================

interface MenuItemCardProps {
  item: IMenuItem
  onOpenModal: (item: IMenuItem) => void
}

export function MenuItemCard({ item, onOpenModal }: MenuItemCardProps) {
  const cartItems = useCartStore((s) => s.items)
  const cartItem = cartItems.find((i) => i.id === item._id)
  const cartQty = cartItem?.quantity ?? 0

  const isPopular = item.isPopular ?? false
  const salePrice = item.discountActive ? item.effectiveSalePrice : null
  const displayPrice = salePrice ?? item.price

  const discountLabel = (() => {
    if (!item.discountActive) return null
    if (item.discountPercentage) return `${item.discountPercentage}% OFF`
    if (salePrice != null) {
      const pct = Math.round(((item.price - salePrice) / item.price) * 100)
      return pct > 0 ? `${pct}% OFF` : 'SALE'
    }
    return 'SALE'
  })()

  return (
    <article
      className="group bg-white rounded-card border border-restaurant-border overflow-hidden card-lift flex shadow-card cursor-pointer focus-within:ring-2 focus-within:ring-brand-red"
      onClick={() => onOpenModal(item)}
    >
      {/* Left: text content */}
      <div className="flex-1 p-4 flex flex-col min-w-0">
        {/* Badges row */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {isPopular && <PopularBadge />}
          {item.discountActive && discountLabel && (
            <span
              aria-label={`Discount: ${discountLabel}`}
              className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-red-600 text-white shadow-sm"
            >
              🏷️ {discountLabel}
            </span>
          )}
        </div>

        {/* Name */}
        <h3 className="font-semibold text-restaurant-text text-sm leading-snug mb-1.5 line-clamp-2 group-hover:text-brand-red transition-colors duration-200">
          {item.name}
        </h3>

        {/* Description */}
        {item.description && (
          <p className="text-xs text-restaurant-muted leading-relaxed mb-3 line-clamp-2 flex-1">
            {item.description}
          </p>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {item.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-spice-50 text-spice-600 font-medium capitalize"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Price + plus button */}
        <div className="mt-auto pt-3 border-t border-restaurant-border">
          <div className="flex items-center justify-between gap-2">
            {/* Price */}
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-brand-red text-lg leading-none">
                {formatPrice(displayPrice)}
              </span>
              {salePrice != null && (
                <span className="text-xs text-restaurant-muted line-through">
                  {formatPrice(item.price)}
                </span>
              )}
            </div>

            {/* Plus / cart qty button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onOpenModal(item)
              }}
              aria-label={`View ${item.name} details`}
              className={[
                'w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-200 flex-shrink-0',
                'focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-1',
                cartQty > 0
                  ? 'bg-brand-red text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-brand-red hover:text-white',
              ].join(' ')}
            >
              {cartQty > 0 ? cartQty : '+'}
            </button>
          </div>
        </div>
      </div>

      {/* Right: image */}
      <div className="relative w-28 sm:w-32 flex-shrink-0 bg-spice-50 overflow-hidden">
        <Image
          src={item.imageUrl || DEFAULT_FOOD_IMAGE}
          alt={item.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 640px) 112px, 128px"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = DEFAULT_FOOD_IMAGE
          }}
        />

        {/* Unavailable overlay */}
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-semibold text-xs bg-black/40 px-2 py-1 rounded-full text-center">
              Unavailable
            </span>
          </div>
        )}
      </div>
    </article>
  )
}
