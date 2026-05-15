'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import type { SessionUser } from '@/types'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  user: SessionUser | null
  onLogout: () => void
}

export function MobileMenu({ isOpen, onClose, user, onLogout }: MobileMenuProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) {
      document.addEventListener('keydown', handleKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const navLinks = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/menu', label: 'Menu', icon: '🍜' },
    { href: '/cart', label: 'Cart', icon: '🛒' },
    // Account link only for non-admin users; admins manage everything via /admin
    ...(user?.role !== 'admin' ? [{ href: '/account', label: 'Account', icon: '👤' }] : []),
  ]

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-80 flex flex-col animate-slide-in overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #FFF8F0 0%, #FFFFFF 100%)' }}
      >
        {/* Top accent */}
        <div className="h-1 bg-gradient-to-r from-brand-red via-brand-gold to-brand-red" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-restaurant-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0">
              <img
                src="/images/logo.png"
                alt="Mascot Chinese Cuisine"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-serif font-bold text-brand-red text-base">Mascot Chinese</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="p-2 rounded-xl hover:bg-spice-50 focus:outline-none focus:ring-2 focus:ring-brand-red transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-restaurant-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto" aria-label="Mobile navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-restaurant-text font-medium hover:bg-spice-50 hover:text-brand-red transition-all focus:outline-none focus:ring-2 focus:ring-brand-red group"
            >
              <span className="text-lg w-7 text-center group-hover:scale-110 transition-transform" aria-hidden="true">{link.icon}</span>
              {link.label}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-auto text-restaurant-muted group-hover:text-brand-red transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </nav>

        {/* Auth */}
        <div className="px-4 py-5 border-t border-restaurant-border space-y-2 bg-spice-50/50">
          {user ? (
            <>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-restaurant-border mb-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-red to-spice-700 flex items-center justify-center text-white text-sm font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-restaurant-text">{user.name}</p>
                  <p className="text-xs text-restaurant-muted">{user.email}</p>
                </div>
              </div>
              <button
                onClick={() => { onLogout(); onClose() }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-brand-red font-medium hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-red"
              >
                <span aria-hidden="true">🚪</span> Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                onClick={onClose}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-restaurant-text font-medium border border-restaurant-border bg-white hover:border-brand-red hover:text-brand-red transition-all focus:outline-none focus:ring-2 focus:ring-brand-red"
              >
                Login
              </Link>
              <Link
                href="/auth/signup"
                onClick={onClose}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-white transition-all focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-2 shadow-red"
                style={{ background: 'linear-gradient(135deg, #C0392B 0%, #E74C3C 100%)' }}
              >
                Sign Up — It&apos;s Free
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  )
}
