import { connectDB } from '@/lib/db'
import MenuCategory from '@/models/MenuCategory'
import MenuItem from '@/models/MenuItem'
import type { IMenuItemDocument } from '@/models/MenuItem'
import type { IMenuCategory, IMenuItem, MenuGroupedByCategory } from '@/types'
import { POPULAR_ORDER_THRESHOLD } from '@/lib/constants'
import type { Types } from 'mongoose'

// ============================================================
// Menu service — categories and items
// ============================================================

type LeanMenuItem = Omit<IMenuItemDocument, keyof Document> & {
  _id: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

/**
 * Get all active menu categories sorted by displayOrder.
 */
export async function getCategories(): Promise<IMenuCategory[]> {
  await connectDB()

  const categories = await MenuCategory.find({ isActive: true })
    .sort({ displayOrder: 1 })
    .lean()

  return categories.map((c) => ({
    _id: c._id.toString(),
    name: c.name as string,
    slug: c.slug as string,
    displayOrder: c.displayOrder as number,
    isActive: c.isActive as boolean,
    createdAt: (c.createdAt as Date).toISOString(),
    updatedAt: (c.updatedAt as Date).toISOString(),
  }))
}

/**
 * Get all available menu items, optionally filtered by categoryId.
 */
export async function getMenuItems(categoryId?: string): Promise<IMenuItem[]> {
  await connectDB()

  const filter: Record<string, unknown> = { isAvailable: true }
  if (categoryId) {
    filter.categoryId = categoryId
  }

  const items = await MenuItem.find(filter)
    .sort({ categoryId: 1, name: 1 })
    .lean() as unknown as LeanMenuItem[]

  return items.map(serializeMenuItem)
}

/**
 * Get menu items grouped by category.
 * Used for the full menu page render.
 */
export async function getMenuGrouped(): Promise<MenuGroupedByCategory[]> {
  await connectDB()

  const [categories, items] = await Promise.all([
    MenuCategory.find({ isActive: true }).sort({ displayOrder: 1 }).lean(),
    MenuItem.find({ isAvailable: true }).lean() as unknown as Promise<LeanMenuItem[]>,
  ])

  const itemsByCategory = new Map<string, IMenuItem[]>()
  for (const item of items) {
    const catId = item.categoryId.toString()
    if (!itemsByCategory.has(catId)) {
      itemsByCategory.set(catId, [])
    }
    itemsByCategory.get(catId)!.push(serializeMenuItem(item))
  }

  return categories
    .map((cat) => ({
      category: {
        _id: cat._id.toString(),
        name: cat.name as string,
        slug: cat.slug as string,
        displayOrder: cat.displayOrder as number,
        isActive: cat.isActive as boolean,
        createdAt: (cat.createdAt as Date).toISOString(),
        updatedAt: (cat.updatedAt as Date).toISOString(),
      },
      items: itemsByCategory.get(cat._id.toString()) ?? [],
    }))
    .filter((group) => group.items.length > 0)
}

/**
 * Get all items that currently have an active discount.
 * These appear in the dynamic "Save on Select Items" section.
 */
export async function getDiscountedItems(): Promise<IMenuItem[]> {
  await connectDB()

  const items = await MenuItem.find({
    isAvailable: true,
    discountActive: true,
  })
    .sort({ name: 1 })
    .lean() as unknown as LeanMenuItem[]

  return items.map(serializeMenuItem)
}

/**
 * Get the most popular menu item(s).
 *
 * An item is popular if:
 *   - isPopularOverride === true (admin forced), OR
 *   - isPopularOverride === null AND orderedCount >= POPULAR_ORDER_THRESHOLD
 *
 * isPopularOverride === false means admin has suppressed the badge.
 */
export async function getPopularItems(): Promise<IMenuItem[]> {
  await connectDB()

  // Items where admin forced popular
  const forcedPopular = await MenuItem.find({
    isAvailable: true,
    isPopularOverride: true,
  }).lean() as unknown as LeanMenuItem[]

  // Items that crossed the threshold and haven't been suppressed
  const autoPopular = await MenuItem.find({
    isAvailable: true,
    orderedCount: { $gte: POPULAR_ORDER_THRESHOLD },
    isPopularOverride: { $ne: false },
  }).lean() as unknown as LeanMenuItem[]

  // Merge and deduplicate by _id
  const seen = new Set<string>()
  const all: LeanMenuItem[] = []
  for (const item of [...forcedPopular, ...autoPopular]) {
    const id = item._id.toString()
    if (!seen.has(id)) {
      seen.add(id)
      all.push(item)
    }
  }

  return all.map(serializeMenuItem)
}

// ---- helpers ----

/**
 * Compute the effective sale price for a discounted item.
 * discountPrice (explicit) takes precedence over discountPercentage.
 */
export function computeSalePrice(item: LeanMenuItem): number | null {
  if (!item.discountActive) return null
  if (item.discountPrice != null && item.discountPrice > 0) {
    return item.discountPrice
  }
  if (item.discountPercentage != null && item.discountPercentage > 0) {
    const sale = item.price * (1 - item.discountPercentage / 100)
    return Math.round(sale * 100) / 100
  }
  return null
}

/**
 * Resolve whether an item is popular based on orderedCount + override.
 */
export function resolveIsPopular(item: LeanMenuItem): boolean {
  if (item.isPopularOverride === true) return true
  if (item.isPopularOverride === false) return false
  return item.orderedCount >= POPULAR_ORDER_THRESHOLD
}

function serializeMenuItem(item: LeanMenuItem): IMenuItem {
  return {
    _id: item._id.toString(),
    categoryId: item.categoryId.toString(),
    name: item.name,
    slug: item.slug,
    description: item.description,
    price: item.price,
    currency: 'AUD',
    imageUrl: item.imageUrl,
    isAvailable: item.isAvailable,
    orderedCount: item.orderedCount,
    tags: item.tags,
    discountActive: item.discountActive ?? false,
    discountPercentage: item.discountPercentage ?? null,
    discountPrice: item.discountPrice ?? null,
    isPopularOverride: item.isPopularOverride ?? null,
    effectiveSalePrice: computeSalePrice(item),
    isPopular: resolveIsPopular(item),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }
}
