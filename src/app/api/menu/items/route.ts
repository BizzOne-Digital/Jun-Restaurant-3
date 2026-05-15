import { NextRequest, NextResponse } from 'next/server'
import { getMenuItems, getMenuGrouped, getDiscountedItems } from '@/services/menuService'

export const revalidate = 0 // Always fresh — discounts and popular status change in real-time

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId') ?? undefined
    const grouped = searchParams.get('grouped') === 'true'
    const discounted = searchParams.get('discounted') === 'true'

    if (discounted) {
      const discountedItems = await getDiscountedItems()
      return NextResponse.json({ success: true, data: { discountedItems } })
    }

    if (grouped) {
      const menuGroups = await getMenuGrouped()
      return NextResponse.json({ success: true, data: { menuGroups } })
    }

    const items = await getMenuItems(categoryId)
    return NextResponse.json({ success: true, data: { items } })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch menu items' },
      { status: 500 }
    )
  }
}
