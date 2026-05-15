'use client'

import React from 'react'
import { RESTAURANT_INFO } from '@/lib/constants'
import type { OrderType } from '@/lib/constants'

// ============================================================
// Order type selector — Pickup or Delivery
// ============================================================

interface OrderTypeSelectorProps {
  value: OrderType
  onChange: (type: OrderType) => void
}

export function OrderTypeSelector({ value, onChange }: OrderTypeSelectorProps) {
  return (
    <div>
      <h3 className="font-semibold text-restaurant-text mb-3">Order Type</h3>
      <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Order type">
        {/* Pickup */}
        <label
          className={[
            'flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all',
            'focus-within:ring-2 focus-within:ring-brand-red focus-within:ring-offset-1',
            value === 'pickup'
              ? 'border-brand-red bg-red-50'
              : 'border-restaurant-border hover:border-gray-400',
          ].join(' ')}
        >
          <input
            type="radio"
            name="orderType"
            value="pickup"
            checked={value === 'pickup'}
            onChange={() => onChange('pickup')}
            className="sr-only"
          />
          <span className="text-2xl" aria-hidden="true">🏪</span>
          <span className="font-semibold text-sm text-restaurant-text">Pickup</span>
          <span className="text-xs text-restaurant-muted text-center">
            Collect from restaurant
          </span>
        </label>

        {/* Delivery */}
        <label
          className={[
            'flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all',
            'focus-within:ring-2 focus-within:ring-brand-red focus-within:ring-offset-1',
            value === 'delivery'
              ? 'border-brand-red bg-red-50'
              : 'border-restaurant-border hover:border-gray-400',
          ].join(' ')}
        >
          <input
            type="radio"
            name="orderType"
            value="delivery"
            checked={value === 'delivery'}
            onChange={() => onChange('delivery')}
            className="sr-only"
          />
          <span className="text-2xl" aria-hidden="true">🛵</span>
          <span className="font-semibold text-sm text-restaurant-text">Delivery</span>
          <span className="text-xs text-restaurant-muted text-center">
            Delivered to your door
          </span>
        </label>
      </div>

      {/* Pickup address info */}
      {value === 'pickup' && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-sm font-semibold text-green-800 mb-1">
            📍 Pickup Address
          </p>
          <p className="text-sm text-green-700">{RESTAURANT_INFO.address}</p>
          <p className="text-xs text-green-600 mt-1">
            Please bring your order number when collecting.
          </p>
        </div>
      )}
    </div>
  )
}
