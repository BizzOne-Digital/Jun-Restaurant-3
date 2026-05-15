'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { CartItemRow } from '@/components/cart/CartItem'
import { OrderTypeSelector } from '@/components/checkout/OrderTypeSelector'
import { DeliveryForm } from '@/components/checkout/DeliveryForm'
import { TipSelector } from '@/components/checkout/TipSelector'
import { OrderTotals } from '@/components/checkout/OrderTotals'
import { Button } from '@/components/ui/Button'
import type { TipPercentage } from '@/lib/constants'
import type { DeliveryAddressInput } from '@/validation/orderSchemas'

// ============================================================
// Checkout page — fill order details, then redirect to Stripe
// ============================================================

interface PickupContactErrors {
  fullName?: string
  email?: string
  phone?: string
}

export default function CheckoutPage() {
  const { user, isLoading: authLoading } = useAuthStore()
  const { items } = useCartStore()

  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup')
  const [tip, setTip] = useState<TipPercentage>(15)
  const [deliveryAddress, setDeliveryAddress] = useState<Partial<DeliveryAddressInput>>({})
  const [deliveryErrors, setDeliveryErrors] = useState<Partial<Record<keyof DeliveryAddressInput, string>>>({})

  // Pickup contact fields (name/email/phone for pickup orders)
  const [pickupFullName, setPickupFullName] = useState('')
  const [pickupEmail, setPickupEmail] = useState('')
  const [pickupPhone, setPickupPhone] = useState('')
  const [pickupErrors, setPickupErrors] = useState<PickupContactErrors>({})

  const [isRedirecting, setIsRedirecting] = useState(false)
  const [serverError, setServerError] = useState('')

  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-restaurant-bg flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-4xl mb-4" aria-hidden="true">🔒</p>
          <h1 className="font-serif text-2xl font-bold text-restaurant-text mb-2">Login Required</h1>
          <p className="text-restaurant-muted mb-6">You need to be logged in to place an order.</p>
          <Link href="/auth/login"><Button size="lg">Login to Continue</Button></Link>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-restaurant-bg flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-5xl mb-4" aria-hidden="true">🛒</p>
          <h1 className="font-serif text-2xl font-bold text-restaurant-text mb-2">Your cart is empty</h1>
          <Link href="/menu"><Button size="lg" className="mt-4">Browse Menu</Button></Link>
        </div>
      </div>
    )
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const tipAmount = Math.round(subtotal * (tip / 100) * 100) / 100
  const total = subtotal + tipAmount

  const validatePickupContact = (): boolean => {
    if (orderType !== 'pickup') return true
    const errors: PickupContactErrors = {}
    if (!pickupFullName.trim()) errors.fullName = 'Full name is required'
    if (!pickupEmail.trim()) {
      errors.email = 'Email is required'
    } else if (!/^\S+@\S+\.\S+$/.test(pickupEmail.trim())) {
      errors.email = 'Please enter a valid email address'
    }
    if (!pickupPhone.trim()) errors.phone = 'Phone number is required'
    setPickupErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateDelivery = (): boolean => {
    if (orderType !== 'delivery') return true
    const errors: Partial<Record<keyof DeliveryAddressInput, string>> = {}
    if (!deliveryAddress.fullName?.trim()) errors.fullName = 'Full name is required'
    if (!deliveryAddress.phone?.trim()) errors.phone = 'Phone number is required'
    if (!deliveryAddress.streetAddress?.trim()) errors.streetAddress = 'Street address is required'
    if (!deliveryAddress.suburb?.trim()) errors.suburb = 'Suburb is required'
    if (!deliveryAddress.state?.trim()) errors.state = 'State is required'
    if (!deliveryAddress.postcode?.trim()) errors.postcode = 'Postcode is required'
    setDeliveryErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handlePaySecurely = async () => {
    if (!validatePickupContact()) return
    if (!validateDelivery()) return
    setServerError('')
    setIsRedirecting(true)

    // For delivery, customer name/email/phone come from deliveryAddress + user session
    const customerName = orderType === 'pickup'
      ? pickupFullName.trim()
      : deliveryAddress.fullName?.trim() ?? ''
    const customerEmail = orderType === 'pickup'
      ? pickupEmail.trim()
      : user?.email ?? ''
    const customerPhone = orderType === 'pickup'
      ? pickupPhone.trim()
      : deliveryAddress.phone?.trim() ?? ''

    try {
      const res = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            menuItemId: i.id,
            name: i.name,
            quantity: i.quantity,
            imageUrl: i.imageUrl,
          })),
          orderMeta: {
            orderType,
            tipPercentage: tip,
            deliveryAddress: orderType === 'delivery' ? deliveryAddress : null,
            customerName,
            customerEmail,
            customerPhone,
          },
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setServerError(data.error ?? 'Failed to start payment. Please try again.')
        setIsRedirecting(false)
        return
      }

      // Redirect to Stripe hosted checkout
      window.location.href = data.data.url
    } catch {
      setServerError('An unexpected error occurred. Please try again.')
      setIsRedirecting(false)
    }
  }

  return (
    <div className="min-h-screen bg-restaurant-bg">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-serif text-3xl font-bold text-restaurant-text mb-8">Checkout</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* ── Left column ── */}
          <div className="md:col-span-2 space-y-6">
            {/* Order type */}
            <div className="bg-white rounded-card border border-restaurant-border p-6">
              <OrderTypeSelector value={orderType} onChange={setOrderType} />
            </div>

            {/* Pickup contact info */}
            {orderType === 'pickup' && (
              <div className="bg-white rounded-card border border-restaurant-border p-6">
                <h2 className="font-semibold text-restaurant-text mb-4">Your Details</h2>
                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label
                      htmlFor="pickup-fullname"
                      className="block text-xs font-semibold text-restaurant-text uppercase tracking-wide mb-1"
                    >
                      Full Name
                    </label>
                    <input
                      id="pickup-fullname"
                      type="text"
                      autoComplete="name"
                      value={pickupFullName}
                      onChange={(e) => {
                        setPickupFullName(e.target.value)
                        if (pickupErrors.fullName) setPickupErrors((prev) => ({ ...prev, fullName: undefined }))
                      }}
                      placeholder="Your full name"
                      className={`w-full px-4 py-3 rounded-xl border bg-restaurant-input text-restaurant-text placeholder-restaurant-muted focus:outline-none focus:ring-2 focus:ring-brand-red transition ${
                        pickupErrors.fullName ? 'border-red-400' : 'border-restaurant-border'
                      }`}
                    />
                    {pickupErrors.fullName && (
                      <p className="mt-1 text-xs text-red-500">{pickupErrors.fullName}</p>
                    )}
                  </div>

                  {/* Email + Phone row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="pickup-email"
                        className="block text-xs font-semibold text-restaurant-text uppercase tracking-wide mb-1"
                      >
                        Email
                      </label>
                      <input
                        id="pickup-email"
                        type="email"
                        autoComplete="email"
                        value={pickupEmail}
                        onChange={(e) => {
                          setPickupEmail(e.target.value)
                          if (pickupErrors.email) setPickupErrors((prev) => ({ ...prev, email: undefined }))
                        }}
                        placeholder="you@example.com"
                        className={`w-full px-4 py-3 rounded-xl border bg-restaurant-input text-restaurant-text placeholder-restaurant-muted focus:outline-none focus:ring-2 focus:ring-brand-red transition ${
                          pickupErrors.email ? 'border-red-400' : 'border-restaurant-border'
                        }`}
                      />
                      {pickupErrors.email && (
                        <p className="mt-1 text-xs text-red-500">{pickupErrors.email}</p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="pickup-phone"
                        className="block text-xs font-semibold text-restaurant-text uppercase tracking-wide mb-1"
                      >
                        Phone
                      </label>
                      <input
                        id="pickup-phone"
                        type="tel"
                        autoComplete="tel"
                        value={pickupPhone}
                        onChange={(e) => {
                          setPickupPhone(e.target.value)
                          if (pickupErrors.phone) setPickupErrors((prev) => ({ ...prev, phone: undefined }))
                        }}
                        placeholder="04xx xxx xxx"
                        className={`w-full px-4 py-3 rounded-xl border bg-restaurant-input text-restaurant-text placeholder-restaurant-muted focus:outline-none focus:ring-2 focus:ring-brand-red transition ${
                          pickupErrors.phone ? 'border-red-400' : 'border-restaurant-border'
                        }`}
                      />
                      {pickupErrors.phone && (
                        <p className="mt-1 text-xs text-red-500">{pickupErrors.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Delivery form */}
            {orderType === 'delivery' && (
              <div className="bg-white rounded-card border border-restaurant-border p-6">
                <h2 className="font-semibold text-restaurant-text mb-4">Delivery Address</h2>
                <DeliveryForm
                  values={deliveryAddress}
                  onChange={(field, val) =>
                    setDeliveryAddress((prev) => ({ ...prev, [field]: val }))
                  }
                  errors={deliveryErrors}
                />
              </div>
            )}

            {/* Tip selector */}
            <div className="bg-white rounded-card border border-restaurant-border p-6">
              <TipSelector value={tip} onChange={setTip} />
            </div>
          </div>

          {/* ── Right column — order summary ── */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-card border border-restaurant-border p-6 sticky top-24">
              <h2 className="font-serif text-xl font-bold text-restaurant-text mb-4">Order Summary</h2>

              {/* Cart items */}
              <div className="mb-4 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <CartItemRow key={item.id} item={item} compact />
                ))}
              </div>

              {/* Totals */}
              <OrderTotals
                subtotal={subtotal}
                tipPercentage={tip}
                tipAmount={tipAmount}
                total={total}
              />

              {serverError && (
                <div
                  role="alert"
                  className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
                >
                  {serverError}
                </div>
              )}

              <Button
                onClick={handlePaySecurely}
                isLoading={isRedirecting}
                className="w-full mt-4"
                size="lg"
              >
                {isRedirecting ? 'Redirecting to Stripe…' : '🔒 Pay Securely'}
              </Button>

              <p className="text-xs text-center text-restaurant-muted mt-2">
                You&apos;ll be taken to Stripe&apos;s secure payment page
              </p>

              <Link
                href="/cart"
                className="block text-center text-sm text-restaurant-muted hover:text-brand-red transition-colors mt-3 focus:outline-none focus:ring-2 focus:ring-brand-red rounded"
              >
                ← Back to Cart
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
