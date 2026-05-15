import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Login',
  description: 'Login to your Mascot Chinese Cuisine account.',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-restaurant-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl border border-restaurant-border shadow-sm p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="text-4xl" aria-hidden="true">🏮</span>
            <h1 className="font-serif text-2xl font-bold text-restaurant-text mt-3 mb-1">
              Welcome Back
            </h1>
            <p className="text-restaurant-muted text-sm">
              Login to your Mascot Chinese Cuisine account
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  )
}
