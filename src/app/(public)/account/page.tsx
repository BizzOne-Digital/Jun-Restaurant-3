'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'
import type { IOrder } from '@/types'

// ============================================================
// Account page — user info and order history
// ============================================================

export default function AccountPage() {
  const { user, isLoading: authLoading, logout } = useAuthStore()
  const [orders, setOrders] = useState<IOrder[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders')
        if (res.ok) {
          const data = await res.json()
          setOrders(data.data.orders)
        }
      } catch {
        // fail silently
      } finally {
        setOrdersLoading(false)
      }
    }
    fetchOrders()
  }, [user])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-restaurant-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-red border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-restaurant-bg flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-4xl mb-4" aria-hidden="true">🔒</p>
          <h1 className="font-serif text-2xl font-bold text-restaurant-text mb-2">
            Login Required
          </h1>
          <p className="text-restaurant-muted mb-6">
            Please log in to view your account.
          </p>
          <Link href="/auth/login">
            <Button size="lg">Login</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-restaurant-bg">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <h1 className="font-serif text-3xl font-bold text-restaurant-text">
            My Account
          </h1>
          <Button variant="secondary" onClick={logout} size="sm">
            Logout
          </Button>
        </div>

        {/* User info */}
        <div className="bg-white rounded-card border border-restaurant-border p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-brand-red flex items-center justify-center text-white text-xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-restaurant-text text-lg">{user.name}</p>
              <p className="text-restaurant-muted text-sm">{user.email}</p>
              <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                {user.role}
              </span>
            </div>
          </div>
        </div>

        {/* Order history */}
        <h2 className="font-serif text-2xl font-bold text-restaurant-text mb-4">
          Order History
        </h2>

        {ordersLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-card border border-restaurant-border p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-card border border-restaurant-border">
            <p className="text-4xl mb-3" aria-hidden="true">🍜</p>
            <p className="font-medium text-restaurant-text mb-2">No orders yet</p>
            <p className="text-restaurant-muted text-sm mb-6">
              Your order history will appear here.
            </p>
            <Link href="/menu">
              <Button>Browse Menu</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-card border border-restaurant-border p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="font-bold text-brand-red font-mono">
                      #{order.orderNumber}
                    </p>
                    <p className="text-sm text-restaurant-muted">
                      {new Date(order.createdAt).toLocaleDateString('en-AU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full capitalize font-medium">
                      {order.status}
                    </span>
                    <p className="font-bold text-restaurant-text mt-1">
                      {formatPrice(order.total)}
                    </p>
                  </div>
                </div>

                <div className="text-sm text-restaurant-muted">
                  <span className="capitalize">{order.orderType}</span>
                  {' · '}
                  {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                  {' · '}
                  {order.items.map((i) => i.nameSnapshot).join(', ').slice(0, 60)}
                  {order.items.map((i) => i.nameSnapshot).join(', ').length > 60 ? '…' : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
