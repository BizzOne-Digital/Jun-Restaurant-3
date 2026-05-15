'use client'

import { create } from 'zustand'
import type { SessionUser } from '@/types'

// ============================================================
// Auth store — client-side auth state
// Hydrated from /api/auth/me on app load
// ============================================================

interface AuthStore {
  user: SessionUser | null
  isLoading: boolean
  setUser: (user: SessionUser | null) => void
  setLoading: (loading: boolean) => void
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,

  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),

  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      set({ user: null, isLoading: false })
    }
  },
}))
