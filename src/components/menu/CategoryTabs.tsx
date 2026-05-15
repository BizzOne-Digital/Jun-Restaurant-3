'use client'

import React, { useRef } from 'react'
import type { IMenuCategory } from '@/types'

interface CategoryTabsProps {
  categories: IMenuCategory[]
  activeSlug: string
  onSelect: (slug: string) => void
}

export function CategoryTabs({ categories, activeSlug, onSelect }: CategoryTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent, slug: string, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(slug) }
    if (e.key === 'ArrowRight') { const next = categories[index + 1]; if (next) onSelect(next.slug) }
    if (e.key === 'ArrowLeft')  { const prev = categories[index - 1]; if (prev) onSelect(prev.slug) }
  }

  return (
    <div
      ref={scrollRef}
      role="tablist"
      aria-label="Menu categories"
      className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x"
    >
      {categories.map((cat, index) => {
        const isActive = cat.slug === activeSlug
        return (
          <button
            key={cat._id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`category-panel-${cat.slug}`}
            id={`category-tab-${cat.slug}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onSelect(cat.slug)}
            onKeyDown={(e) => handleKeyDown(e, cat.slug, index)}
            className={[
              'flex-shrink-0 snap-start px-4 py-2 rounded-full text-sm font-medium',
              'transition-all duration-200 whitespace-nowrap',
              'focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-1',
              isActive
                ? 'bg-gradient-to-r from-brand-red to-spice-500 text-white shadow-red scale-105'
                : 'bg-white text-restaurant-text border border-restaurant-border hover:border-brand-red hover:text-brand-red hover:bg-spice-50 hover:shadow-sm',
            ].join(' ')}
          >
            {cat.name}
          </button>
        )
      })}
    </div>
  )
}
