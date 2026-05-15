import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import MenuCategory from '@/models/MenuCategory'
import { getSessionUser } from '@/lib/auth'
import { slugify } from '@/lib/utils'

// ============================================================
// Admin: Category by ID — GET, PATCH, DELETE
// Requires admin role
// ============================================================

async function requireAdmin() {
  const user = await getSessionUser()
  if (!user || user.role !== 'admin') return null
  return user
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
  }

  try {
    await connectDB()
    const { id } = await params
    const category = await MenuCategory.findById(id).lean()
    if (!category) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 })
    }
    return NextResponse.json({
      success: true,
      data: { category: { ...category, _id: category._id.toString() } },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch category' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
  }

  try {
    await connectDB()
    const { id } = await params
    const body = await request.json()

    const allowedFields = ['name', 'displayOrder', 'isActive']
    const update: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (field in body) {
        update[field] = body[field]
      }
    }

    // If name is being updated, regenerate slug
    if (typeof update.name === 'string' && update.name.trim()) {
      update.name = update.name.trim()
      const newSlug = slugify(update.name as string)
      // Only update slug if it doesn't conflict with another category
      const existing = await MenuCategory.findOne({ slug: newSlug, _id: { $ne: id } })
      if (!existing) {
        update.slug = newSlug
      }
    }

    const category = await MenuCategory.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true }
    ).lean()

    if (!category) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: { category: { ...category, _id: category._id.toString() } },
    })
  } catch (error) {
    console.error('Admin update category error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update category' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
  }

  try {
    await connectDB()
    const { id } = await params
    const category = await MenuCategory.findByIdAndDelete(id)
    if (!category) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, message: 'Category deleted' })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to delete category' }, { status: 500 })
  }
}
