/**
 * Standalone seed runner — called via `npm run seed`
 * Connects directly to MongoDB and seeds categories + items.
 *
 * Usage:
 *   npm run seed
 *
 * Requires MONGODB_URI in .env.local
 */

// Load .env.local before anything else
import { config } from 'dotenv'
config({ path: '.env.local' })

import mongoose from 'mongoose'
import { seedCategories, seedMenuItems } from './seed'

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not set in .env.local')
  process.exit(1)
}

// Inline minimal schemas to avoid Next.js module resolution in Node context
const categorySchema = new mongoose.Schema(
  {
    name: String,
    slug: { type: String, unique: true },
    displayOrder: Number,
    isActive: Boolean,
  },
  { timestamps: true }
)

const menuItemSchema = new mongoose.Schema(
  {
    categoryId: mongoose.Schema.Types.ObjectId,
    name: String,
    slug: { type: String, unique: true },
    description: String,
    price: Number,
    currency: { type: String, default: 'AUD' },
    imageUrl: String,
    isAvailable: Boolean,
    orderedCount: { type: Number, default: 0 },
    tags: [String],
    discountActive: { type: Boolean, default: false },
    discountPercentage: { type: Number, default: null },
    discountPrice: { type: Number, default: null },
    isPopularOverride: { type: Boolean, default: null },
  },
  { timestamps: true }
)

const MenuCategory =
  mongoose.models['MenuCategory'] ||
  mongoose.model('MenuCategory', categorySchema)
const MenuItem =
  mongoose.models['MenuItem'] || mongoose.model('MenuItem', menuItemSchema)

async function run() {
  console.log('🔌 Connecting to MongoDB...')
  await mongoose.connect(MONGODB_URI as string)
  console.log('✅ Connected')

  // Upsert categories
  const categoryResults = await Promise.all(
    seedCategories.map((cat) =>
      MenuCategory.findOneAndUpdate(
        { slug: cat.slug },
        { $set: cat },
        { upsert: true, new: true }
      )
    )
  )
  console.log(`✅ Seeded ${categoryResults.length} categories`)

  // Build slug → _id map
  const categoryMap = new Map<string, string>()
  for (const cat of categoryResults) {
    if (cat) categoryMap.set(cat.slug as string, (cat._id as mongoose.Types.ObjectId).toString())
  }

  const itemResults = await Promise.all(
    seedMenuItems.map((item) => {
      const categoryId = categoryMap.get(item.categorySlug)
      if (!categoryId) return null
      const { categorySlug: _slug, ...itemData } = item
      return MenuItem.findOneAndUpdate(
        { slug: item.slug },
        {
          $set: { ...itemData, categoryId },
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

  const seeded = itemResults.filter(Boolean).length
  console.log(`✅ Seeded ${seeded} menu items`)

  await mongoose.disconnect()
  console.log('🎉 Seed complete!')
}

run().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
