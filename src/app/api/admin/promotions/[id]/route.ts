import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Promotion from '@/models/Promotion'
import { getSessionUser } from '@/lib/auth'

async function requireAdmin() {
  const user = await getSessionUser()
  if (!user || user.role !== 'admin') return null
  return user
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await requireAdmin()) return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
  try {
    await connectDB()
    const { id } = await params
    await Promotion.findByIdAndDelete(id)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to delete' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await requireAdmin()) return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
  try {
    await connectDB()
    const { id } = await params
    const body = await request.json()
    const allowed = ['isActive', 'value', 'maxUses', 'expiresAt']
    const update: Record<string, unknown> = {}
    for (const f of allowed) if (f in body) update[f] = body[f]
    const promo = await Promotion.findByIdAndUpdate(id, { $set: update }, { new: true }).lean()
    if (!promo) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: { promotion: { ...promo, _id: promo._id.toString() } } })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to update' }, { status: 500 })
  }
}
