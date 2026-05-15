import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function POST() {
  try {
    const session = await getSession()
    session.destroy()

    return NextResponse.json({ success: true, message: 'Logged out successfully' })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    )
  }
}
