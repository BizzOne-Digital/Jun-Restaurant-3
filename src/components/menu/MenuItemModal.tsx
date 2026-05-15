'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { useCartStore } from '@/store/cartStore'
import { PopularBadge } from './PopularBadge'
import { formatPrice } from '@/lib/utils'
import { DEFAULT_FOOD_IMAGE } from '@/lib/constants'
import type { IMenuItem } from '@/types'

// ============================================================
// MenuItemModal — full-screen item detail popup
// Matches the design: large image, description, special
// instructions, quantity selector, frequently bought together,
// sticky "Add to order" CTA at the bottom.
// ============================================================

interface MenuItemModalProps {
  item: IMenuItem
  allItems: IMenuItem[]   // full menu pool for "frequently bought together"
  onClose: () => void
}

export function MenuItemModal({ item, allItems, onClose }: MenuItemModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [instructions, setInstructions] = useState('')
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)
  const cartItems = useCartStore((s) => s.items)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Resolve display values
  const salePrice = item.discountActive ? item.effectiveSalePrice : null
  const displayPrice = salePrice ?? item.price
  const isPopular = item.isPopular ?? false

  const discountLabel = (() => {
    if (!item.discountActive) return null
    if (item.discountPercentage) return `${item.discountPercentage}% OFF`
    if (salePrice != null) {
      const pct = Math.round(((item.price - salePrice) / item.price) * 100)
      return pct > 0 ? `${pct}% OFF` : 'SALE'
    }
    return 'SALE'
  })()

  // "Frequently bought together" — popular items excluding this one, up to 6
  const frequentlyBought: IMenuItem[] = allItems
    .filter((i) => i._id !== item._id && (i.isPopular || i.isPopularOverride === true))
    .slice(0, 6)

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    // Prevent body scroll while modal is open
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  const handleAddToOrder = () => {
    addItem(item, quantity, instructions.trim() || undefined)
    setAdded(true)
    setTimeout(() => {
      setAdded(false)
      onClose()
    }, 800)
  }

  const handleQuickAdd = (relatedItem: IMenuItem) => {
    addItem(relatedItem, 1)
  }

  const cartQtyForRelated = (id: string) =>
    cartItems.find((i) => i.id === id)?.quantity ?? 0

  const totalPrice = displayPrice * quantity

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={item.name}
    >
      {/* Dimmed overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div className="relative w-full sm:max-w-lg bg-white sm:rounded-2xl shadow-2xl flex flex-col max-h-[95dvh] sm:max-h-[90vh] overflow-hidden">

        {/* ── Scrollable body ── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">

          {/* Hero image */}
          <div className="relative w-full aspect-[4/3] bg-gray-100 flex-shrink-0">
            <Image
              src={item.imageUrl || DEFAULT_FOOD_IMAGE}
              alt={item.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 512px"
              priority
              onError={(e) => {
                (e.target as HTMLImageElement).src = DEFAULT_FOOD_IMAGE
              }}
            />
            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-3 left-3 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-red"
            >
              <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {/* Discount badge on image */}
            {item.discountActive && discountLabel && (
              <div className="absolute top-3 right-3 z-10">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-600 text-white shadow">
                  🏷️ {discountLabel}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="px-5 pt-5 pb-4">
            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {isPopular && <PopularBadge />}
            </div>

            {/* Name */}
            <h2 className="font-serif text-xl font-bold text-restaurant-text leading-snug mb-1">
              {item.name}
            </h2>

            {/* Price */}
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-xl font-bold text-brand-red">
                {formatPrice(displayPrice)}
              </span>
              {salePrice != null && (
                <span className="text-sm text-gray-400 line-through">
                  {formatPrice(item.price)}
                </span>
              )}
            </div>

            {/* Description */}
            {item.description && (
              <p className="text-sm text-restaurant-muted leading-relaxed mb-5">
                {item.description}
              </p>
            )}

            {/* Special instructions */}
            <div className="mb-5">
              <label
                htmlFor="modal-instructions"
                className="block text-sm font-semibold text-restaurant-text mb-2"
              >
                Special instructions
              </label>
              <textarea
                id="modal-instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Add a note"
                rows={3}
                maxLength={200}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-restaurant-text placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent resize-none transition-colors"
              />
              <p className="text-xs text-gray-400 mt-1">You may be charged for extras.</p>
            </div>

            {/* Quantity selector */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-brand-red hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-red text-lg font-medium"
                >
                  −
                </button>
                <span
                  aria-live="polite"
                  aria-label={`Quantity: ${quantity}`}
                  className="w-10 h-10 flex items-center justify-center text-base font-bold text-restaurant-text"
                >
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="Increase quantity"
                  className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-brand-red hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-red text-lg font-medium"
                >
                  +
                </button>
              </div>
              <span className="text-sm text-gray-400">
                {quantity > 1 ? `${quantity} × ${formatPrice(displayPrice)}` : ''}
              </span>
            </div>

            {/* ── Frequently bought together ── */}
            {frequentlyBought.length > 0 && (
              <div className="border-t border-gray-100 pt-5">
                <h3 className="font-semibold text-restaurant-text text-base mb-4">
                  Frequently bought together
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {frequentlyBought.map((related) => {
                    const relatedSalePrice = related.discountActive ? related.effectiveSalePrice : null
                    const relatedDisplayPrice = relatedSalePrice ?? related.price
                    const relatedCartQty = cartQtyForRelated(related._id)

                    return (
                      <div
                        key={related._id}
                        className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 bg-white transition-colors"
                      >
                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-restaurant-text leading-snug line-clamp-2 mb-0.5">
                            {related.name}
                          </p>
                          <div className="flex items-baseline gap-1.5 mb-1">
                            <span className="text-sm font-bold text-brand-red">
                              {formatPrice(relatedDisplayPrice)}
                            </span>
                            {relatedSalePrice != null && (
                              <span className="text-xs text-gray-400 line-through">
                                {formatPrice(related.price)}
                              </span>
                            )}
                          </div>
                          {related.description && (
                            <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                              {related.description}
                            </p>
                          )}
                          {(related.isPopular || related.isPopularOverride === true) && (
                            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-green-600 mt-1">
                              🔥 Popular
                            </span>
                          )}
                        </div>

                        {/* Image + add button */}
                        <div className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
                          <Image
                            src={related.imageUrl || DEFAULT_FOOD_IMAGE}
                            alt={related.name}
                            fill
                            className="object-cover"
                            sizes="80px"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = DEFAULT_FOOD_IMAGE
                            }}
                          />
                          {/* Cart qty chip */}
                          {relatedCartQty > 0 && (
                            <div className="absolute top-1 right-1 z-10 bg-brand-red text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                              {relatedCartQty}
                            </div>
                          )}
                          {/* Add button */}
                          <button
                            onClick={() => handleQuickAdd(related)}
                            aria-label={`Add ${related.name} to cart`}
                            className="absolute bottom-1 right-1 z-10 w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center text-brand-red hover:bg-brand-red hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-red text-lg font-bold leading-none"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Bottom padding so content clears the sticky CTA */}
            <div className="h-4" aria-hidden="true" />
          </div>
        </div>

        {/* ── Sticky "Add to order" CTA ── */}
        {item.isAvailable ? (
          <div className="flex-shrink-0 px-5 py-4 bg-white border-t border-gray-100 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
            <button
              onClick={handleAddToOrder}
              disabled={added}
              className={[
                'w-full py-4 rounded-2xl text-base font-bold transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-2',
                added
                  ? 'bg-green-500 text-white scale-[0.98]'
                  : 'bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.98]',
              ].join(' ')}
            >
              {added
                ? '✓ Added to order!'
                : `Add ${quantity > 1 ? quantity : 1} to order · ${formatPrice(totalPrice)}`}
            </button>
          </div>
        ) : (
          <div className="flex-shrink-0 px-5 py-4 bg-white border-t border-gray-100">
            <div className="w-full py-4 rounded-2xl bg-gray-200 text-gray-500 text-base font-bold text-center">
              Currently Unavailable
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
