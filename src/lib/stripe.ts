import Stripe from 'stripe'
import { loadStripe, type Stripe as StripeClient } from '@stripe/stripe-js'

// ============================================================
// Stripe helpers — server-side instance + client-side loader
// ============================================================

// Server-side Stripe instance (used in API routes only)
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
  return new Stripe(key, { apiVersion: '2025-02-24.acacia' })
}

// Client-side Stripe promise (singleton, safe to call multiple times)
let stripePromise: Promise<StripeClient | null> | null = null

export function getStripeClient(): Promise<StripeClient | null> {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    if (!key) throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set')
    stripePromise = loadStripe(key)
  }
  return stripePromise
}
