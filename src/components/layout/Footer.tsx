import React from 'react'
import Link from 'next/link'
import { RESTAURANT_INFO } from '@/lib/constants'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative mt-16 overflow-hidden" style={{ background: 'linear-gradient(135deg, #1A0A0A 0%, #2D1010 40%, #1A0A0A 100%)' }}>
      {/* Top accent */}
      <div className="h-1 bg-gradient-to-r from-brand-red via-brand-gold to-brand-red" />

      {/* Decorative orb */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-5 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #D4A017 0%, transparent 70%)' }} aria-hidden="true" />

      <div className="relative max-w-content mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-white/5">
                <img
                  src="/images/logo.png"
                  alt="Mascot Chinese Cuisine"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="block font-serif font-bold text-white text-base">Mascot Chinese</span>
                <span className="block text-xs text-brand-gold uppercase tracking-widest">Cuisine</span>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-5">
              Authentic Northeastern Chinese cuisine, freshly prepared in the heart of Mascot, Sydney.
            </p>
            {/* Social placeholders */}
            <div className="flex gap-2">
              {['📘', '📸', '🐦'].map((icon, i) => (
                <div key={i} className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sm hover:bg-white/10 transition-colors cursor-pointer" aria-hidden="true">
                  {icon}
                </div>
              ))}
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="font-semibold text-white mb-5 flex items-center gap-2">
              <span className="w-1 h-4 bg-brand-gold rounded-full" aria-hidden="true" />
              Visit Us
            </h3>
            <address className="not-italic text-sm text-gray-400 space-y-2">
              <p className="flex items-start gap-2">
                <span className="mt-0.5 flex-shrink-0" aria-hidden="true">📍</span>
                <span>{RESTAURANT_INFO.address}</span>
              </p>
              {RESTAURANT_INFO.phone ? (
                <p className="flex items-center gap-2">
                  <span aria-hidden="true">📞</span>
                  <a href={`tel:${RESTAURANT_INFO.phone}`} className="hover:text-brand-gold transition-colors">{RESTAURANT_INFO.phone}</a>
                </p>
              ) : (
                <p className="text-gray-600 text-xs italic">Phone: contact restaurant directly</p>
              )}
              {RESTAURANT_INFO.email && (
                <p className="flex items-center gap-2">
                  <span aria-hidden="true">✉️</span>
                  <a href={`mailto:${RESTAURANT_INFO.email}`} className="hover:text-brand-gold transition-colors">{RESTAURANT_INFO.email}</a>
                </p>
              )}
            </address>
          </div>

          {/* Hours */}
          <div>
            <h3 className="font-semibold text-white mb-5 flex items-center gap-2">
              <span className="w-1 h-4 bg-brand-gold rounded-full" aria-hidden="true" />
              Opening Hours
            </h3>
            <ul className="text-sm text-gray-400 space-y-1.5">
              {RESTAURANT_INFO.openingHours.map((entry) => (
                <li key={entry.day} className="flex justify-between gap-4">
                  <span className="text-gray-300 font-medium">{entry.day.slice(0, 3)}</span>
                  <span className="text-gray-400">{entry.hours}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-semibold text-white mb-5 flex items-center gap-2">
              <span className="w-1 h-4 bg-brand-gold rounded-full" aria-hidden="true" />
              Quick Links
            </h3>
            <nav aria-label="Footer navigation">
              <ul className="text-sm space-y-2">
                {[
                  { href: '/', label: 'Home' },
                  { href: '/menu', label: 'Menu' },
                  { href: '/cart', label: 'Cart' },
                  { href: '/account', label: 'My Account' },
                  { href: '/auth/login', label: 'Login' },
                  { href: '/auth/signup', label: 'Sign Up' },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-brand-gold transition-colors focus:outline-none focus:ring-1 focus:ring-brand-gold rounded flex items-center gap-2 group"
                    >
                      <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-brand-gold transition-colors" aria-hidden="true" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <p>&copy; {currentYear} Mascot Chinese Cuisine. All rights reserved.</p>
          <p className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-soft" aria-hidden="true" />
            Pickup &amp; Delivery · Mascot NSW 2020 · Prices in AUD
          </p>
        </div>
      </div>
    </footer>
  )
}
