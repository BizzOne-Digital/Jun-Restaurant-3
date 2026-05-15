'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'
import { RESTAURANT_INFO } from '@/lib/constants'
import type { IOrder } from '@/types'

// ============================================================
// Order confirmation page
// ============================================================

export default function OrderConfirmationPage() {
  const params = useParams()
  const orderNumber = params.orderNumber as string

  const [order, setOrder] = useState<IOrder | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch('/api/orders')
        if (!res.ok) throw new Error('Failed to fetch orders')
        const data = await res.json()
        const found = data.data.orders.find(
          (o: IOrder) => o.orderNumber === orderNumber
        )
        if (found) {
          setOrder(found)
        } else {
          setError('Order not found.')
        }
      } catch {
        setError('Unable to load order details.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchOrder()
  }, [orderNumber])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-restaurant-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-red border-t-transparent" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-restaurant-bg flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-4xl mb-4" aria-hidden="true">😕</p>
          <p className="text-restaurant-muted mb-4">{error || 'Order not found.'}</p>
          <Link href="/"><Button>Back to Home</Button></Link>
        </div>
      </div>
    )
  }

  const isPickup = order.orderType === 'pickup'

  return (
    <div className="min-h-screen bg-restaurant-bg">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4" aria-hidden="true">🎉</div>
          <h1 className="font-serif text-3xl font-bold text-restaurant-text mb-2">
            Order Placed!
          </h1>
          <p className="text-restaurant-muted">
            Thank you for your order. We&apos;ll have it ready soon.
          </p>
        </div>

        {/* Order card */}
        <div className="bg-white rounded-card border border-restaurant-border p-6 mb-6">
          {/* Order number & status */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-restaurant-border">
            <div>
              <p className="text-sm text-restaurant-muted">Order Number</p>
              <p className="font-bold text-xl text-brand-red font-mono">
                #{order.orderNumber}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                <span className="w-2 h-2 bg-green-500 rounded-full" aria-hidden="true" />
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
          </div>

          {/* Order type */}
          <div className="mb-4 p-4 bg-gray-50 rounded-xl">
            <p className="text-sm font-medium text-restaurant-text mb-1">
              {isPickup ? '🏪 Pickup Order' : '🛵 Delivery Order'}
            </p>
            {isPickup ? (
              <p className="text-sm text-restaurant-muted">{RESTAURANT_INFO.address}</p>
            ) : order.deliveryAddress ? (
              <address className="not-italic text-sm text-restaurant-muted">
                {order.deliveryAddress.fullName}<br />
                {order.deliveryAddress.streetAddress}<br />
                {order.deliveryAddress.suburb} {order.deliveryAddress.state} {order.deliveryAddress.postcode}
              </address>
            ) : null}
          </div>

          {/* Items */}
          <div className="mb-4">
            <h2 className="font-semibold text-restaurant-text mb-3">Items Ordered</h2>
            <ul className="space-y-2">
              {order.items.map((item, idx) => (
                <li key={idx} className="flex justify-between text-sm">
                  <span className="text-restaurant-text">
                    {item.nameSnapshot} <span className="text-restaurant-muted">× {item.quantity}</span>
                  </span>
                  <span className="font-medium text-restaurant-text">
                    {formatPrice(item.priceSnapshot * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Totals */}
          <div className="border-t border-restaurant-border pt-4 space-y-2">
            <div className="flex justify-between text-sm text-restaurant-muted">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-restaurant-muted">
              <span>Tip ({order.tipPercentage}%)</span>
              <span>{formatPrice(order.tipAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-restaurant-text text-base pt-1 border-t border-restaurant-border">
              <span>Total</span>
              <span className="text-brand-red">{formatPrice(order.total)}</span>
            </div>
          </div>

          {/* Payment status */}
          {order.paymentStatus === 'paid' ? (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-800">
                ✅ <strong>Payment received</strong> — paid online via card
              </p>
            </div>
          ) : (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800">
                💳 <strong>Pay at store</strong> — payment is collected on {isPickup ? 'pickup' : 'delivery'}.
              </p>
            </div>
          )}
        </div>

        {/* Estimated time */}
        <div className="bg-red-50 border border-red-100 rounded-card p-4 mb-6 text-center">
          <p className="text-sm font-medium text-restaurant-text">
            ⏱️ Estimated {isPickup ? 'pickup' : 'delivery'} time: <strong>20–35 minutes</strong>
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/menu" className="flex-1">
            <Button variant="secondary" className="w-full">Order More</Button>
          </Link>
          <Link href="/account" className="flex-1">
            <Button className="w-full">View My Orders</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
