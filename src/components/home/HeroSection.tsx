'use client'

import React from 'react'
import Image from 'next/image'

export function HeroSection() {
  const scrollToMenu = () => {
    const el = document.getElementById('menu-section')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section
      aria-label="Welcome to Mascot Chinese Cuisine"
      className="relative overflow-hidden"
      style={{ minHeight: '560px' }}
    >
      {/* ── Layer 1: full-bleed dish image across the entire hero ── */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1563245372-f21724e3856d?w=1600&q=90&fit=crop&crop=center"
          alt="Authentic Chinese cuisine dish"
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority
        />
      </div>

      {/* ── Layer 2: red gradient from left → transparent in the middle ── */}
      {/* Fully opaque red on the left, dissolves seamlessly into the image — no hard line */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to right, #6B0F0F 0%, #8B1A1A 12%, #A93226 26%, #C0392B 38%, rgba(139,26,26,0.88) 48%, rgba(100,15,15,0.55) 58%, rgba(60,10,10,0.2) 72%, rgba(30,5,5,0.05) 85%, transparent 100%)',
        }}
        aria-hidden="true"
      />

      {/* ── Layer 3: top + bottom vignette for readability ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 30%, transparent 60%, rgba(0,0,0,0.55) 100%)',
        }}
        aria-hidden="true"
      />

      {/* ── Layer 4: subtle pattern ── */}
      <div className="absolute inset-0 hero-pattern pointer-events-none opacity-40" aria-hidden="true" />

      {/* ── Content ── */}
      <div className="relative max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24 lg:py-28">
        {/* Text sits in the left ~half only */}
        <div className="w-full lg:w-[52%]">

          {/* Live badge */}
          <div className="inline-flex items-center gap-2.5 glass rounded-full px-5 py-2 text-sm font-medium text-white mb-7 animate-fade-up">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-soft" aria-hidden="true" />
            <span>Now taking online orders</span>
            <span className="text-brand-gold" aria-hidden="true">✦</span>
          </div>

          {/* Heading */}
          <h1
            className="font-serif text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold leading-[1.1] text-white mb-5 animate-fade-up"
            style={{ animationDelay: '0.1s' }}
          >
            Authentic Chinese{' '}
            <span className="block">
              Favourites,{' '}
              <span className="text-gradient">Freshly Prepared</span>
            </span>
            <span className="block text-white/90">in Mascot</span>
          </h1>

          {/* Description */}
          <p
            className="text-base md:text-lg text-white/75 leading-relaxed mb-8 max-w-md animate-fade-up"
            style={{ animationDelay: '0.2s' }}
          >
            Order comforting noodles, seafood, rice bowls, soups, and classic
            Chinese dishes for pickup or delivery.
          </p>

          {/* CTA */}
          <div
            className="flex mb-10 animate-fade-up"
            style={{ animationDelay: '0.3s' }}
          >
            <button
              onClick={scrollToMenu}
              className="group inline-flex items-center justify-center gap-3 px-28 py-4 rounded-2xl font-bold text-lg text-gray-900 shadow-gold hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #D4A017 0%, #F0C040 50%, #D4A017 100%)' }}
            >
              <span className="text-xl group-hover:animate-bounce-soft" aria-hidden="true">🛒</span>
              Order Now
            </button>
          </div>

          {/* Info pills */}
          <div
            className="flex flex-wrap gap-2.5 animate-fade-up"
            style={{ animationDelay: '0.4s' }}
          >
            {[
              { icon: '🚗', text: 'Pickup Available' },
              { icon: '🛵', text: 'Delivery Available' },
              { icon: '💵', text: 'Prices in AUD' },
              { icon: '📍', text: 'Mascot, NSW 2020' },
            ].map((badge) => (
              <div
                key={badge.text}
                className="flex items-center gap-2 glass rounded-full px-4 py-2 text-sm text-white/90 hover:bg-white/15 transition-colors"
              >
                <span aria-hidden="true">{badge.icon}</span>
                <span>{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div
        className="relative border-t border-white/10"
        style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}
      >
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-0 md:divide-x md:divide-white/10">
            {[
              { value: '17+', label: 'Menu Categories' },
              { value: '100%', label: 'Fresh Daily' },
              { value: '20–35', label: 'Min Pickup' },
              { value: 'AUD', label: 'Local Pricing' },
            ].map((stat) => (
              <div key={stat.label} className="text-center md:px-8">
                <div className="text-2xl font-bold font-serif" style={{ color: '#F0C040' }}>{stat.value}</div>
                <div className="text-xs mt-0.5 uppercase tracking-widest font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Wave bottom */}
      <div aria-hidden="true" style={{ display: 'block', overflow: 'hidden', lineHeight: 0, marginBottom: '-2px' }}>
        <svg
          viewBox="0 0 1440 90"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          style={{ display: 'block', width: '100%', height: '90px' }}
        >
          <path
            d="M0,90 L0,45 C120,70 240,20 360,40 C480,60 600,10 720,35 C840,60 960,15 1080,38 C1200,61 1320,25 1440,45 L1440,90 Z"
            fill="#FFF8F0"
          />
        </svg>
      </div>
    </section>
  )
}
