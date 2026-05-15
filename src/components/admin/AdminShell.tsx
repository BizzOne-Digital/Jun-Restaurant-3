'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { Spinner } from '@/components/ui/Spinner'
import { useNewOrderNotification } from '@/hooks/useNewOrderNotification'

// ============================================================
// AdminShell — dark sidebar layout wrapping all admin pages
// ============================================================

const NAV = [
  { href: '/admin',            label: 'Overview' },
  { href: '/admin/orders',     label: 'Orders' },
  { href: '/admin/menu',       label: 'Menu' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/sales',      label: 'Sales' },
  { href: '/admin/users',      label: 'Users' },
  { href: '/admin/promotions', label: 'Promotions' },
  { href: '/admin/settings',   label: 'Settings' },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoading, logout } = useAuthStore()

  // Play a beep whenever a new paid order arrives — only active for admins
  useNewOrderNotification(!!user && user.role === 'admin')

  const handleSignOut = async () => {
    await logout()
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-4xl mb-4">🔒</p>
          <p className="text-white mb-4">Login required</p>
          <Link href="/auth/login" className="text-[#e8a87c] underline">Login</Link>
        </div>
      </div>
    )
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-4xl mb-4">🚫</p>
          <p className="text-white mb-4">Admin access required</p>
          <Link href="/" className="text-[#e8a87c] underline">Back to site</Link>
        </div>
      </div>
    )
  }

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  return (
    <div className="flex min-h-screen bg-[#111111] text-white">
      {/* ── Sidebar ── */}
      <aside className="w-[140px] flex-shrink-0 bg-[#1c1c1c] flex flex-col border-r border-[#2a2a2a]">
        {/* Brand */}
        <div className="px-4 py-5 border-b border-[#2a2a2a]">
          <p className="text-[10px] font-bold text-[#888] uppercase tracking-widest">Mascot Admin</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3" aria-label="Admin navigation">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'block px-4 py-2.5 text-sm transition-colors',
                isActive(item.href)
                  ? 'text-white bg-[#2a2a2a] font-medium'
                  : 'text-[#999] hover:text-white hover:bg-[#242424]',
              ].join(' ')}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Sign out */}
        <div className="px-4 py-4 border-t border-[#2a2a2a]">
          <button
            onClick={handleSignOut}
            className="text-xs text-[#666] hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top breadcrumb bar */}
        <div className="px-8 py-4 border-b border-[#2a2a2a] bg-[#1c1c1c]">
          <p className="text-[10px] text-[#666] uppercase tracking-widest">Dashboard</p>
          <p className="text-sm font-semibold text-white mt-0.5">Operations</p>
        </div>

        {/* Page content */}
        <main className="flex-1 px-8 py-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
