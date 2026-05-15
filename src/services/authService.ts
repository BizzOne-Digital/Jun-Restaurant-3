import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import type { SessionUser } from '@/types'

// ============================================================
// Auth service — user creation and validation
// ============================================================

const BCRYPT_SALT_ROUNDS = 12

/**
 * Create a new user account.
 * Throws if email already exists.
 */
export async function createUser(
  name: string,
  email: string,
  password: string
): Promise<SessionUser> {
  await connectDB()

  const existing = await User.findOne({ email: email.toLowerCase() }).lean()
  if (existing) {
    throw new Error('An account with this email already exists')
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS)

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    role: 'customer',
  })

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  }
}

/**
 * Validate login credentials.
 * Returns the session user if valid, throws otherwise.
 */
export async function validateCredentials(
  email: string,
  password: string
): Promise<SessionUser> {
  await connectDB()

  // Fetch user including passwordHash (excluded from toJSON by default)
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    '+passwordHash'
  )

  if (!user) {
    // Use a generic message to avoid user enumeration
    throw new Error('Invalid email or password')
  }

  const isValid = await bcrypt.compare(password, user.passwordHash)
  if (!isValid) {
    throw new Error('Invalid email or password')
  }

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  }
}

/**
 * Find a user by ID (for session refresh).
 */
export async function findUserById(id: string): Promise<SessionUser | null> {
  await connectDB()

  const user = await User.findById(id).lean()
  if (!user) return null

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  }
}
