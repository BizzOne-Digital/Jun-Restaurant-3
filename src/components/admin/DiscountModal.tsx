'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatPrice } from '@/lib/utils'

interface DiscountModalProps {
  item: {
    _id: string
    name: string
    price: number
    discountActive: boolean
    discountPercentage: number | null
    discountPrice: number | null
  }
  onClose: () => void
  onSave: (id: string, data: {
    discountActive: boolean
    discountPercentage: number | null
    discountPrice: number | null
  }) => Promise<void>
}

export function DiscountModal({ item, onClose, onSave }: DiscountModalProps) {
  const [mode, setMode] = useState<'percentage' | 'fixed'>('percentage')
  const [percentage, setPercentage] = useState(item.discountPercentage?.toString() ?? '')
  const [fixedPrice, setFixedPrice] = useState(item.discountPrice?.toString() ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  // Initialise mode from existing data
  useEffect(() => {
    if (item.discountPrice != null) setMode('fixed')
    else setMode('percentage')
  }, [item])

  const previewSalePrice = (() => {
    if (mode === 'percentage') {
      const pct = parseFloat(percentage)
      if (!isNaN(pct) && pct > 0 && pct < 100) {
        return Math.round(item.price * (1 - pct / 100) * 100) / 100
      }
    } else {
      const fp = parseFloat(fixedPrice)
      if (!isNaN(fp) && fp > 0 && fp < item.price) return fp
    }
    return null
  })()

  const handleActivate = async () => {
    setError('')
    if (mode === 'percentage') {
      const pct = parseFloat(percentage)
      if (isNaN(pct) || pct <= 0 || pct >= 100) {
        setError('Enter a discount percentage between 1 and 99.')
        return
      }
    } else {
      const fp = parseFloat(fixedPrice)
      if (isNaN(fp) || fp <= 0 || fp >= item.price) {
        setError(`Enter a sale price between $0.01 and ${formatPrice(item.price - 0.01)}.`)
        return
      }
    }
    setIsSaving(true)
    try {
      await onSave(item._id, {
        discountActive: true,
        discountPercentage: mode === 'percentage' ? parseFloat(percentage) : null,
        discountPrice: mode === 'fixed' ? parseFloat(fixedPrice) : null,
      })
      onClose()
    } catch {
      setError('Failed to save discount. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemove = async () => {
    setIsSaving(true)
    try {
      await onSave(item._id, { discountActive: false, discountPercentage: null, discountPrice: null })
      onClose()
    } catch {
      setError('Failed to remove discount.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Set discount">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-bold text-restaurant-text">Set Discount</h2>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">✕</button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-xl">
          <p className="font-medium text-restaurant-text text-sm line-clamp-2">{item.name}</p>
          <p className="text-brand-red font-bold mt-1">Base price: {formatPrice(item.price)}</p>
        </div>

        {/* Mode selector */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode('percentage')}
            className={['flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all', mode === 'percentage' ? 'border-brand-red bg-red-50 text-brand-red' : 'border-restaurant-border text-restaurant-muted hover:border-gray-400'].join(' ')}
          >
            % Percentage Off
          </button>
          <button
            onClick={() => setMode('fixed')}
            className={['flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all', mode === 'fixed' ? 'border-brand-red bg-red-50 text-brand-red' : 'border-restaurant-border text-restaurant-muted hover:border-gray-400'].join(' ')}
          >
            $ Fixed Sale Price
          </button>
        </div>

        {mode === 'percentage' ? (
          <Input
            label="Discount Percentage"
            type="number"
            min="1"
            max="99"
            step="1"
            value={percentage}
            onChange={(e) => setPercentage(e.target.value)}
            placeholder="e.g. 20"
            hint="Enter a value between 1 and 99"
          />
        ) : (
          <Input
            label="Sale Price (AUD)"
            type="number"
            min="0.01"
            step="0.01"
            value={fixedPrice}
            onChange={(e) => setFixedPrice(e.target.value)}
            placeholder={`e.g. ${(item.price * 0.8).toFixed(2)}`}
            hint={`Must be less than base price ${formatPrice(item.price)}`}
          />
        )}

        {/* Preview */}
        {previewSalePrice != null && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl text-sm">
            <span className="text-green-800 font-medium">Preview: </span>
            <span className="text-green-700">
              {formatPrice(previewSalePrice)}{' '}
              <span className="line-through text-gray-400">{formatPrice(item.price)}</span>
              {' '}— saves {formatPrice(item.price - previewSalePrice)}
            </span>
          </div>
        )}

        {error && (
          <div role="alert" className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
        )}

        <div className="flex gap-3 mt-5">
          <Button onClick={handleActivate} isLoading={isSaving} className="flex-1">
            Apply Discount
          </Button>
          {item.discountActive && (
            <Button onClick={handleRemove} variant="danger" isLoading={isSaving} className="flex-1">
              Remove Discount
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
