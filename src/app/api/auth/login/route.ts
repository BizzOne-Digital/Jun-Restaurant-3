import { NextRequest, NextResponse } from 'next/server'
import { loginSchema } from '@/validation/authSchemas'
import { validateCredentials } from '@/services/authService'
import { getSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const result = loginSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { email, password } = result.data

    // Validate credentials
    const user = await validateCredentials(email, password)

    // Set session
    const session = await getSession()
    session.user = user
    await session.save()

    return NextResponse.json({ success: true, data: { user } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed'

    // Generic auth error — don't reveal whether email exists
    if (message.includes('Invalid email or password')) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}
