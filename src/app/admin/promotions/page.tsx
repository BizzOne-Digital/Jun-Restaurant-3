'use client'

import React, { useState, useEffect, useCallback } from 'react'

interface Promo { _id: string; code: string; type: 'percentage' | 'fixed'; value: number; expiresAt: string | null; maxUses: number; usedCount: number; isActive: boolean }

export default function AdminPromotionsPage() {
  const [promos, setPromos] = useState<Promo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [code, setCode] = useState('')
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage')
  const [value, setValue] = useState('10')
  const [expiresAt, setExpiresAt] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() + 1)
    return d.toISOString().slice(0, 10)
  })
  const [maxUses, setMaxUses] = useState('100')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  const fetchPromos = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/promotions')
      if (!res.ok) return
      const data = await res.json()
      setPromos(data.data.promotions)
    } finally { setIsLoading(false) }
  }, [])

  useEffect(() => { fetchPromos() }, [fetchPromos])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) { setError('Code is required'); return }
    setAdding(true); setError('')
    try {
      const res = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase(), type, value: parseFloat(value), expiresAt, maxUses: parseInt(maxUses) }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed'); return }
      setCode('')
      await fetchPromos()
    } finally { setAdding(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this promotion?')) return
    await fetch(`/api/admin/promotions/${id}`, { method: 'DELETE' })
    await fetchPromos()
  }

  const handleToggle = async (promo: Promo) => {
    await fetch(`/api/admin/promotions/${promo._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !promo.isActive }),
    })
    await fetchPromos()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Promotions</h1>

      {/* Create form */}
      <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg p-5 mb-6">
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="flex gap-3 flex-wrap">
            <input
              value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="CODE" required
              className="flex-1 min-w-32 bg-[#2a2a2a] border border-[#333] text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-[#e8604c] placeholder:text-[#555] uppercase"
            />
            <select
              value={type} onChange={(e) => setType(e.target.value as 'percentage' | 'fixed')}
              className="bg-[#2a2a2a] border border-[#333] text-[#aaa] text-sm rounded px-3 py-2 focus:outline-none focus:border-[#e8604c]"
            >
              <option value="percentage">percentage</option>
              <option value="fixed">fixed</option>
            </select>
            <input
              value={value} onChange={(e) => setValue(e.target.value)}
              type="number" min="0" step="0.01" placeholder="Value"
              className="w-24 bg-[#2a2a2a] border border-[#333] text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-[#e8604c]"
            />
            <input
              value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)}
              type="date"
              className="bg-[#2a2a2a] border border-[#333] text-[#aaa] text-sm rounded px-3 py-2 focus:outline-none focus:border-[#e8604c]"
            />
            <input
              value={maxUses} onChange={(e) => setMaxUses(e.target.value)}
              type="number" min="0" placeholder="Max uses"
              className="w-28 bg-[#2a2a2a] border border-[#333] text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-[#e8604c]"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit" disabled={adding}
            className="w-full py-2.5 rounded text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(90deg, #e8604c, #f0a500)' }}
          >
            {adding ? 'Creating…' : 'Create promotion'}
          </button>
        </form>
      </div>

      {/* Promos list */}
      <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#e8604c] border-t-transparent" />
          </div>
        ) : promos.length === 0 ? (
          <div className="text-center py-16 text-[#555]">No promotions yet</div>
        ) : (
          promos.map((promo) => (
            <div key={promo._id} className="flex items-center justify-between px-5 py-4 border-b border-[#222] hover:bg-[#222] transition-colors">
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-white font-mono">{promo.code}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${promo.isActive ? 'bg-green-900/40 text-green-400' : 'bg-[#2a2a2a] text-[#555]'}`}>
                  {promo.isActive ? 'active' : 'inactive'}
                </span>
              </div>
              <div className="flex items-center gap-6 text-xs text-[#666]">
                <span>{promo.type} {promo.value}{promo.type === 'percentage' ? '%' : ' AUD'}</span>
                <span>used {promo.usedCount}/{promo.maxUses === 0 ? '∞' : promo.maxUses}</span>
                {promo.expiresAt && <span>expires {new Date(promo.expiresAt).toLocaleDateString('en-AU')}</span>}
                <button onClick={() => handleToggle(promo)} className="text-[#888] hover:text-white">
                  {promo.isActive ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => handleDelete(promo._id)} className="text-red-500 hover:text-red-300">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
