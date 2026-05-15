import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import MenuItem from '@/models/MenuItem'
import { getSessionUser } from '@/lib/auth'

// ============================================================
// Admin: Menu Item by ID — GET, PATCH, DELETE
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
    const item = await MenuItem.findById(id).lean()
    if (!item) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 })
    }
    return NextResponse.json({
      success: true,
      data: {
        item: { ...item, _id: item._id.toString(), categoryId: item.categoryId.toString() },
      },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch item' }, { status: 500 })
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

    // Whitelist of fields admin can update
    const allowedFields = [
      'name', 'description', 'price', 'categoryId', 'imageUrl',
      'isAvailable', 'tags',
      'discountActive', 'discountPercentage', 'discountPrice',
      'isPopularOverride',
    ]

    const update: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (field in body) {
        update[field] = body[field]
      }
    }

    // Validate discount logic
    if ('discountActive' in update && update.discountActive === true) {
      const hasPercentage = 'discountPercentage' in update
        ? update.discountPercentage != null
        : false
      const hasPrice = 'discountPrice' in update
        ? update.discountPrice != null
        : false

      // Check existing item if neither is provided in this request
      if (!hasPercentage && !hasPrice) {
        const existing = await MenuItem.findById(id).lean()
        if (!existing?.discountPercentage && !existing?.discountPrice) {
          return NextResponse.json(
            { success: false, error: 'Provide discountPercentage or discountPrice when activating a discount' },
            { status: 400 }
          )
        }
      }
    }

    // If discount is being deactivated, clear the values
    if ('discountActive' in update && update.discountActive === false) {
      update.discountPercentage = null
      update.discountPrice = null
    }

    const item = await MenuItem.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true }
    ).lean()

    if (!item) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        item: { ...item, _id: item._id.toString(), categoryId: item.categoryId.toString() },
      },
    })
  } catch (error) {
    console.error('Admin update item error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update item' }, { status: 500 })
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
    const item = await MenuItem.findByIdAndDelete(id)
    if (!item) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, message: 'Item deleted' })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to delete item' }, { status: 500 })
  }
}
