'use client'

import { useEffect, useRef, useCallback } from 'react'

// ============================================================
// useNewOrderNotification
//
// Polls /api/admin/orders every POLL_INTERVAL_MS and plays
// /sounds/new-order.mp3 when a new PAID order is detected.
//
// Uses localStorage to persist the last-seen order ID so a
// page refresh does not re-trigger the sound.
//
// Only runs when the user is an admin (pass enabled=false otherwise).
// ============================================================

const POLL_INTERVAL_MS = 30_000          // 30 seconds
const STORAGE_KEY = 'admin_last_seen_paid_order_id'
const SOUND_PATH = '/sounds/new-order.mp3'

export function useNewOrderNotification(enabled: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastSeenIdRef = useRef<string | null>(null)
  const isFirstPollRef = useRef(true)

  // Initialise lastSeenId from localStorage on mount
  useEffect(() => {
    if (!enabled) return
    try {
      lastSeenIdRef.current = localStorage.getItem(STORAGE_KEY)
    } catch {
      // localStorage unavailable (SSR / private browsing) — ignore
    }
  }, [enabled])

  // Preload audio element once
  useEffect(() => {
    if (!enabled) return
    const audio = new Audio(SOUND_PATH)
    audio.preload = 'auto'
    audioRef.current = audio
    return () => {
      audioRef.current = null
    }
  }, [enabled])

  const playSound = useCallback(() => {
    if (!audioRef.current) return
    // Clone so rapid successive calls each play fully
    const sound = audioRef.current.cloneNode() as HTMLAudioElement
    sound.volume = 1
    sound.play().catch((err) => {
      // Browsers block autoplay until the user has interacted with the page.
      // This is expected on first load — subsequent polls after any click will work.
      console.warn('[order-notify] Audio play blocked (user interaction required):', err.message)
    })
  }, [])

  const poll = useCallback(async () => {
    try {
      // Fetch only the single most recent paid order
      const res = await fetch('/api/admin/orders?limit=5&paymentStatus=paid', {
        credentials: 'include',
      })
      if (!res.ok) return

      const data = await res.json()
      const orders: { _id: string; paymentStatus: string }[] = data?.data?.orders ?? []

      // Find the newest paid order
      const newestPaid = orders.find((o) => o.paymentStatus === 'paid')
      if (!newestPaid) return

      const newestId = newestPaid._id

      if (isFirstPollRef.current) {
        // On the very first poll, just record the current newest — don't beep
        isFirstPollRef.current = false
        if (lastSeenIdRef.current === null) {
          lastSeenIdRef.current = newestId
          try { localStorage.setItem(STORAGE_KEY, newestId) } catch { /* ignore */ }
        }
        return
      }

      // If the newest paid order ID has changed, it's a new order
      if (newestId !== lastSeenIdRef.current) {
        lastSeenIdRef.current = newestId
        try { localStorage.setItem(STORAGE_KEY, newestId) } catch { /* ignore */ }
        playSound()
        console.log('[order-notify] New paid order detected:', newestId)
      }
    } catch (err) {
      // Network error — silently ignore, will retry next interval
      console.warn('[order-notify] Poll failed:', err)
    }
  }, [playSound])

  useEffect(() => {
    if (!enabled) return

    // Run immediately, then on interval
    poll()
    const id = setInterval(poll, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [enabled, poll])
}
