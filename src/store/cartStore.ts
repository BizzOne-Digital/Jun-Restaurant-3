'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, IMenuItem } from '@/types'
import { getCartItemCount } from '@/lib/utils'

// ============================================================
// Cart store — persisted to localStorage
// ============================================================

interface CartStore {
  items: CartItem[]
  addItem: (item: IMenuItem, quantity?: number, specialInstructions?: string) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  // Computed values (derived from items)
  itemCount: number
  subtotal: number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (menuItem: IMenuItem, quantity = 1, specialInstructions?: string) => {
        set((state) => {
          const existing = state.items.find((i) => i.id === menuItem._id)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === menuItem._id
                  ? {
                      ...i,
                      quantity: i.quantity + quantity,
                      // Update instructions if provided
                      ...(specialInstructions !== undefined && { specialInstructions }),
                    }
                  : i
              ),
            }
          }
          // Determine if this item is being added at a discounted price
          const effectiveSalePrice = menuItem.discountActive && menuItem.effectiveSalePrice != null
            ? menuItem.effectiveSalePrice
            : null
          const newItem: CartItem = {
            id: menuItem._id,
            name: menuItem.name,
            price: effectiveSalePrice ?? menuItem.price,
            originalPrice: effectiveSalePrice != null ? menuItem.price : undefined,
            quantity,
            imageUrl: menuItem.imageUrl,
            categoryId: menuItem.categoryId,
            specialInstructions: specialInstructions || undefined,
          }
          return { items: [...state.items, newItem] }
        })
      },

      removeItem: (itemId: string) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== itemId),
        }))
      },

      updateQuantity: (itemId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(itemId)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.id === itemId ? { ...i, quantity } : i
          ),
        }))
      },

      clearCart: () => set({ items: [] }),

      get itemCount() {
        return getCartItemCount(get().items)
      },

      get subtotal() {
        return get().items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        )
      },
    }),
    {
      name: 'mascot-chinese-cart',
      // Only persist items array — computed values are derived
      partialize: (state) => ({ items: state.items }),
    }
  )
)
