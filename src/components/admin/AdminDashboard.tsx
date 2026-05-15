'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'
import { DiscountModal } from './DiscountModal'
import { ItemModal } from './ItemModal'
import { POPULAR_ORDER_THRESHOLD } from '@/lib/constants'

interface AdminItem {
  _id: string
  name: string
  description: string
  price: number
  categoryId: string
  imageUrl: string
  isAvailable: boolean
  orderedCount: number
  tags: string[]
  discountActive: boolean
  discountPercentage: number | null
  discountPrice: number | null
  isPopularOverride: boolean | null
}

interface AdminCategory {
  _id: string
  name: string
  slug: string
  displayOrder: number
  isActive: boolean
}

interface Stats {
  totalItems: number
  availableItems: number
  discountedItems: number
  popularItems: number
  totalCategories: number
  totalOrders: number
}

type FilterTab = 'all' | 'discounted' | 'popular' | 'unavailable'

export function AdminDashboard() {
  const [items, setItems] = useState<AdminItem[]>([])
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterTab, setFilterTab] = useState<FilterTab>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [discountTarget, setDiscountTarget] = useState<AdminItem | null>(null)
  const [editTarget, setEditTarget] = useState<AdminItem | null | undefined>(undefined) // undefined = closed, null = new
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [itemsRes, statsRes] = await Promise.all([
        fetch('/api/admin/menu/items'),
        fetch('/api/admin/stats'),
      ])
      if (!itemsRes.ok) throw new Error('Failed to load items')
      const itemsData = await itemsRes.json()
      setItems(itemsData.data.items)
      setCategories(itemsData.data.categories)
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.data)
      }
    } catch {
      setError('Failed to load admin data. Make sure you are logged in as admin.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSaveDiscount = async (id: string, data: { discountActive: boolean; discountPercentage: number | null; discountPrice: number | null }) => {
    const res = await fetch(`/api/admin/menu/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to save discount')
    await fetchData()
  }

  const handleSaveItem = async (id: string | null, data: Record<string, unknown>) => {
    const url = id ? `/api/admin/menu/items/${id}` : '/api/admin/menu/items'
    const method = id ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to save item')
    await fetchData()
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/menu/items/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete')
    setDeleteConfirm(null)
    await fetchData()
  }

  const resolveIsPopular = (item: AdminItem) => {
    if (item.isPopularOverride === true) return true
    if (item.isPopularOverride === false) return false
    return item.orderedCount >= POPULAR_ORDER_THRESHOLD
  }

  const computeSalePrice = (item: AdminItem): number | null => {
    if (!item.discountActive) return null
    if (item.discountPrice != null) return item.discountPrice
    if (item.discountPercentage != null) return Math.round(item.price * (1 - item.discountPercentage / 100) * 100) / 100
    return null
  }

  const getCategoryName = (id: string) => categories.find((c) => c._id === id)?.name ?? 'Unknown'

  // Filter items
  const filtered = items.filter((item) => {
    if (filterTab === 'discounted' && !item.discountActive) return false
    if (filterTab === 'popular' && !resolveIsPopular(item)) return false
    if (filterTab === 'unavailable' && item.isAvailable) return false
    if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
    }
    return true
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-red border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-4xl mb-4">⚠️</p>
          <p className="text-red-700 font-medium mb-4">{error}</p>
          <Button onClick={fetchData}>Retry</Button>
        </div>
      </div>
    )
  }

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All Items', count: items.length },
    { key: 'discounted', label: '🏷️ Discounted', count: items.filter((i) => i.discountActive).length },
    { key: 'popular', label: '🔥 Popular', count: items.filter(resolveIsPopular).length },
    { key: 'unavailable', label: '⛔ Unavailable', count: items.filter((i) => !i.isAvailable).length },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">🏮</span>
            <div>
              <h1 className="font-serif text-xl font-bold text-restaurant-text">Admin Dashboard</h1>
              <p className="text-xs text-restaurant-muted">Mascot Chinese Cuisine</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="text-sm text-restaurant-muted hover:text-brand-red transition-colors">← View Site</a>
            <a href="/admin/orders" className="text-sm text-restaurant-muted hover:text-brand-red transition-colors">📋 Orders</a>
            <a href="/admin/categories" className="text-sm text-restaurant-muted hover:text-brand-red transition-colors">🗂️ Categories</a>
            <Button size="sm" onClick={() => setEditTarget(null)}>+ Add Item</Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[
              { label: 'Total Items', value: stats.totalItems, color: 'text-gray-800', href: undefined },
              { label: 'Available', value: stats.availableItems, color: 'text-green-700', href: undefined },
              { label: 'Discounted', value: stats.discountedItems, color: 'text-red-600', href: undefined },
              { label: 'Popular', value: stats.popularItems, color: 'text-orange-600', href: undefined },
              { label: 'Categories', value: stats.totalCategories, color: 'text-blue-700', href: '/admin/categories' },
              { label: 'Total Orders', value: stats.totalOrders, color: 'text-purple-700', href: '/admin/orders' },
            ].map((s) => {
              const inner = (
                <>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                </>
              )
              return s.href ? (
                <a key={s.label} href={s.href} className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm hover:border-brand-red transition-colors block">
                  {inner}
                </a>
              ) : (
                <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
                  {inner}
                </div>
              )
            })}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items…"
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
              />
            </div>
            {/* Category filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red bg-white"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterTab(tab.key)}
                className={['px-3 py-1.5 rounded-full text-xs font-semibold transition-all', filterTab === tab.key ? 'bg-brand-red text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'].join(' ')}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Items count */}
        <p className="text-sm text-gray-500 mb-4">{filtered.length} item{filtered.length !== 1 ? 's' : ''} shown</p>

        {/* Items table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Item</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">Category</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">Price</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">Status</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">Orders</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">No items match your filters.</td>
                  </tr>
                ) : (
                  filtered.map((item) => {
                    const isPopular = resolveIsPopular(item)
                    const salePrice = computeSalePrice(item)
                    return (
                      <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 line-clamp-1">{item.name}</p>
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {isPopular && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">🔥 Popular</span>}
                                {item.discountActive && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium">🏷️ Discounted</span>}
                                {!item.isAvailable && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">⛔ Unavailable</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                          <span className="text-xs">{getCategoryName(item.categoryId)}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {salePrice != null ? (
                            <div>
                              <span className="font-bold text-red-600">{formatPrice(salePrice)}</span>
                              <span className="block text-xs text-gray-400 line-through">{formatPrice(item.price)}</span>
                            </div>
                          ) : (
                            <span className="font-medium text-gray-900">{formatPrice(item.price)}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={['text-xs px-2 py-1 rounded-full font-medium', item.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'].join(' ')}>
                            {item.isAvailable ? 'Available' : 'Unavailable'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600 font-medium">{item.orderedCount}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setDiscountTarget(item)}
                              title="Manage discount"
                              className="p-1.5 rounded-lg text-orange-600 hover:bg-orange-50 transition-colors text-sm"
                            >
                              🏷️
                            </button>
                            <button
                              onClick={() => setEditTarget(item)}
                              title="Edit item"
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors text-sm"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(item._id)}
                              title="Delete item"
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-sm"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Discount modal */}
      {discountTarget && (
        <DiscountModal
          item={discountTarget}
          onClose={() => setDiscountTarget(null)}
          onSave={handleSaveDiscount}
        />
      )}

      {/* Item edit/create modal */}
      {editTarget !== undefined && (
        <ItemModal
          item={editTarget}
          categories={categories}
          onClose={() => setEditTarget(undefined)}
          onSave={handleSaveItem}
        />
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="font-serif text-xl font-bold text-restaurant-text mb-2">Delete Item?</h2>
            <p className="text-restaurant-muted text-sm mb-5">This action cannot be undone. The item will be permanently removed.</p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setDeleteConfirm(null)} className="flex-1">Cancel</Button>
              <Button variant="danger" onClick={() => handleDelete(deleteConfirm)} className="flex-1">Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
