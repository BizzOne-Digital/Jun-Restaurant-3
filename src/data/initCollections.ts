/**
 * Creates all collections with proper indexes.
 * Safe to run multiple times — uses createIndex which is idempotent.
 * Run with: npx tsx src/data/initCollections.ts
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) { console.error('❌ MONGODB_URI not set'); process.exit(1) }

async function run() {
  console.log('🔌  Connecting…')
  await mongoose.connect(MONGODB_URI as string)
  const db = mongoose.connection.db!

  // ── users ──────────────────────────────────────────────
  await db.createCollection('users').catch(() => {/* already exists */})
  await db.collection('users').createIndex({ email: 1 }, { unique: true })
  console.log('✅  users — email index')

  // ── menucategories ─────────────────────────────────────
  await db.createCollection('menucategories').catch(() => {})
  await db.collection('menucategories').createIndex({ slug: 1 }, { unique: true })
  await db.collection('menucategories').createIndex({ displayOrder: 1, isActive: 1 })
  console.log('✅  menucategories — slug + displayOrder indexes')

  // ── menuitems ──────────────────────────────────────────
  await db.createCollection('menuitems').catch(() => {})
  await db.collection('menuitems').createIndex({ slug: 1 }, { unique: true })
  await db.collection('menuitems').createIndex({ categoryId: 1, isAvailable: 1 })
  await db.collection('menuitems').createIndex({ orderedCount: -1 })
  await db.collection('menuitems').createIndex({ discountActive: 1 })
  console.log('✅  menuitems — slug, category, orderedCount, discount indexes')

  // ── orders ─────────────────────────────────────────────
  await db.createCollection('orders').catch(() => {})
  await db.collection('orders').createIndex({ orderNumber: 1 }, { unique: true })
  await db.collection('orders').createIndex({ userId: 1, createdAt: -1 })
  await db.collection('orders').createIndex({ status: 1, createdAt: -1 })
  await db.collection('orders').createIndex({ createdAt: -1 })
  console.log('✅  orders — orderNumber, userId, status, createdAt indexes')

  // ── summary ────────────────────────────────────────────
  console.log('\n📊  Collection summary:')
  for (const col of ['users', 'menucategories', 'menuitems', 'orders']) {
    const count = await db.collection(col).countDocuments()
    console.log(`   ${col.padEnd(18)} ${count} documents`)
  }

  console.log('\n🎉  Database fully initialised!')
  await mongoose.disconnect()
}

run().catch((err) => {
  console.error('❌  Error:', err.message)
  process.exit(1)
})
