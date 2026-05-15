'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Category {
  _id: string
  name: string
}

interface ItemFormData {
  name: string
  description: string
  price: string
  categoryId: string
  imageUrl: string
  isAvailable: boolean
  tags: string
  isPopularOverride: string // 'auto' | 'true' | 'false'
}

interface ItemModalProps {
  item?: {
    _id: string
    name: string
    description: string
    price: number
    categoryId: string
    imageUrl: string
    isAvailable: boolean
    tags: string[]
    isPopularOverride: boolean | null
  } | null
  categories: Category[]
  onClose: () => void
  onSave: (id: string | null, data: Record<string, unknown>) => Promise<void>
}

export function ItemModal({ item, categories, onClose, onSave }: ItemModalProps) {
  const isEdit = item != null
  const [form, setForm] = useState<ItemFormData>({
    name: item?.name ?? '',
    description: item?.description ?? '',
    price: item?.price?.toString() ?? '',
    categoryId: item?.categoryId ?? (categories[0]?._id ?? ''),
    imageUrl: item?.imageUrl ?? '',
    isAvailable: item?.isAvailable ?? true,
    tags: item?.tags?.join(', ') ?? '',
    isPopularOverride: item?.isPopularOverride === true ? 'true' : item?.isPopularOverride === false ? 'false' : 'auto',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!form.categoryId && categories.length > 0) {
      setForm((f) => ({ ...f, categoryId: categories[0]._id }))
    }
  }, [categories, form.categoryId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const price = parseFloat(form.price)
    if (!form.name.trim()) { setError('Name is required.'); return }
    if (isNaN(price) || price <= 0) { setError('Enter a valid price.'); return }
    if (!form.categoryId) { setError('Select a category.'); return }

    setIsSaving(true)
    try {
      const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean)
      const popularOverride = form.isPopularOverride === 'true' ? true : form.isPopularOverride === 'false' ? false : null
      await onSave(item?._id ?? null, {
        name: form.name.trim(),
        description: form.description.trim(),
        price,
        categoryId: form.categoryId,
        imageUrl: form.imageUrl.trim() || '/images/menu/placeholder-default.svg',
        isAvailable: form.isAvailable,
        tags,
        isPopularOverride: popularOverride,
      })
      onClose()
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 my-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-xl font-bold text-restaurant-text">{isEdit ? 'Edit Item' : 'Add New Item'}</h2>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input label="Name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Kung Pao Chicken" />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-restaurant-text">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              placeholder="Short description of the dish"
              className="w-full rounded-lg border border-restaurant-border px-4 py-2.5 text-sm text-restaurant-text placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Price (AUD)" required type="number" min="0.01" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="0.00" />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-restaurant-text">Category <span className="text-brand-red">*</span></label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                className="w-full rounded-lg border border-restaurant-border px-3 py-2.5 text-sm text-restaurant-text focus:outline-none focus:ring-2 focus:ring-brand-red bg-white"
              >
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <Input label="Image URL" value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} placeholder="/images/menu/placeholder-default.svg" hint="Leave blank for default placeholder" />

          <Input label="Tags (comma-separated)" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder="e.g. spicy, chicken, popular" hint="Used for search and filtering" />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-restaurant-text">Popular Override</label>
              <select
                value={form.isPopularOverride}
                onChange={(e) => setForm((f) => ({ ...f, isPopularOverride: e.target.value }))}
                className="w-full rounded-lg border border-restaurant-border px-3 py-2.5 text-sm text-restaurant-text focus:outline-none focus:ring-2 focus:ring-brand-red bg-white"
              >
                <option value="auto">Auto (by order count)</option>
                <option value="true">Force Popular</option>
                <option value="false">Hide Popular Badge</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-restaurant-text">Availability</label>
              <select
                value={form.isAvailable ? 'true' : 'false'}
                onChange={(e) => setForm((f) => ({ ...f, isAvailable: e.target.value === 'true' }))}
                className="w-full rounded-lg border border-restaurant-border px-3 py-2.5 text-sm text-restaurant-text focus:outline-none focus:ring-2 focus:ring-brand-red bg-white"
              >
                <option value="true">Available</option>
                <option value="false">Unavailable</option>
              </select>
            </div>
          </div>

          {error && <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" isLoading={isSaving} className="flex-1">{isEdit ? 'Save Changes' : 'Add Item'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
