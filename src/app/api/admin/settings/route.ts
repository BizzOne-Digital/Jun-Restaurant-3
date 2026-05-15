import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Settings from '@/models/Settings'
import { getSessionUser } from '@/lib/auth'

async function requireAdmin() {
  const user = await getSessionUser()
  if (!user || user.role !== 'admin') return null
  return user
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
  try {
    await connectDB()
    let settings = await Settings.findOne({}).lean()
    if (!settings) {
      // Create default settings on first access
      const created = await Settings.create({})
      settings = created.toObject()
    }
    return NextResponse.json({ success: true, data: { settings: { ...settings, _id: settings._id.toString() } } })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
  try {
    await connectDB()
    const body = await request.json()
    const allowed = ['restaurantName', 'address', 'phone', 'email', 'openingHours', 'pickupPrepTime', 'deliveryEnabled']
    const update: Record<string, unknown> = {}
    for (const f of allowed) if (f in body) update[f] = body[f]

    const settings = await Settings.findOneAndUpdate({}, { $set: update }, { new: true, upsert: true }).lean()
    return NextResponse.json({ success: true, data: { settings: { ...settings, _id: settings!._id.toString() } } })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to save settings' }, { status: 500 })
  }
}
