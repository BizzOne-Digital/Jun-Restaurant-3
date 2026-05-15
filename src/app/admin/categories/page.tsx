'use client'

import React, { useState, useEffect, useCallback } from 'react'

interface Category { _id: string; name: string; slug: string; displayOrder: number; isActive: boolean }

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editOrder, setEditOrder] = useState('')

  const fetchCategories = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/menu/categories')
      if (!res.ok) return
      const data = await res.json()
      setCategories(data.data.categories)
    } finally { setIsLoading(false) }
  }, [])

  useEffect(() => { fetchCategories() }, [fetchCategories])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setAdding(true)
    try {
      await fetch('/api/admin/menu/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), displayOrder: categories.length + 1 }),
      })
      setNewName('')
      await fetchCategories()
    } finally { setAdding(false) }
  }

  const handleToggle = async (cat: Category) => {
    await fetch(`/api/admin/menu/categories/${cat._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !cat.isActive }),
    })
    await fetchCategories()
  }

  const handleSaveEdit = async (id: string) => {
    await fetch(`/api/admin/menu/categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim(), displayOrder: parseInt(editOrder) || 99 }),
    })
    setEditingId(null)
    await fetchCategories()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return
    await fetch(`/api/admin/menu/categories/${id}`, { method: 'DELETE' })
    await fetchCategories()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Categories</h1>

      {/* Add form */}
      <form onSubmit={handleAdd} className="flex gap-3 mb-6">
        <input
          value={newName} onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name" required
          className="flex-1 bg-[#1c1c1c] border border-[#2a2a2a] text-white text-sm rounded px-4 py-2.5 focus:outline-none focus:border-[#e8604c] placeholder:text-[#555]"
        />
        <button
          type="submit" disabled={adding}
          className="px-5 py-2.5 rounded text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: 'linear-gradient(90deg, #e8604c, #f0a500)' }}
        >
          {adding ? 'Adding…' : 'Add'}
        </button>
      </form>

      {/* List */}
      <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#e8604c] border-t-transparent" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16 text-[#555]">No categories yet</div>
        ) : (
          categories.map((cat, idx) => (
            <div key={cat._id} className="flex items-center justify-between px-5 py-4 border-b border-[#222] hover:bg-[#222] transition-colors">
              {editingId === cat._id ? (
                <div className="flex items-center gap-3 flex-1">
                  <input
                    value={editName} onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 bg-[#2a2a2a] border border-[#333] text-white text-sm rounded px-3 py-1.5 focus:outline-none focus:border-[#e8604c]"
                  />
                  <input
                    value={editOrder} onChange={(e) => setEditOrder(e.target.value)}
                    type="number" placeholder="Order" className="w-20 bg-[#2a2a2a] border border-[#333] text-white text-sm rounded px-3 py-1.5 focus:outline-none focus:border-[#e8604c]"
                  />
                  <button onClick={() => handleSaveEdit(cat._id)} className="text-xs text-green-400 hover:text-green-300">Save</button>
                  <button onClick={() => setEditingId(null)} className="text-xs text-[#666] hover:text-white">Cancel</button>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <span className="text-sm text-white">{cat.name}</span>
                    <span className="text-xs text-[#555] ml-2">({cat.slug})</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#555]">
                    <span>order {idx + 1}</span>
                    <span className={cat.isActive ? 'text-green-400' : 'text-[#555]'}>
                      {cat.isActive ? 'active' : 'hidden'}
                    </span>
                    <button
                      onClick={() => { setEditingId(cat._id); setEditName(cat.name); setEditOrder(String(cat.displayOrder)) }}
                      className="text-[#888] hover:text-white"
                    >Edit</button>
                    <button onClick={() => handleToggle(cat)} className="text-[#e8604c] hover:text-red-300">
                      {cat.isActive ? 'Hide' : 'Show'}
                    </button>
                    <button onClick={() => handleDelete(cat._id)} className="text-red-500 hover:text-red-300">Delete</button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
