'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { CategoryTabs } from './CategoryTabs'
import { MenuItemCard } from './MenuItemCard'
import { MenuItemModal } from './MenuItemModal'
import { MenuSkeletonGrid } from './MenuItemSkeleton'
import type { IMenuCategory, IMenuItem, MenuGroupedByCategory } from '@/types'

// Virtual category slug for the "Save on Select Items" section
const DISCOUNTS_SLUG = 'save-on-select-items'

interface MenuSectionProps {
  initialData?: MenuGroupedByCategory[]
}

export function MenuSection({ initialData }: MenuSectionProps) {
  const [menuGroups, setMenuGroups] = useState<MenuGroupedByCategory[]>(initialData ?? [])
  const [discountedItems, setDiscountedItems] = useState<IMenuItem[]>([])
  const [activeSlug, setActiveSlug] = useState<string>('')
  const [isLoading, setIsLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [modalItem, setModalItem] = useState<IMenuItem | null>(null)

  // Fetch menu groups if no SSR data
  useEffect(() => {
    if (initialData) {
      if (initialData.length > 0) setActiveSlug(initialData[0].category.slug)
      return
    }
    const fetchMenu = async () => {
      try {
        setIsLoading(true)
        const res = await fetch('/api/menu/items?grouped=true')
        if (!res.ok) throw new Error('Failed to load menu')
        const data = await res.json()
        setMenuGroups(data.data.menuGroups)
        if (data.data.menuGroups.length > 0) setActiveSlug(data.data.menuGroups[0].category.slug)
      } catch {
        setError('Unable to load the menu. Please refresh the page.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchMenu()
  }, [initialData])

  useEffect(() => {
    if (initialData && initialData.length > 0 && !activeSlug) {
      setActiveSlug(initialData[0].category.slug)
    }
  }, [initialData, activeSlug])

  // Fetch discounted items — always fresh
  useEffect(() => {
    const fetchDiscounted = async () => {
      try {
        const res = await fetch('/api/menu/items?discounted=true')
        if (!res.ok) return
        const data = await res.json()
        setDiscountedItems(data.data.discountedItems ?? [])
      } catch { /* non-critical */ }
    }
    fetchDiscounted()
    // Poll every 30s so discount changes appear without full reload
    const interval = setInterval(fetchDiscounted, 30_000)
    return () => clearInterval(interval)
  }, [])

  // Build category list — prepend "Save on Select Items" if there are discounted items
  const categories: IMenuCategory[] = useMemo(() => {
    const base = menuGroups.map((g) => g.category)
    if (discountedItems.length === 0) return base
    const virtualCat: IMenuCategory = {
      _id: DISCOUNTS_SLUG,
      name: '🏷️ Save on Select Items',
      slug: DISCOUNTS_SLUG,
      displayOrder: 0,
      isActive: true,
      createdAt: '',
      updatedAt: '',
    }
    return [virtualCat, ...base]
  }, [menuGroups, discountedItems])

  // Set first tab when categories load
  useEffect(() => {
    if (categories.length > 0 && !activeSlug) {
      setActiveSlug(categories[0].slug)
    }
  }, [categories, activeSlug])

  // Resolve active items
  const activeItems: IMenuItem[] = useMemo(() => {
    if (activeSlug === DISCOUNTS_SLUG) return discountedItems
    return menuGroups.find((g) => g.category.slug === activeSlug)?.items ?? []
  }, [activeSlug, menuGroups, discountedItems])

  // Search filter — applied across ALL items when query is non-empty
  const searchResults: IMenuItem[] = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    const pool = menuGroups.flatMap((g) => g.items)
    return pool.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
    )
  }, [searchQuery, menuGroups])

  const isSearching = searchQuery.trim().length > 0
  const displayItems = isSearching ? searchResults : activeItems

  const totalDishes = menuGroups.reduce((n, g) => n + g.items.length, 0)

  // All items pool — used by modal for "frequently bought together"
  const allItems: IMenuItem[] = useMemo(
    () => menuGroups.flatMap((g) => g.items),
    [menuGroups]
  )

  return (
    <section id="menu-section" aria-label="Menu" className="bg-restaurant-bg">
      {/* Section header */}
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-4">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-spice-100 text-spice-600 text-xs font-semibold px-3 py-1 rounded-full mb-3 uppercase tracking-wide">
              <span aria-hidden="true">🍜</span> Fresh Daily
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-restaurant-text">
              Our Menu
            </h2>
            <p className="text-restaurant-muted mt-1">
              Authentic Northeastern Chinese dishes, made fresh daily.
            </p>
          </div>
          {totalDishes > 0 && (
            <div className="hidden md:flex items-center gap-1 text-sm text-restaurant-muted bg-white border border-restaurant-border rounded-full px-4 py-2 shadow-card">
              <span aria-hidden="true">📋</span>
              <span>{totalDishes} dishes</span>
            </div>
          )}
        </div>

        {/* Search bar */}
        <div className="relative max-w-lg">
          <label htmlFor="menu-search" className="sr-only">Search menu items</label>
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none" aria-hidden="true">
            <svg className="h-4 w-4 text-restaurant-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            id="menu-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dishes, ingredients, tags…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-restaurant-border bg-white text-sm text-restaurant-text placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-colors"
            aria-label="Search menu items"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute inset-y-0 right-3 flex items-center text-restaurant-muted hover:text-brand-red transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 h-9 w-32 shimmer rounded-full" aria-hidden="true" />
            ))}
          </div>
          <MenuSkeletonGrid count={8} />
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div role="alert" className="text-center py-16 bg-red-50 rounded-card-lg border border-red-200">
            <p className="text-3xl mb-3" aria-hidden="true">😕</p>
            <p className="text-red-700 font-medium mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-brand-red font-semibold underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-brand-red rounded"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Menu content */}
      {!isLoading && !error && (menuGroups.length > 0 || discountedItems.length > 0) && (
        <>
          {/* Sticky category tabs — hidden when searching */}
          {!isSearching && (
            <div className="sticky top-[68px] z-30 bg-restaurant-bg/95 backdrop-blur-sm border-b border-restaurant-border shadow-sm">
              <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <CategoryTabs categories={categories} activeSlug={activeSlug} onSelect={setActiveSlug} />
              </div>
            </div>
          )}

          {/* Items grid */}
          <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Search results header */}
            {isSearching && (
              <div className="mb-4">
                <p className="text-sm text-restaurant-muted">
                  {searchResults.length === 0
                    ? `No results for "${searchQuery}"`
                    : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} for "${searchQuery}"`}
                </p>
              </div>
            )}

            {/* "Save on Select Items" banner */}
            {!isSearching && activeSlug === DISCOUNTS_SLUG && (
              <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl flex items-center gap-3">
                <span className="text-2xl" aria-hidden="true">🏷️</span>
                <div>
                  <p className="font-semibold text-red-800">Save on Select Items</p>
                  <p className="text-sm text-red-600">
                    These items are currently on special. Prices shown include the discount.
                  </p>
                </div>
              </div>
            )}

            <div
              id={`category-panel-${isSearching ? 'search' : activeSlug}`}
              role="tabpanel"
              aria-labelledby={isSearching ? undefined : `category-tab-${activeSlug}`}
            >
              {displayItems.length === 0 ? (
                <div className="text-center py-20 text-restaurant-muted">
                  <p className="text-5xl mb-4" aria-hidden="true">🍽️</p>
                  <p className="font-semibold text-lg">
                    {isSearching ? 'No dishes match your search.' : 'No items in this category yet.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {displayItems.map((item) => (
                    <MenuItemCard key={item._id} item={item} onOpenModal={setModalItem} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {!isLoading && !error && menuGroups.length === 0 && discountedItems.length === 0 && (
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="text-center py-24 bg-white rounded-card-lg border border-restaurant-border shadow-card">
            <p className="text-6xl mb-4" aria-hidden="true">🍜</p>
            <p className="font-serif text-2xl font-bold text-restaurant-text mb-2">Menu coming soon!</p>
            <p className="text-restaurant-muted">
              Connect to MongoDB and run the seed script to populate the menu.
            </p>
          </div>
        </div>
      )}

      {/* Item detail modal — rendered at section level so it sits above everything */}
      {modalItem && (
        <MenuItemModal
          item={modalItem}
          allItems={allItems}
          onClose={() => setModalItem(null)}
        />
      )}
    </section>
  )
}
