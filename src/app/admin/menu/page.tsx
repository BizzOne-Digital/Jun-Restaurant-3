'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { formatPrice } from '@/lib/utils'

interface AdminItem {
  _id: string; name: string; description: string; price: number
  categoryId: string; imageUrl: string; isAvailable: boolean
  orderedCount: number; tags: string[]; discountActive: boolean
  discountPercentage: number | null; discountPrice: number | null
  isPopularOverride: boolean | null
}
interface AdminCategory { _id: string; name: string; slug: string }

export default function AdminMenuPage() {
  const [items, setItems] = useState<AdminItem[]>([])
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Quick-add form
  const [qaName, setQaName] = useState('')
  const [qaPrice, setQaPrice] = useState('12.99')
  const [qaCat, setQaCat] = useState('')
  const [qaDesc, setQaDesc] = useState('')
  const [qaAdding, setQaAdding] = useState(false)
  const [qaError, setQaError] = useState('')

  // Edit modal state
  const [editForm, setEditForm] = useState<Partial<AdminItem & { tagsStr: string }>>({})
  const [editSaving, setEditSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/menu/items')
      if (!res.ok) return
      const data = await res.json()
      setItems(data.data.items)
      setCategories(data.data.categories)
      if (!qaCat && data.data.categories.length > 0) setQaCat(data.data.categories[0]._id)
    } finally { setIsLoading(false) }
  }, [qaCat])

  useEffect(() => { fetchData() }, [fetchData])

  const getCatName = (id: string) => categories.find((c) => c._id === id)?.name ?? '—'

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!qaName.trim() || !qaCat) { setQaError('Name and category required'); return }
    setQaAdding(true); setQaError('')
    try {
      const res = await fetch('/api/admin/menu/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: qaName.trim(), price: parseFloat(qaPrice), categoryId: qaCat, description: qaDesc }),
      })
      if (!res.ok) { setQaError('Failed to add item'); return }
      setQaName(''); setQaDesc(''); setQaPrice('12.99')
      await fetchData()
    } finally { setQaAdding(false) }
  }

  const openEdit = (item: AdminItem) => {
    setEditForm({ ...item, tagsStr: item.tags.join(', ') })
    setEditingId(item._id)
  }

  const handleSaveEdit = async () => {
    if (!editingId) return
    setEditSaving(true)
    try {
      const tags = (editForm.tagsStr ?? '').split(',').map((t) => t.trim()).filter(Boolean)
      await fetch(`/api/admin/menu/items/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, tags, price: parseFloat(String(editForm.price ?? 0)) }),
      })
      setEditingId(null)
      await fetchData()
    } finally { setEditSaving(false) }
  }

  const handleToggleVisible = async (item: AdminItem) => {
    await fetch(`/api/admin/menu/items/${item._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable: !item.isAvailable }),
    })
    await fetchData()
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/menu/items/${id}`, { method: 'DELETE' })
    setDeletingId(null)
    await fetchData()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Menu</h1>
      <p className="text-xs text-[#666] mb-6">
        Use <span className="text-[#e8604c]">Hide</span> to remove an item from the public menu without deleting it. Hidden items stay in the database and can be shown again at any time.
      </p>

      {/* Quick add */}
      <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg p-5 mb-6">
        <p className="text-xs text-[#888] mb-3 uppercase tracking-widest">Quick add</p>
        <form onSubmit={handleQuickAdd} className="flex gap-3 flex-wrap">
          <input
            value={qaName} onChange={(e) => setQaName(e.target.value)}
            placeholder="Name" required
            className="flex-1 min-w-48 bg-[#2a2a2a] border border-[#333] text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-[#e8604c] placeholder:text-[#555]"
          />
          <input
            value={qaPrice} onChange={(e) => setQaPrice(e.target.value)}
            type="number" step="0.01" min="0" placeholder="Price"
            className="w-28 bg-[#2a2a2a] border border-[#333] text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-[#e8604c]"
          />
          <select
            value={qaCat} onChange={(e) => setQaCat(e.target.value)}
            className="flex-1 min-w-40 bg-[#2a2a2a] border border-[#333] text-[#aaa] text-sm rounded px-3 py-2 focus:outline-none focus:border-[#e8604c]"
          >
            <option value="">Select category</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <input
            value={qaDesc} onChange={(e) => setQaDesc(e.target.value)}
            placeholder="Description (optional)"
            className="flex-1 min-w-48 bg-[#2a2a2a] border border-[#333] text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-[#e8604c] placeholder:text-[#555]"
          />
          <button
            type="submit" disabled={qaAdding}
            className="px-6 py-2 rounded text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(90deg, #e8604c, #f0a500)' }}
          >
            {qaAdding ? 'Adding…' : 'Add item'}
          </button>
        </form>
        {qaError && <p className="text-xs text-red-400 mt-2">{qaError}</p>}
      </div>

      {/* Items table */}
      <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg overflow-hidden">
        <div className="grid grid-cols-[3fr_1.5fr_1fr_1fr_1.5fr] gap-4 px-4 py-3 border-b border-[#2a2a2a] text-[10px] text-[#555] uppercase tracking-widest">
          <span>Name</span><span>Category</span><span>Price</span><span>Visibility</span><span>Actions</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#e8604c] border-t-transparent" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-[#555]">No items yet</div>
        ) : (
          items.map((item) => (
            <div key={item._id} className="grid grid-cols-[3fr_1.5fr_1fr_1fr_1.5fr] gap-4 px-4 py-3 border-b border-[#222] hover:bg-[#222] transition-colors items-start">
              <div>
                <p className="text-sm text-white font-medium">{item.name}</p>
                {item.description && <p className="text-xs text-[#555] mt-0.5 line-clamp-1">{item.description}</p>}
                <div className="flex gap-1 mt-1 flex-wrap">
                  {item.discountActive && <span className="text-[10px] bg-red-900/40 text-red-400 px-1.5 py-0.5 rounded">Discounted</span>}
                  {(item.isPopularOverride === true || item.orderedCount >= 10) && <span className="text-[10px] bg-green-900/40 text-green-400 px-1.5 py-0.5 rounded">Popular</span>}
                </div>
              </div>
              <span className="text-xs text-[#888]">{getCatName(item.categoryId)}</span>
              <span className="text-xs text-white">{formatPrice(item.price)}</span>
              <button
                onClick={() => handleToggleVisible(item)}
                className={`text-xs font-medium w-fit ${item.isAvailable ? 'text-[#e8604c] hover:text-red-300' : 'text-green-400 hover:text-green-300'}`}
              >
                {item.isAvailable ? 'Hide' : 'Show'}
              </button>
              <div className="flex gap-3">
                <button onClick={() => openEdit(item)} className="text-xs text-[#888] hover:text-white">Edit</button>
                <button
                  onClick={() => openEdit(item)}
                  className={`text-xs font-medium ${item.discountActive ? 'text-red-400 hover:text-red-300' : 'text-yellow-500 hover:text-yellow-300'}`}
                >
                  {item.discountActive ? '🏷️ On Sale' : 'Set Sale'}
                </button>
                <button onClick={() => setDeletingId(item._id)} className="text-xs text-red-500 hover:text-red-300">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 overflow-y-auto">
          <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl w-full max-w-lg p-6 my-4">
            <h2 className="text-lg font-bold text-white mb-4">Edit Item</h2>
            <div className="space-y-3">
              {[
                { label: 'Name', key: 'name', type: 'text' },
                { label: 'Price (AUD)', key: 'price', type: 'number' },
                { label: 'Tags (comma-separated)', key: 'tagsStr', type: 'text' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-xs text-[#888] block mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    value={String(editForm[f.key as keyof typeof editForm] ?? '')}
                    onChange={(e) => setEditForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full bg-[#2a2a2a] border border-[#333] text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-[#e8604c]"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs text-[#888] block mb-1">Description</label>
                <textarea
                  value={editForm.description ?? ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                  className="w-full bg-[#2a2a2a] border border-[#333] text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-[#e8604c] resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-[#888] block mb-1">Category</label>
                <select
                  value={editForm.categoryId ?? ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, categoryId: e.target.value }))}
                  className="w-full bg-[#2a2a2a] border border-[#333] text-[#aaa] text-sm rounded px-3 py-2 focus:outline-none focus:border-[#e8604c]"
                >
                  {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#888] block mb-1">Popular Override</label>
                <select
                  value={editForm.isPopularOverride === true ? 'true' : editForm.isPopularOverride === false ? 'false' : 'auto'}
                  onChange={(e) => setEditForm((p) => ({ ...p, isPopularOverride: e.target.value === 'true' ? true : e.target.value === 'false' ? false : null }))}
                  className="w-full bg-[#2a2a2a] border border-[#333] text-[#aaa] text-sm rounded px-3 py-2 focus:outline-none focus:border-[#e8604c]"
                >
                  <option value="auto">Auto (by order count)</option>
                  <option value="true">Force Popular</option>
                  <option value="false">Hide Popular Badge</option>
                </select>
              </div>

              {/* ── Sale / Discount section ── */}
              <div className="border-t border-[#2a2a2a] pt-3 mt-1">
                <p className="text-xs text-[#888] uppercase tracking-widest mb-3">Sale / Discount</p>

                {/* Toggle discount active */}
                <label className="flex items-center gap-3 cursor-pointer mb-3">
                  <div
                    onClick={() => setEditForm((p) => ({ ...p, discountActive: !p.discountActive }))}
                    className={`relative w-9 h-5 rounded-full transition-colors ${editForm.discountActive ? 'bg-[#e8604c]' : 'bg-[#333]'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${editForm.discountActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-sm text-[#aaa]">Discount active</span>
                  {editForm.discountActive && (
                    <span className="text-xs bg-red-900/40 text-red-400 px-2 py-0.5 rounded-full">ON SALE</span>
                  )}
                </label>

                {editForm.discountActive && (
                  <div className="space-y-3 pl-1">
                    <p className="text-[10px] text-[#555]">Set either a percentage OR a fixed sale price — fixed price takes priority.</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-[#888] block mb-1">Discount % (e.g. 20)</label>
                        <input
                          type="number" min="1" max="99" step="1"
                          value={editForm.discountPercentage ?? ''}
                          onChange={(e) => setEditForm((p) => ({
                            ...p,
                            discountPercentage: e.target.value ? parseFloat(e.target.value) : null,
                          }))}
                          placeholder="e.g. 20"
                          className="w-full bg-[#2a2a2a] border border-[#333] text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-[#e8604c]"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[#888] block mb-1">Fixed sale price (AUD)</label>
                        <input
                          type="number" min="0.01" step="0.01"
                          value={editForm.discountPrice ?? ''}
                          onChange={(e) => setEditForm((p) => ({
                            ...p,
                            discountPrice: e.target.value ? parseFloat(e.target.value) : null,
                          }))}
                          placeholder={editForm.price ? String(Math.round((editForm.price as number) * 0.8 * 100) / 100) : ''}
                          className="w-full bg-[#2a2a2a] border border-[#333] text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-[#e8604c]"
                        />
                      </div>
                    </div>
                    {/* Preview */}
                    {(() => {
                      const base = parseFloat(String(editForm.price ?? 0))
                      const fp = editForm.discountPrice
                      const pct = editForm.discountPercentage
                      const sale = fp != null && fp > 0 ? fp : pct != null && pct > 0 ? Math.round(base * (1 - pct / 100) * 100) / 100 : null
                      if (!sale || !base) return null
                      return (
                        <div className="p-2.5 bg-green-900/20 border border-green-800/40 rounded-lg text-xs text-green-400">
                          Preview: <span className="font-bold">${sale.toFixed(2)}</span>
                          <span className="text-[#555] line-through ml-2">${base.toFixed(2)}</span>
                          <span className="ml-2">— saves ${(base - sale).toFixed(2)}</span>
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditingId(null)} className="flex-1 py-2 rounded bg-[#2a2a2a] text-[#888] text-sm hover:text-white border border-[#333]">Cancel</button>
              <button onClick={handleSaveEdit} disabled={editSaving} className="flex-1 py-2 rounded bg-[#e8604c] text-white text-sm font-semibold hover:bg-[#d4503c] disabled:opacity-50">
                {editSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl w-full max-w-sm p-6 text-center">
            <p className="text-white font-semibold mb-2">Delete this item?</p>
            <p className="text-xs text-[#666] mb-5">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingId(null)} className="flex-1 py-2 rounded bg-[#2a2a2a] text-[#888] text-sm border border-[#333]">Cancel</button>
              <button onClick={() => handleDelete(deletingId)} className="flex-1 py-2 rounded bg-red-600 text-white text-sm font-semibold hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
