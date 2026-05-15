'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { loginSchema } from '@/validation/authSchemas'

// ============================================================
// Login form — email + password with validation
// ============================================================

export function LoginForm() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
    setServerError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Client-side validation
    const result = loginSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const [field, msgs] of Object.entries(
        result.error.flatten().fieldErrors
      )) {
        fieldErrors[field] = (msgs as string[])[0] ?? ''
      }
      setErrors(fieldErrors)
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      })

      const data = await res.json()

      if (!res.ok) {
        setServerError(data.error ?? 'Login failed. Please try again.')
        return
      }

      setUser(data.data.user)

      // Admins go straight to the admin portal
      if (data.data.user.role === 'admin') {
        router.push('/admin')
        return
      }

      // Regular users: honour ?redirect= or go home
      const params = new URLSearchParams(window.location.search)
      const redirect = params.get('redirect') ?? '/'
      router.push(redirect)
    } catch {
      setServerError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {serverError && (
        <div
          role="alert"
          className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"
        >
          {serverError}
        </div>
      )}

      <Input
        label="Email Address"
        type="email"
        required
        value={form.email}
        onChange={(e) => handleChange('email', e.target.value)}
        error={errors.email}
        placeholder="you@example.com"
        autoComplete="email"
      />

      <Input
        label="Password"
        type="password"
        required
        value={form.password}
        onChange={(e) => handleChange('password', e.target.value)}
        error={errors.password}
        placeholder="Your password"
        autoComplete="current-password"
      />

      <Button
        type="submit"
        isLoading={isLoading}
        className="w-full"
        size="lg"
      >
        Login
      </Button>

      <p className="text-center text-sm text-restaurant-muted">
        Don&apos;t have an account?{' '}
        <Link
          href="/auth/signup"
          className="text-brand-red font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-brand-red rounded"
        >
          Sign up
        </Link>
      </p>
    </form>
  )
}
