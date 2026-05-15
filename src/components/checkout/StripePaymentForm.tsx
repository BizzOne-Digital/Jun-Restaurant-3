'use client'

import React, { useState } from 'react'
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/Button'

// ============================================================
// StripePaymentForm — renders Stripe's PaymentElement and
// handles submission. Parent passes onSuccess(paymentIntentId).
// ============================================================

interface StripePaymentFormProps {
  total: number
  onSuccess: (paymentIntentId: string) => void
  onCancel: () => void
}

export function StripePaymentForm({ total, onSuccess, onCancel }: StripePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements || !isReady) return

    setIsProcessing(true)
    setErrorMessage(null)

    // Submit the elements form first — required before confirmPayment
    const { error: submitError } = await elements.submit()
    if (submitError) {
      setErrorMessage(submitError.message ?? 'Please check your payment details.')
      setIsProcessing(false)
      return
    }

    // Confirm the payment — Stripe handles 3DS, redirects, etc.
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // No redirect needed — we handle everything in-page
        return_url: `${window.location.origin}/order-confirmation/pending`,
      },
      redirect: 'if_required',
    })

    if (error) {
      setErrorMessage(error.message ?? 'Payment failed. Please try again.')
      setIsProcessing(false)
      return
    }

    if (paymentIntent?.status === 'succeeded') {
      onSuccess(paymentIntent.id)
    } else {
      setErrorMessage('Payment was not completed. Please try again.')
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        onReady={() => setIsReady(true)}
        options={{
          layout: 'tabs',
          paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
        }}
      />

      {!isReady && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-brand-red border-t-transparent" />
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
        >
          {errorMessage}
        </div>
      )}

      {isReady && (
        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            isLoading={isProcessing}
            disabled={!stripe || !elements || !isReady}
            className="flex-1"
            size="lg"
          >
            {isProcessing ? 'Processing…' : `Pay $${total.toFixed(2)}`}
          </Button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="px-4 py-2 text-sm text-restaurant-muted hover:text-restaurant-text border border-restaurant-border rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      )}

      <p className="text-xs text-center text-restaurant-muted">
        🔒 Secured by Stripe — your card details are never stored on our servers
      </p>
    </form>
  )
}
