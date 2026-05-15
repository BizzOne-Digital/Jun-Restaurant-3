'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { formatPrice } from '@/lib/utils'

// ============================================================
// Admin — Orders page
// ============================================================

interface OrderItem {
  menuItemId: string
  nameSnapshot: string
  priceSnapshot: number
  quantity: number
}

interface DeliveryAddress {
  fullName: string
  phone: string
  streetAddress: string
  suburb: string
  state: string
  postcode: string
  notes?: string
}

interface AdminOrder {
  _id: string
  orderNumber: string
  userId: string
  items: OrderItem[]
  orderType: 'pickup' | 'delivery'
  deliveryAddress: DeliveryAddress | null
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  subtotal: number
  tipPercentage: number
  tipAmount: number
  total: number
  status: string
  paymentStatus: string
  paymentIntentId?: string
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const STATUS_OPTIONS = ['placed', 'preparing', 'ready', 'completed', 'cancelled']

const STATUS_STYLES: Record<string, string> = {
  placed:    'bg-yellow-900/40 text-yellow-400 border-yellow-700/30',
  preparing: 'bg-blue-900/40 text-blue-400 border-blue-700/30',
  ready:     'bg-purple-900/40 text-purple-400 border-purple-700/30',
  completed: 'bg-green-900/40 text-green-400 border-green-700/30',
  cancelled: 'bg-[#2a2a2a] text-[#666] border-[#333]',
}

const PAYMENT_STYLES: Record<string, string> = {
  paid:         'bg-green-900/40 text-green-400',
  pending:      'bg-yellow-900/40 text-yellow-400',
  pay_at_store: 'bg-[#2a2a2a] text-[#888]',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-AU', {
    timeZone: 'Australia/Sydney',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Order detail drawer ────────────────────────────────────────────────────────

function OrderDrawer({
  order,
  onClose,
  onStatusChange,
  updating,
}: {
  order: AdminOrder
  onClose: () => void
  onStatusChange: (id: string, status: string) => void
  updating: boolean
}) {
  const isPickup = order.orderType === 'pickup'
  const customerName = order.customerName ?? order.deliveryAddress?.fullName ?? '—'
  const customerEmail = order.customerEmail ?? '—'
  const customerPhone = order.customerPhone ?? order.deliveryAddress?.phone ?? '—'

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Order details">
      {/* Backdrop */}
      <div className="flex-1 bg-black/60" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-md bg-[#1c1c1c] border-l border-[#2a2a2a] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
          <div>
            <p className="text-[10px] text-[#555] uppercase tracking-widest mb-0.5">Order</p>
            <p className="text-lg font-bold text-[#e8604c] font-mono">#{order.orderNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#666] hover:text-white transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Status + payment badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_STYLES[order.status] ?? 'bg-[#2a2a2a] text-[#888]'}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${PAYMENT_STYLES[order.paymentStatus] ?? 'bg-[#2a2a2a] text-[#888]'}`}>
              {order.paymentStatus === 'pay_at_store' ? 'Pay at store' : order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
            </span>
            <span className="text-xs text-[#555]">{isPickup ? '🏪 Pickup' : '🛵 Delivery'}</span>
          </div>

          {/* Date + Stripe ID */}
          <div className="space-y-1">
            <p className="text-xs text-[#555]">{formatDate(order.createdAt)}</p>
            {order.paymentIntentId && (
              <p className="text-[10px] text-[#444] font-mono break-all">{order.paymentIntentId}</p>
            )}
          </div>

          {/* Customer */}
          <div>
            <p className="text-[10px] text-[#555] uppercase tracking-widest mb-2">Customer</p>
            <div className="bg-[#161616] rounded-lg p-3 space-y-1.5">
              <p className="text-sm text-white">{customerName}</p>
              {customerEmail !== '—' && <p className="text-xs text-[#888]">{customerEmail}</p>}
              {customerPhone !== '—' && <p className="text-xs text-[#888]">{customerPhone}</p>}
            </div>
          </div>

          {/* Pickup / Delivery info */}
          <div>
            <p className="text-[10px] text-[#555] uppercase tracking-widest mb-2">
              {isPickup ? 'Pickup' : 'Delivery Address'}
            </p>
            <div className="bg-[#161616] rounded-lg p-3">
              {isPickup ? (
                <p className="text-sm text-[#aaa]">In-store pickup</p>
              ) : order.deliveryAddress ? (
                <address className="not-italic text-sm text-[#aaa] space-y-0.5">
                  <p>{order.deliveryAddress.fullName}</p>
                  <p>{order.deliveryAddress.streetAddress}</p>
                  <p>{order.deliveryAddress.suburb} {order.deliveryAddress.state} {order.deliveryAddress.postcode}</p>
                  <p>{order.deliveryAddress.phone}</p>
                  {order.deliveryAddress.notes && (
                    <p className="text-[#666] italic mt-1">Note: {order.deliveryAddress.notes}</p>
                  )}
                </address>
              ) : (
                <p className="text-sm text-[#555]">No address provided</p>
              )}
            </div>
          </div>

          {/* Items */}
          <div>
            <p className="text-[10px] text-[#555] uppercase tracking-widest mb-2">Items</p>
            <div className="bg-[#161616] rounded-lg divide-y divide-[#222]">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-[#666] w-5 text-center flex-shrink-0">×{item.quantity}</span>
                    <span className="text-sm text-[#ccc] truncate">{item.nameSnapshot}</span>
                  </div>
                  <span className="text-sm text-[#aaa] flex-shrink-0 ml-3">
                    {formatPrice(item.priceSnapshot * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-[#161616] rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm text-[#888]">
              <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-[#888]">
              <span>Tip ({order.tipPercentage}%)</span><span>{formatPrice(order.tipAmount)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-white border-t border-[#2a2a2a] pt-2">
              <span>Total</span><span className="text-[#e8604c]">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Footer — status update */}
        <div className="px-6 py-4 border-t border-[#2a2a2a]">
          <p className="text-[10px] text-[#555] uppercase tracking-widest mb-2">Update Status</p>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => onStatusChange(order._id, s)}
                disabled={updating || order.status === s}
                className={[
                  'px-3 py-1.5 rounded text-xs font-medium border transition-colors disabled:opacity-40',
                  order.status === s
                    ? `${STATUS_STYLES[s]} cursor-default`
                    : 'bg-[#2a2a2a] border-[#333] text-[#888] hover:text-white hover:border-[#555]',
                ].join(' ')}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
            {updating && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#e8604c] border-t-transparent self-center" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPayment, setFilterPayment] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchOrders = useCallback(async (p: number, status: string, payment: string) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20' })
      if (status) params.set('status', status)
      if (payment) params.set('paymentStatus', payment)
      const res = await fetch(`/api/admin/orders?${params}`)
      if (!res.ok) return
      const data = await res.json()
      setOrders(data.data.orders)
      setPagination(data.data.pagination)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders(page, filterStatus, filterPayment)
  }, [fetchOrders, page, filterStatus, filterPayment])

  const handleStatusChange = async (id: string, status: string) => {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) return
      const data = await res.json()
      const updated: AdminOrder = data.data.order
      setOrders((prev) => prev.map((o) => (o._id === id ? updated : o)))
      if (selectedOrder?._id === id) setSelectedOrder(updated)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleFilterChange = (status: string, payment: string) => {
    setPage(1)
    setFilterStatus(status)
    setFilterPayment(payment)
  }

  const activeCount = orders.filter((o) =>
    ['placed', 'preparing', 'ready'].includes(o.status)
  ).length

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Orders</h1>
          {pagination && (
            <p className="text-xs text-[#666] mt-1">
              {pagination.total} total · {activeCount} active on this page
            </p>
          )}
        </div>
        <button
          onClick={() => fetchOrders(page, filterStatus, filterPayment)}
          className="text-xs text-[#666] hover:text-white transition-colors px-3 py-1.5 rounded border border-[#2a2a2a] hover:border-[#444]"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <select
          value={filterStatus}
          onChange={(e) => handleFilterChange(e.target.value, filterPayment)}
          className="bg-[#2a2a2a] border border-[#333] text-[#aaa] text-xs rounded px-3 py-2 focus:outline-none focus:border-[#e8604c]"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>

        <select
          value={filterPayment}
          onChange={(e) => handleFilterChange(filterStatus, e.target.value)}
          className="bg-[#2a2a2a] border border-[#333] text-[#aaa] text-xs rounded px-3 py-2 focus:outline-none focus:border-[#e8604c]"
        >
          <option value="">All payments</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="pay_at_store">Pay at store</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="hidden md:grid grid-cols-[1.2fr_2fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-3 border-b border-[#2a2a2a] text-[10px] text-[#555] uppercase tracking-widest">
          <span>Order #</span>
          <span>Customer</span>
          <span>Type</span>
          <span>Total</span>
          <span>Payment</span>
          <span>Status</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#e8604c] border-t-transparent" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-[#555]">No orders found</div>
        ) : (
          orders.map((order) => {
            const customerName = order.customerName ?? order.deliveryAddress?.fullName ?? '—'
            const customerEmail = order.customerEmail ?? '—'
            return (
              <button
                key={order._id}
                onClick={() => setSelectedOrder(order)}
                className="w-full text-left border-b border-[#222] last:border-0 hover:bg-[#222] transition-colors focus:outline-none focus:bg-[#222]"
              >
                {/* Mobile layout */}
                <div className="md:hidden px-5 py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono text-[#e8604c]">#{order.orderNumber}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLES[order.status] ?? ''}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#ccc]">{customerName}</span>
                    <span className="text-sm font-semibold text-white">{formatPrice(order.total)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${PAYMENT_STYLES[order.paymentStatus] ?? ''}`}>
                      {order.paymentStatus === 'pay_at_store' ? 'Pay at store' : order.paymentStatus}
                    </span>
                    <span className="text-xs text-[#555]">{order.orderType}</span>
                    <span className="text-xs text-[#444]">{formatDate(order.createdAt)}</span>
                  </div>
                </div>

                {/* Desktop layout */}
                <div className="hidden md:grid grid-cols-[1.2fr_2fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-4 items-center">
                  <div>
                    <span className="text-sm font-mono text-[#e8604c]">#{order.orderNumber}</span>
                    <p className="text-[10px] text-[#444] mt-0.5">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-[#ccc] truncate">{customerName}</p>
                    {customerEmail !== '—' && (
                      <p className="text-xs text-[#555] truncate">{customerEmail}</p>
                    )}
                  </div>
                  <span className="text-xs text-[#888] capitalize">{order.orderType}</span>
                  <span className="text-sm font-semibold text-white">{formatPrice(order.total)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full w-fit ${PAYMENT_STYLES[order.paymentStatus] ?? ''}`}>
                    {order.paymentStatus === 'pay_at_store' ? 'Pay at store' : order.paymentStatus}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border w-fit ${STATUS_STYLES[order.status] ?? ''}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-[#555]">
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} orders
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 text-xs rounded border border-[#2a2a2a] text-[#888] hover:text-white hover:border-[#444] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="px-3 py-1.5 text-xs rounded border border-[#2a2a2a] text-[#888] hover:text-white hover:border-[#444] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Order detail drawer */}
      {selectedOrder && (
        <OrderDrawer
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
          updating={updatingId === selectedOrder._id}
        />
      )}
    </div>
  )
}
