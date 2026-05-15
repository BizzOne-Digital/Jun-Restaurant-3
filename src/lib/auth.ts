import { getIronSession, IronSession } from 'iron-session'
import { cookies } from 'next/headers'
import type { SessionUser } from '@/types'

// ============================================================
// iron-session configuration and helpers
// ============================================================

export interface SessionData {
  user?: SessionUser
}

const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET as string,
  cookieName: 'mascot-chinese-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
}

if (!process.env.SESSION_SECRET) {
  throw new Error(
    'Please define the SESSION_SECRET environment variable in .env.local (minimum 32 characters)'
  )
}

/**
 * Get the current iron-session from the request cookies.
 * Use in API route handlers.
 */
export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, SESSION_OPTIONS)
}

/**
 * Get the authenticated user from the session.
 * Returns null if not authenticated.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getSession()
  return session.user ?? null
}

/**
 * Require authentication — returns user or throws a 401 response.
 * Use in API routes that require auth.
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) {
    throw new Response(
      JSON.stringify({ success: false, error: 'Authentication required' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }
  return user
}
