'use client'

import React, { useState, useEffect } from 'react'

interface SiteSettings {
  restaurantName: string; address: string; phone: string; email: string
  openingHours: string; pickupPrepTime: number; deliveryEnabled: boolean
}

const DEFAULT: SiteSettings = {
  restaurantName: 'Mascot Chinese Cuisine',
  address: '19-33 Kent Rd, 1 Floor, Mascot NSW 2020',
  phone: '', email: '',
  openingHours: 'Mon–Sun: 11:00 AM – 9:30 PM',
  pickupPrepTime: 20,
  deliveryEnabled: true,
}

export default function AdminSettingsPage() {
  const [form, setForm] = useState<SiteSettings>(DEFAULT)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => { if (d.success) setForm({ ...DEFAULT, ...d.data.settings }) })
      .finally(() => setIsLoading(false))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally { setIsSaving(false) }
  }

  const field = (label: string, key: keyof SiteSettings, type = 'text', hint?: string) => (
    <div key={key}>
      <label className="block text-[10px] text-[#666] uppercase tracking-widest mb-1.5">{label}</label>
      <input
        type={type}
        value={String(form[key])}
        onChange={(e) => setForm((p) => ({ ...p, [key]: type === 'number' ? parseInt(e.target.value) || 0 : e.target.value }))}
        className="w-full bg-[#2a2a2a] border border-[#333] text-white text-sm rounded px-4 py-2.5 focus:outline-none focus:border-[#e8604c]"
      />
      {hint && <p className="text-[10px] text-[#555] mt-1">{hint}</p>}
    </div>
  )

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#e8604c] border-t-transparent" />
    </div>
  )

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Site settings</h1>
      <p className="text-xs text-[#666] mb-8">These details show on the public website and on order confirmation emails sent to customers.</p>

      <form onSubmit={handleSave} className="max-w-2xl space-y-6">
        {/* Restaurant section */}
        <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg p-6 space-y-4">
          <p className="text-[10px] text-[#555] uppercase tracking-widest">Restaurant</p>
          {field('Restaurant Name', 'restaurantName')}
          {field('Address', 'address')}
          <div className="grid grid-cols-2 gap-4">
            {field('Phone', 'phone')}
            {field('Email', 'email', 'email')}
          </div>
          <div>
            <label className="block text-[10px] text-[#666] uppercase tracking-widest mb-1.5">Opening Hours</label>
            <textarea
              value={form.openingHours}
              onChange={(e) => setForm((p) => ({ ...p, openingHours: e.target.value }))}
              rows={3}
              className="w-full bg-[#2a2a2a] border border-[#333] text-white text-sm rounded px-4 py-2.5 focus:outline-none focus:border-[#e8604c] resize-none"
            />
          </div>
        </div>

        {/* Pickup section */}
        <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg p-6 space-y-4">
          <p className="text-[10px] text-[#555] uppercase tracking-widest">Pickup</p>
          {field('Default Pickup Preparation Time (minutes)', 'pickupPrepTime', 'number',
            'Shown on the order success page and in the customer confirmation email.')}
        </div>

        {/* Delivery section */}
        <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg p-6">
          <p className="text-[10px] text-[#555] uppercase tracking-widest mb-4">Delivery</p>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setForm((p) => ({ ...p, deliveryEnabled: !p.deliveryEnabled }))}
              className={`relative w-10 h-5 rounded-full transition-colors ${form.deliveryEnabled ? 'bg-[#e8604c]' : 'bg-[#333]'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.deliveryEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-[#aaa]">Delivery enabled</span>
          </label>
        </div>

        {/* Save */}
        <div className="flex items-center gap-4">
          <button
            type="submit" disabled={isSaving}
            className="px-8 py-2.5 rounded text-sm font-semibold text-white disabled:opacity-50 transition-colors"
            style={{ background: 'linear-gradient(90deg, #e8604c, #f0a500)' }}
          >
            {isSaving ? 'Saving…' : 'Save settings'}
          </button>
          {saved && <span className="text-xs text-green-400">✓ Saved</span>}
        </div>
      </form>
    </div>
  )
}
