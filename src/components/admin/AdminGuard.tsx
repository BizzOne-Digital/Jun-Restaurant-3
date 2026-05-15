'use client'

import React from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'

interface AdminGuardProps {
  children: React.ReactNode
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-restaurant-bg flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-restaurant-bg flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-4xl mb-4" aria-hidden="true">🔒</p>
          <h1 className="font-serif text-2xl font-bold text-restaurant-text mb-2">Login Required</h1>
          <p className="text-restaurant-muted mb-6">Please log in to access the admin panel.</p>
          <Link href="/auth/login"><Button size="lg">Login</Button></Link>
        </div>
      </div>
    )
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-restaurant-bg flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-4xl mb-4" aria-hidden="true">🚫</p>
          <h1 className="font-serif text-2xl font-bold text-restaurant-text mb-2">Access Denied</h1>
          <p className="text-restaurant-muted mb-6">You need admin privileges to access this page.</p>
          <Link href="/"><Button size="lg" variant="secondary">Back to Home</Button></Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
