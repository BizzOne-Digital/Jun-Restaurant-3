import { NextResponse } from 'next/server'
import { getPopularItems } from '@/services/menuService'

// No cache — popular items update in real-time after each order
export const revalidate = 0

export async function GET() {
  try {
    const popularItems = await getPopularItems()
    return NextResponse.json({ success: true, data: { popularItems } })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch popular items' },
      { status: 500 }
    )
  }
}
