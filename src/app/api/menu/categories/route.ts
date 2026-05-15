import { NextResponse } from 'next/server'
import { getCategories } from '@/services/menuService'

export const revalidate = 0 // Always fresh

export async function GET() {
  try {
    const categories = await getCategories()
    return NextResponse.json({ success: true, data: { categories } })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}
