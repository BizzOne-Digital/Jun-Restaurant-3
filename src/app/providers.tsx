'use client'

import React, { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'

// ============================================================
// Providers — hydrates auth state on app load
// ============================================================

export function Providers({ children }: { children: React.ReactNode }) {
  const { setUser } = useAuthStore()

  useEffect(() => {
    // Hydrate auth state from session on mount
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          setUser(data.data.user)
        } else {
          setUser(null)
        }
      } catch {
        setUser(null)
      }
    }

    fetchUser()
  }, [setUser])

  return <>{children}</>
}
