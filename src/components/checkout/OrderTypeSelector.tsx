'use client'

import React from 'react'
import { RESTAURANT_INFO } from '@/lib/constants'

// ============================================================
// Order type selector — Pickup only
// ============================================================

export function OrderTypeSelector() {
  return (
    <div>
      <h3 className="font-semibold text-restaurant-text mb-3">Order Type</h3>

      {/* Pickup info card */}
      <div className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-brand-red bg-red-50">
        <span className="text-2xl" aria-hidden="true">🏪</span>
        <span className="font-semibold text-sm text-restaurant-text">Pickup</span>
        <span className="text-xs text-restaurant-muted text-center">
          Collect from restaurant
        </span>
      </div>

      {/* Pickup address info */}
      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
        <p className="text-sm font-semibold text-green-800 mb-1">
          📍 Pickup Address
        </p>
        <p className="text-sm text-green-700">{RESTAURANT_INFO.address}</p>
        <p className="text-xs text-green-600 mt-1">
          Please bring your order number when collecting.
        </p>
      </div>
    </div>
  )
}
