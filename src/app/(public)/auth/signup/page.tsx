import type { Metadata } from 'next'
import { SignupForm } from '@/components/auth/SignupForm'

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create your Mascot Chinese Cuisine account.',
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-restaurant-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-restaurant-border shadow-sm p-8">
          <div className="text-center mb-8">
            <span className="text-4xl" aria-hidden="true">🏮</span>
            <h1 className="font-serif text-2xl font-bold text-restaurant-text mt-3 mb-1">
              Create Account
            </h1>
            <p className="text-restaurant-muted text-sm">
              Join Mascot Chinese Cuisine for easy online ordering
            </p>
          </div>

          <SignupForm />
        </div>
      </div>
    </div>
  )
}
