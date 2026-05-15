'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { formatPrice } from '@/lib/utils'

interface SaleItem {
  _id: string
  name: string
  price: number
  categoryId: string
  isAvailable: boolean
  discountActive: boolean
  discountPercentage: number | null
  discountPrice: number | null
}

interface Category {
  _id: string
  name: string
}

export default function AdminSalesPage() {
  const [items, setItems] = useState<SaleItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPercentage, setEditPercentage] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editMode, setEditMode] = useState<'percentage' | 'fixed'>('percentage')
  const [error, setError] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterSale, setFilterSale] = useState<'all' | 'on-sale' | 'not-on-sale'>('all')

  const fetchItems = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/menu/items')
      if (!res.ok) return
      const data = await res.json()
      setItems(data.data.items)
      setCategories(data.data.categories)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  const patchItem = async (id: string, patch: Record<string, unknown>) => {
    setUpdatingId(id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/menu/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to update item')
        return false
      }
      await fetchItems()
      return true
    } finally {
      setUpdatingId(null)
    }
  }

  const handleRemoveSale = async (id: string) => {
    await patchItem(id, { discountActive: false })
  }

  const handleOpenEdit = (item: SaleItem) => {
    setEditingId(item._id)
    setEditMode(item.discountPercentage != null ? 'percentage' : 'fixed')
    setEditPercentage(item.discountPercentage != null ? String(item.discountPercentage) : '')
    setEditPrice(item.discountPrice != null ? String(item.discountPrice) : '')
    setError(null)
  }

  const handleSaveSale = async (item: SaleItem) => {
    if (editMode === 'percentage') {
      const pct = parseFloat(editPercentage)
      if (isNaN(pct) || pct <= 0 || pct >= 100) {
        setError('Enter a percentage between 1 and 99')
        return
      }
      const discountPrice = parseFloat((item.price * (1 - pct / 100)).toFixed(2))
      const ok = await patchItem(item._id, {
        discountActive: true,
        discountPercentage: pct,
        discountPrice,
      })
      if (ok) setEditingId(null)
    } else {
      const fp = parseFloat(editPrice)
      if (isNaN(fp) || fp <= 0 || fp >= item.price) {
        setError(`Enter a sale price between $0.01 and ${formatPrice(item.price - 0.01)}`)
        return
      }
      const pct = parseFloat((((item.price - fp) / item.price) * 100).toFixed(1))
      const ok = await patchItem(item._id, {
        discountActive: true,
        discountPercentage: pct,
        discountPrice: fp,
      })
      if (ok) setEditingId(null)
    }
  }

  const categoryName = (id: string) =>
    categories.find((c) => c._id === id)?.name ?? '—'

  const filtered = items.filter((item) => {
    if (filterCategory !== 'all' && item.categoryId !== filterCategory) return false
    if (filterSale === 'on-sale' && !item.discountActive) return false
    if (filterSale === 'not-on-sale' && item.discountActive) return false
    return true
  })

  const onSaleCount = items.filter((i) => i.discountActive).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Sales</h1>
          <p className="text-xs text-[#666] mt-1">
            {onSaleCount} item{onSaleCount !== 1 ? 's' : ''} currently on sale
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-[#2a2a2a] border border-[#333] text-[#aaa] text-xs rounded px-3 py-2 focus:outline-none focus:border-[#e8604c]"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
        <select
          value={filterSale}
          onChange={(e) => setFilterSale(e.target.value as typeof filterSale)}
          className="bg-[#2a2a2a] border border-[#333] text-[#aaa] text-xs rounded px-3 py-2 focus:outline-none focus:border-[#e8604c]"
        >
          <option value="all">All items</option>
          <option value="on-sale">On sale</option>
          <option value="not-on-sale">Not on sale</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-900/30 border border-red-700/40 rounded text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr] gap-4 px-5 py-3 border-b border-[#2a2a2a] text-[10px] text-[#555] uppercase tracking-widest">
          <span>Item</span>
          <span>Category</span>
          <span>Original price</span>
          <span>Sale price</span>
          <span>Actions</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#e8604c] border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-[#555]">No items found</div>
        ) : (
          filtered.map((item) => (
            <div key={item._id} className="border-b border-[#222] last:border-0">
              {/* Main row */}
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr] gap-4 px-5 py-4 hover:bg-[#222] transition-colors items-center">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm text-white truncate">{item.name}</span>
                  {item.discountActive && (
                    <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-orange-900/40 text-orange-400 border border-orange-700/30">
                      SALE
                    </span>
                  )}
                </div>
                <span className="text-xs text-[#666]">{categoryName(item.categoryId)}</span>
                <span className="text-sm text-[#aaa]">{formatPrice(item.price)}</span>
                <span className="text-sm">
                  {item.discountActive && item.discountPrice != null ? (
                    <span className="text-orange-400 font-semibold">
                      {formatPrice(item.discountPrice)}
                      {item.discountPercentage != null && (
                        <span className="text-[10px] text-[#888] ml-1">−{item.discountPercentage}%</span>
                      )}
                    </span>
                  ) : (
                    <span className="text-[#555]">—</span>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  {item.discountActive ? (
                    <>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        disabled={updatingId === item._id}
                        className="text-xs text-[#e8604c] hover:text-red-300 disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <span className="text-[#444]">·</span>
                      <button
                        onClick={() => handleRemoveSale(item._id)}
                        disabled={updatingId === item._id}
                        className="text-xs text-[#666] hover:text-white disabled:opacity-50"
                      >
                        Remove sale
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleOpenEdit(item)}
                      disabled={updatingId === item._id}
                      className="text-xs text-[#e8604c] hover:text-red-300 disabled:opacity-50"
                    >
                      Set sale
                    </button>
                  )}
                  {updatingId === item._id && (
                    <div className="animate-spin rounded-full h-3 w-3 border border-[#e8604c] border-t-transparent" />
                  )}
                </div>
              </div>

              {/* Inline edit panel */}
              {editingId === item._id && (
                <div className="px-5 pb-4 bg-[#1a1a1a] border-t border-[#2a2a2a]">
                  <div className="flex items-end gap-3 flex-wrap pt-4">
                    {/* Mode toggle */}
                    <div className="flex rounded overflow-hidden border border-[#333]">
                      <button
                        onClick={() => setEditMode('percentage')}
                        className={`px-3 py-1.5 text-xs transition-colors ${editMode === 'percentage' ? 'bg-[#e8604c] text-white' : 'bg-[#2a2a2a] text-[#888] hover:text-white'}`}
                      >
                        % off
                      </button>
                      <button
                        onClick={() => setEditMode('fixed')}
                        className={`px-3 py-1.5 text-xs transition-colors ${editMode === 'fixed' ? 'bg-[#e8604c] text-white' : 'bg-[#2a2a2a] text-[#888] hover:text-white'}`}
                      >
                        Fixed price
                      </button>
                    </div>

                    {editMode === 'percentage' ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="99"
                          step="1"
                          value={editPercentage}
                          onChange={(e) => setEditPercentage(e.target.value)}
                          placeholder="e.g. 20"
                          className="w-24 bg-[#2a2a2a] border border-[#333] text-white text-sm rounded px-3 py-1.5 focus:outline-none focus:border-[#e8604c] placeholder:text-[#555]"
                        />
                        <span className="text-sm text-[#666]">%</span>
                        {editPercentage && !isNaN(parseFloat(editPercentage)) && (
                          <span className="text-xs text-[#888]">
                            → {formatPrice(item.price * (1 - parseFloat(editPercentage) / 100))}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#666]">$</span>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          placeholder={`e.g. ${(item.price * 0.8).toFixed(2)}`}
                          className="w-28 bg-[#2a2a2a] border border-[#333] text-white text-sm rounded px-3 py-1.5 focus:outline-none focus:border-[#e8604c] placeholder:text-[#555]"
                        />
                        {editPrice && !isNaN(parseFloat(editPrice)) && parseFloat(editPrice) < item.price && (
                          <span className="text-xs text-[#888]">
                            −{(((item.price - parseFloat(editPrice)) / item.price) * 100).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveSale(item)}
                        disabled={updatingId === item._id}
                        className="px-4 py-1.5 rounded text-xs font-semibold text-white disabled:opacity-50"
                        style={{ background: 'linear-gradient(90deg, #e8604c, #f0a500)' }}
                      >
                        Apply sale
                      </button>
                      <button
                        onClick={() => { setEditingId(null); setError(null) }}
                        className="px-4 py-1.5 rounded text-xs text-[#888] hover:text-white bg-[#2a2a2a] border border-[#333]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
