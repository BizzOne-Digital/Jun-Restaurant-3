'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { signupSchema } from '@/validation/authSchemas'

// ============================================================
// Signup form — name, email, password, confirm password
// ============================================================

export function SignupForm() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
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
    const result = signupSchema.safeParse(form)
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
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          setErrors({ email: 'An account with this email already exists' })
        } else {
          setServerError(data.error ?? 'Signup failed. Please try again.')
        }
        return
      }

      setUser(data.data.user)
      router.push('/')
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
        label="Full Name"
        required
        value={form.name}
        onChange={(e) => handleChange('name', e.target.value)}
        error={errors.name}
        placeholder="Jane Smith"
        autoComplete="name"
      />

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
        placeholder="At least 8 characters"
        autoComplete="new-password"
        hint="Minimum 8 characters"
      />

      <Input
        label="Confirm Password"
        type="password"
        required
        value={form.confirmPassword}
        onChange={(e) => handleChange('confirmPassword', e.target.value)}
        error={errors.confirmPassword}
        placeholder="Repeat your password"
        autoComplete="new-password"
      />

      <Button
        type="submit"
        isLoading={isLoading}
        className="w-full"
        size="lg"
      >
        Create Account
      </Button>

      <p className="text-center text-sm text-restaurant-muted">
        Already have an account?{' '}
        <Link
          href="/auth/login"
          className="text-brand-red font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-brand-red rounded"
        >
          Login
        </Link>
      </p>
    </form>
  )
}
