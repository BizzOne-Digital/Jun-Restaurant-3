'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { formatPrice } from '@/lib/utils'

interface Stats {
  totalOrders: number
  revenue: number
  activePipeline: number
  completedOrders: number
  dailySales: { _id: string; total: number; count: number }[]
  statusBreakdown: { _id: string; count: number }[]
  popularMenuItems: { _id: string; name: string; orderedCount: number; price: number }[]
  recentOrders: { _id: string; orderNumber: string; total: number; status: string; createdAt: string }[]
}

// Simple bar chart — no external lib needed
function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="flex items-end gap-2 h-32 w-full">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-[#e8604c] rounded-sm transition-all"
            style={{ height: `${Math.max((d.value / max) * 100, 2)}%` }}
            title={`${d.label}: ${formatPrice(d.value)}`}
          />
          <span className="text-[9px] text-[#555] truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats')
      if (!res.ok) return
      const data = await res.json()
      setStats(data.data)
    } catch { /* silent */ }
    finally { setIsLoading(false) }
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#e8604c] border-t-transparent" />
      </div>
    )
  }

  // Build last-7-days chart data
  const chartData = (() => {
    const days: { label: string; value: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const label = key.slice(5) // MM-DD
      const found = stats?.dailySales.find((s) => s._id === key)
      days.push({ label, value: found?.total ?? 0 })
    }
    return days
  })()

  const statusMap = Object.fromEntries(
    (stats?.statusBreakdown ?? []).map((s) => [s._id, s.count])
  )

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Overview</h1>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'TOTAL ORDERS', value: stats?.totalOrders ?? 0 },
          { label: 'REVENUE (PAID)', value: formatPrice(stats?.revenue ?? 0) },
          { label: 'ACTIVE PIPELINE', value: stats?.activePipeline ?? 0 },
          { label: 'COMPLETED', value: stats?.completedOrders ?? 0 },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg p-5">
            <p className="text-[10px] text-[#666] uppercase tracking-widest mb-2">{kpi.label}</p>
            <p className="text-3xl font-bold text-white">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {/* Daily sales chart */}
        <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg p-5">
          <p className="text-xs text-[#888] mb-4">Daily sales (7d, paid)</p>
          <BarChart data={chartData} />
        </div>

        {/* Order status breakdown */}
        <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg p-5">
          <p className="text-xs text-[#888] mb-4">Order status breakdown</p>
          <div className="space-y-3">
            {[
              { label: 'Pending',   key: 'placed',    color: 'text-[#e8604c]' },
              { label: 'Preparing', key: 'preparing', color: 'text-yellow-400' },
              { label: 'Ready',     key: 'ready',     color: 'text-blue-400' },
              { label: 'Completed', key: 'completed', color: 'text-green-400' },
              { label: 'Cancelled', key: 'cancelled', color: 'text-[#666]' },
            ].map((row) => (
              <div key={row.key} className="flex items-center justify-between">
                <span className="text-sm text-[#aaa]">{row.label}</span>
                <span className={`text-sm font-bold ${row.color}`}>
                  {statusMap[row.key] ?? 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Popular items */}
        <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg p-5">
          <p className="text-xs text-[#888] mb-4">Popular Items</p>
          <div className="space-y-2">
            {(stats?.popularMenuItems ?? []).length === 0 && (
              <p className="text-sm text-[#555]">No orders yet</p>
            )}
            {(stats?.popularMenuItems ?? []).map((item) => (
              <div key={item._id} className="flex items-center justify-between">
                <span className="text-sm text-[#ccc] truncate flex-1 mr-4">{item.name}</span>
                <span className="text-xs text-[#888] whitespace-nowrap">
                  {item.orderedCount} orders · {formatPrice(item.price * item.orderedCount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent orders */}
        <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-[#888]">Recent orders</p>
          </div>
          <div className="space-y-2">
            {(stats?.recentOrders ?? []).length === 0 && (
              <p className="text-sm text-[#555]">No orders yet</p>
            )}
            {(stats?.recentOrders ?? []).map((order) => (
              <div key={order._id} className="flex items-center justify-between">
                <span className="text-xs text-[#e8604c] font-mono">{order.orderNumber}</span>
                <div className="flex items-center gap-3">
                  <span className={[
                    'text-xs px-2 py-0.5 rounded-full',
                    order.status === 'completed' ? 'bg-green-900/40 text-green-400' :
                    order.status === 'cancelled' ? 'bg-red-900/40 text-red-400' :
                    'bg-yellow-900/40 text-yellow-400',
                  ].join(' ')}>
                    {order.status}
                  </span>
                  <span className="text-xs text-[#aaa]">{formatPrice(order.total)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
