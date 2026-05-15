import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import { getSessionUser } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
  }
  try {
    await connectDB()
    const { id } = await params
    const body = await request.json()
    const allowed = ['role', 'isBlocked']
    const update: Record<string, unknown> = {}
    for (const f of allowed) if (f in body) update[f] = body[f]

    const user = await User.findByIdAndUpdate(id, { $set: update }, { new: true }).lean()
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })

    return NextResponse.json({
      success: true,
      data: {
        user: {
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          isBlocked: (user as { isBlocked?: boolean }).isBlocked ?? false,
        },
      },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 })
  }
}
