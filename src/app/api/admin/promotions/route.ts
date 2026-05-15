import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Promotion from '@/models/Promotion'
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
    const promos = await Promotion.find({}).sort({ createdAt: -1 }).lean()
    return NextResponse.json({
      success: true,
      data: {
        promotions: promos.map((p) => ({
          _id: p._id.toString(),
          code: p.code,
          type: p.type,
          value: p.value,
          expiresAt: p.expiresAt ? p.expiresAt.toISOString() : null,
          maxUses: p.maxUses,
          usedCount: p.usedCount,
          isActive: p.isActive,
          createdAt: p.createdAt.toISOString(),
        })),
      },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch promotions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
  try {
    await connectDB()
    const body = await request.json()
    const { code, type, value, expiresAt, maxUses } = body
    if (!code || !type || value == null) {
      return NextResponse.json({ success: false, error: 'code, type, and value are required' }, { status: 400 })
    }
    const promo = await Promotion.create({
      code: String(code).toUpperCase().trim(),
      type,
      value: Number(value),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      maxUses: Number(maxUses ?? 0),
    })
    return NextResponse.json({
      success: true,
      data: {
        promotion: {
          _id: promo._id.toString(),
          code: promo.code,
          type: promo.type,
          value: promo.value,
          expiresAt: promo.expiresAt ? promo.expiresAt.toISOString() : null,
          maxUses: promo.maxUses,
          usedCount: promo.usedCount,
          isActive: promo.isActive,
        },
      },
    }, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('duplicate') || msg.includes('E11000')) {
      return NextResponse.json({ success: false, error: 'Promotion code already exists' }, { status: 409 })
    }
    return NextResponse.json({ success: false, error: 'Failed to create promotion' }, { status: 500 })
  }
}
