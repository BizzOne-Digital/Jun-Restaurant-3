'use client'

import React, { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCartStore } from '@/store/cartStore'

// ============================================================
// /checkout/success
// Stripe redirects here after a successful payment.
// We verify the session server-side, create the order, then
// redirect to the order confirmation page.
// ============================================================

function CheckoutSuccessInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clearCart = useCartStore((s) => s.clearCart)
  const [error, setError] = useState<string | null>(null)
  const called = useRef(false)

  useEffect(() => {
    // Prevent double-call in React strict mode
    if (called.current) return
    called.current = true

    const sessionId = searchParams.get('session_id')
    if (!sessionId) {
      setError('No session ID found. Please contact us if you were charged.')
      return
    }

    const verify = async () => {
      try {
        const res = await fetch('/api/payments/verify-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })

        const data = await res.json()

        if (!res.ok || !data.success) {
          setError(data.error ?? 'Could not confirm your order. Please contact us.')
          return
        }

        clearCart()
        router.replace(`/order-confirmation/${data.data.order.orderNumber}`)
      } catch {
        setError('An unexpected error occurred. Please contact us if you were charged.')
      }
    }

    verify()
  }, [searchParams, router, clearCart])

  if (error) {
    return (
      <div className="min-h-screen bg-restaurant-bg flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-4xl mb-4">⚠️</p>
          <h1 className="font-serif text-2xl font-bold text-restaurant-text mb-2">
            Something went wrong
          </h1>
          <p className="text-restaurant-muted mb-6">{error}</p>
          <a href="/" className="text-brand-red underline text-sm">Back to home</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-restaurant-bg flex items-center justify-center px-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-red border-t-transparent mx-auto mb-4" />
        <p className="text-restaurant-muted">Confirming your payment…</p>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-restaurant-bg flex items-center justify-center px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-red border-t-transparent mx-auto mb-4" />
            <p className="text-restaurant-muted">Loading…</p>
          </div>
        </div>
      }
    >
      <CheckoutSuccessInner />
    </Suspense>
  )
}
