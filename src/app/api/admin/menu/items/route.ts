import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import MenuItem from '@/models/MenuItem'
import MenuCategory from '@/models/MenuCategory'
import { getSessionUser } from '@/lib/auth'
import { slugify } from '@/lib/utils'

// ============================================================
// Admin: Menu Items — GET all, POST create
// Requires admin role
// ============================================================

async function requireAdmin() {
  const user = await getSessionUser()
  if (!user || user.role !== 'admin') return null
  return user
}

export async function GET() {
  const user = await requireAdmin()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
  }

  try {
    await connectDB()
    const items = await MenuItem.find({}).sort({ categoryId: 1, name: 1 }).lean()
    const categories = await MenuCategory.find({}).sort({ displayOrder: 1 }).lean()

    return NextResponse.json({
      success: true,
      data: {
        items: items.map((item) => ({
          ...item,
          _id: item._id.toString(),
          categoryId: item.categoryId.toString(),
        })),
        categories: categories.map((c) => ({
          _id: c._id.toString(),
          name: c.name,
          slug: c.slug,
          displayOrder: c.displayOrder,
          isActive: c.isActive,
        })),
      },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch items' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await requireAdmin()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
  }

  try {
    await connectDB()
    const body = await request.json()
    const { name, description, price, categoryId, imageUrl, isAvailable, tags } = body

    if (!name || !price || !categoryId) {
      return NextResponse.json(
        { success: false, error: 'name, price, and categoryId are required' },
        { status: 400 }
      )
    }

    // Generate unique slug
    let slug = slugify(name)
    const existing = await MenuItem.findOne({ slug })
    if (existing) {
      slug = `${slug}-${Date.now()}`
    }

    const item = await MenuItem.create({
      name: name.trim(),
      slug,
      description: description?.trim() ?? '',
      price: Number(price),
      categoryId,
      imageUrl: imageUrl || '/images/menu/placeholder-default.svg',
      isAvailable: isAvailable !== false,
      tags: Array.isArray(tags) ? tags : [],
      discountActive: false,
      discountPercentage: null,
      discountPrice: null,
      isPopularOverride: null,
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          item: { ...item.toObject(), _id: item._id.toString(), categoryId: item.categoryId.toString() },
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Admin create item error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create item' }, { status: 500 })
  }
}
