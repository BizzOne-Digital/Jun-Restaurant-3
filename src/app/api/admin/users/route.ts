import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import { getSessionUser } from '@/lib/auth'

export async function GET() {
  const user = await getSessionUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
  }
  try {
    await connectDB()
    const users = await User.find({ role: { $ne: 'admin' } }).sort({ createdAt: -1 }).lean()
    return NextResponse.json({
      success: true,
      data: {
        users: users.map((u) => ({
          _id: u._id.toString(),
          name: u.name,
          email: u.email,
          role: u.role,
          isBlocked: (u as { isBlocked?: boolean }).isBlocked ?? false,
          createdAt: u.createdAt.toISOString(),
        })),
      },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 })
  }
}
