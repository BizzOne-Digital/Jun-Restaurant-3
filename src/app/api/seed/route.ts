import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import MenuCategory from '@/models/MenuCategory'
import MenuItem from '@/models/MenuItem'
import { seedCategories, seedMenuItems } from '@/data/seed'

// ============================================================
// Seed endpoint — idempotent, dev/admin only
// Protected by SEED_API_KEY in production
// ============================================================

export async function POST(request: NextRequest) {
  // Security: only allow in development OR with valid API key
  const isDevEnv = process.env.NODE_ENV === 'development'
  const apiKey = request.headers.get('x-seed-api-key')
  const validApiKey = process.env.SEED_API_KEY

  if (!isDevEnv && (!validApiKey || apiKey !== validApiKey)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    await connectDB()

    // Upsert categories by slug (idempotent)
    const categoryResults = await Promise.all(
      seedCategories.map((cat) =>
        MenuCategory.findOneAndUpdate(
          { slug: cat.slug },
          { $set: cat },
          { upsert: true, new: true }
        )
      )
    )

    // Build slug → _id map for item insertion
    const categoryMap = new Map<string, string>()
    for (const cat of categoryResults) {
      categoryMap.set(cat.slug, cat._id.toString())
    }

    // Upsert menu items by slug (idempotent)
    const itemResults = await Promise.all(
      seedMenuItems.map((item) => {
        const categoryId = categoryMap.get(item.categorySlug)
        if (!categoryId) return null

        const { categorySlug: _slug, ...itemData } = item
        return MenuItem.findOneAndUpdate(
          { slug: item.slug },
          {
            $set: { ...itemData, categoryId },
            // Only set discount/popular fields on first insert — don't overwrite admin changes
            $setOnInsert: {
              discountActive: false,
              discountPercentage: null,
              discountPrice: null,
              isPopularOverride: null,
            },
          },
          { upsert: true, new: true }
        )
      })
    )

    const seededCount = itemResults.filter(Boolean).length

    return NextResponse.json({
      success: true,
      message: 'Seed completed',
      data: {
        categoriesSeeded: categoryResults.length,
        itemsSeeded: seededCount,
      },
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { success: false, error: 'Seed failed' },
      { status: 500 }
    )
  }
}
