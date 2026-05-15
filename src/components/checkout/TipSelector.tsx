'use client'

import React from 'react'
import { TIP_OPTIONS } from '@/lib/constants'
import type { TipPercentage } from '@/lib/constants'

// ============================================================
// Tip selector — exactly 4 options: 0%, 15%, 20%, 25%
// ============================================================

interface TipSelectorProps {
  value: TipPercentage
  onChange: (tip: TipPercentage) => void
}

export function TipSelector({ value, onChange }: TipSelectorProps) {
  return (
    <div>
      <h3 className="font-semibold text-restaurant-text mb-1">Add a Tip</h3>
      <p className="text-sm text-restaurant-muted mb-3">
        100% of your tip goes to the restaurant team.
      </p>
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-2"
        role="radiogroup"
        aria-label="Tip amount"
      >
        {TIP_OPTIONS.map((option) => (
          <label
            key={option.value}
            className={[
              'flex flex-col items-center gap-1 p-3 rounded-xl border-2 cursor-pointer transition-all',
              'focus-within:ring-2 focus-within:ring-brand-red focus-within:ring-offset-1',
              value === option.value
                ? 'border-brand-red bg-red-50'
                : 'border-restaurant-border hover:border-gray-400',
            ].join(' ')}
          >
            <input
              type="radio"
              name="tip"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value as TipPercentage)}
              className="sr-only"
            />
            <span
              className={[
                'font-bold text-sm',
                value === option.value ? 'text-brand-red' : 'text-restaurant-text',
              ].join(' ')}
            >
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
