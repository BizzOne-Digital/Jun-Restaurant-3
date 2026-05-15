'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { MobileMenu } from './MobileMenu'

export function Header() {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const items = useCartStore((s) => s.items)
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const { user, isLoading, logout } = useAuthStore()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/menu', label: 'Menu' },
    { href: '/cart', label: 'Cart' },
  ]

  return (
    <>
      <header
        className={[
          'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-header border-b border-restaurant-border'
            : 'bg-white/80 backdrop-blur-sm',
        ].join(' ')}
      >
        {/* Top accent line */}
        <div className="h-0.5 bg-gradient-to-r from-brand-red via-brand-gold to-brand-red" />

        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-brand-red rounded-xl p-1"
            >
              <div className="relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                <img
                  src="/images/logo.png"
                  alt="Mascot Chinese Cuisine"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="leading-tight">
                <span className="block font-serif font-bold text-brand-red text-base tracking-tight">
                  Mascot Chinese
                </span>
                <span className="block text-xs font-medium text-restaurant-muted tracking-wide uppercase">
                  Cuisine
                </span>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
              {navLinks.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={[
                      'relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                      'focus:outline-none focus:ring-2 focus:ring-brand-red',
                      isActive
                        ? 'text-brand-red bg-spice-50'
                        : 'text-restaurant-text hover:text-brand-red hover:bg-spice-50',
                    ].join(' ')}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-brand-red rounded-full" />
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Right controls */}
            <div className="flex items-center gap-2">

              {/* Cart */}
              <Link
                href="/cart"
                aria-label={`Cart, ${itemCount} item${itemCount !== 1 ? 's' : ''}`}
                className="relative p-2.5 rounded-xl hover:bg-spice-50 focus:outline-none focus:ring-2 focus:ring-brand-red transition-colors group"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-restaurant-text group-hover:text-brand-red transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {itemCount > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-0.5 -right-0.5 bg-brand-red text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-sm animate-fade-in"
                  >
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Link>

              {/* Auth — desktop */}
              <div className="hidden md:flex items-center gap-2">
                {isLoading ? null : user ? (
                  <>
                    {/* Admins: show name only — no link to account or admin panel from public site */}
                    {user.role === 'admin' ? (
                      <span className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-restaurant-muted cursor-default select-none">
                        <span className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-red to-spice-700 flex items-center justify-center text-white text-xs font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                        <span>{user.name.split(' ')[0]}</span>
                      </span>
                    ) : (
                      <Link
                        href="/account"
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-restaurant-text hover:text-brand-red hover:bg-spice-50 transition-all focus:outline-none focus:ring-2 focus:ring-brand-red"
                      >
                        <span className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-red to-spice-700 flex items-center justify-center text-white text-xs font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                        <span>{user.name.split(' ')[0]}</span>
                      </Link>
                    )}
                    <button
                      onClick={logout}
                      className="px-3 py-2 rounded-xl text-sm font-medium text-restaurant-muted hover:text-brand-red hover:bg-spice-50 transition-all focus:outline-none focus:ring-2 focus:ring-brand-red"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      className="px-4 py-2 rounded-xl text-sm font-medium text-restaurant-text hover:text-brand-red hover:bg-spice-50 transition-all focus:outline-none focus:ring-2 focus:ring-brand-red"
                    >
                      Login
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-brand-red to-spice-500 text-white shadow-red hover:shadow-lg hover:from-spice-700 hover:to-brand-red transition-all focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-2"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>

              {/* Hamburger — mobile */}
              <button
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                aria-expanded={mobileOpen}
                className="md:hidden p-2.5 rounded-xl hover:bg-spice-50 focus:outline-none focus:ring-2 focus:ring-brand-red transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-restaurant-text" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <MobileMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)} user={user} onLogout={logout} />

      {/* Header spacer */}
      <div className="h-[68px]" aria-hidden="true" />
    </>
  )
}
