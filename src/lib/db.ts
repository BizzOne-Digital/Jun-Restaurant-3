import mongoose from 'mongoose'

// ============================================================
// MongoDB connection singleton
// Reuses existing connection in development (hot reload safe)
// ============================================================

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable in .env.local'
  )
}

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

// Use global to persist connection across hot reloads in development
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null }
global.mongooseCache = cached

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    }

    cached.promise = mongoose.connect(MONGODB_URI!, opts)
  }

  try {
    cached.conn = await cached.promise
  } catch (error) {
    cached.promise = null
    throw error
  }

  return cached.conn
}
