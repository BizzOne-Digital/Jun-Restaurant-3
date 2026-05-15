import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import MenuCategory from '@/models/MenuCategory'
import { getSessionUser } from '@/lib/auth'
import { slugify } from '@/lib/utils'

// ============================================================
// Admin: Categories — GET all, POST create
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
    const categories = await MenuCategory.find({}).sort({ displayOrder: 1 }).lean()
    return NextResponse.json({
      success: true,
      data: {
        categories: categories.map((c) => ({
          ...c,
          _id: c._id.toString(),
        })),
      },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch categories' }, { status: 500 })
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
    const { name, displayOrder, isActive } = body

    if (!name) {
      return NextResponse.json({ success: false, error: 'name is required' }, { status: 400 })
    }

    let slug = slugify(name)
    const existing = await MenuCategory.findOne({ slug })
    if (existing) slug = `${slug}-${Date.now()}`

    const category = await MenuCategory.create({
      name: name.trim(),
      slug,
      displayOrder: displayOrder ?? 99,
      isActive: isActive !== false,
    })

    return NextResponse.json(
      { success: true, data: { category: { ...category.toObject(), _id: category._id.toString() } } },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to create category' }, { status: 500 })
  }
}
