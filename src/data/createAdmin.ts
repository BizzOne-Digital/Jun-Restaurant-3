/**
 * Creates an admin user in the database.
 * Run with: npx tsx src/data/createAdmin.ts
 *
 * Change ADMIN_EMAIL / ADMIN_PASSWORD below before running,
 * or pass them as env vars:
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=secret123 npx tsx src/data/createAdmin.ts
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('❌  MONGODB_URI not set in .env.local')
  process.exit(1)
}

// ── Configurable credentials ──────────────────────────────
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    ?? 'admin@mascotchinese.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Admin@1234'
const ADMIN_NAME     = process.env.ADMIN_NAME     ?? 'Admin'
// ─────────────────────────────────────────────────────────

const UserSchema = new mongoose.Schema(
  {
    name:         { type: String, required: true },
    email:        { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role:         { type: String, enum: ['customer', 'admin'], default: 'customer' },
    addresses:    { type: Array, default: [] },
  },
  { timestamps: true }
)

const User = mongoose.models['User'] || mongoose.model('User', UserSchema)

async function run() {
  console.log('🔌  Connecting to MongoDB…')
  await mongoose.connect(MONGODB_URI as string)
  console.log('✅  Connected to:', MONGODB_URI)

  // Check if admin already exists
  const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() })
  if (existing) {
    if (existing.role === 'admin') {
      console.log(`ℹ️   Admin already exists: ${ADMIN_EMAIL}`)
    } else {
      // Upgrade existing customer to admin
      await User.updateOne({ email: ADMIN_EMAIL.toLowerCase() }, { $set: { role: 'admin' } })
      console.log(`✅  Upgraded ${ADMIN_EMAIL} to admin role`)
    }
    await mongoose.disconnect()
    return
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)

  await User.create({
    name:  ADMIN_NAME,
    email: ADMIN_EMAIL.toLowerCase(),
    passwordHash,
    role:  'admin',
  })

  console.log('✅  Admin user created!')
  console.log(`    Email:    ${ADMIN_EMAIL}`)
  console.log(`    Password: ${ADMIN_PASSWORD}`)
  console.log(`    Role:     admin`)
  console.log('')
  console.log('🔐  Login at: http://localhost:3000/auth/login')
  console.log('🏮  Admin panel: http://localhost:3000/admin')

  await mongoose.disconnect()
}

run().catch((err) => {
  console.error('❌  Failed:', err)
  process.exit(1)
})
