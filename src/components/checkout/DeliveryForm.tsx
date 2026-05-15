'use client'

import React from 'react'
import { Input } from '@/components/ui/Input'
import type { DeliveryAddressInput } from '@/validation/orderSchemas'

// ============================================================
// Delivery address form — shown when order type is "delivery"
// ============================================================

interface DeliveryFormProps {
  values: Partial<DeliveryAddressInput>
  errors: Partial<Record<keyof DeliveryAddressInput, string>>
  onChange: (field: keyof DeliveryAddressInput, value: string) => void
}

export function DeliveryForm({ values, errors, onChange }: DeliveryFormProps) {
  return (
    <div>
      <h3 className="font-semibold text-restaurant-text mb-4">Delivery Address</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            required
            value={values.fullName ?? ''}
            onChange={(e) => onChange('fullName', e.target.value)}
            error={errors.fullName}
            placeholder="Jane Smith"
            autoComplete="name"
          />
          <Input
            label="Phone Number"
            required
            type="tel"
            value={values.phone ?? ''}
            onChange={(e) => onChange('phone', e.target.value)}
            error={errors.phone}
            placeholder="04XX XXX XXX"
            autoComplete="tel"
          />
        </div>

        <Input
          label="Street Address"
          required
          value={values.streetAddress ?? ''}
          onChange={(e) => onChange('streetAddress', e.target.value)}
          error={errors.streetAddress}
          placeholder="123 Example Street"
          autoComplete="street-address"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Suburb / City"
            required
            value={values.suburb ?? ''}
            onChange={(e) => onChange('suburb', e.target.value)}
            error={errors.suburb}
            placeholder="Mascot"
            autoComplete="address-level2"
          />
          <Input
            label="State"
            required
            value={values.state ?? ''}
            onChange={(e) => onChange('state', e.target.value)}
            error={errors.state}
            placeholder="NSW"
            autoComplete="address-level1"
          />
          <Input
            label="Postcode"
            required
            value={values.postcode ?? ''}
            onChange={(e) => onChange('postcode', e.target.value)}
            error={errors.postcode}
            placeholder="2020"
            autoComplete="postal-code"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="delivery-notes"
            className="text-sm font-medium text-restaurant-text"
          >
            Delivery Notes{' '}
            <span className="text-restaurant-muted font-normal">(optional)</span>
          </label>
          <textarea
            id="delivery-notes"
            value={values.notes ?? ''}
            onChange={(e) => onChange('notes', e.target.value)}
            placeholder="e.g. Leave at door, ring bell, unit number..."
            rows={3}
            className="w-full rounded-lg border border-restaurant-border px-4 py-2.5 text-base text-restaurant-text placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-colors resize-none"
          />
        </div>
      </div>
    </div>
  )
}
