import { NextRequest, NextResponse } from 'next/server'
import { signupSchema } from '@/validation/authSchemas'
import { createUser } from '@/services/authService'
import { getSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const result = signupSchema.safeParse(body)
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

    const { name, email, password } = result.data

    // Create user
    const user = await createUser(name, email, password)

    // Set session
    const session = await getSession()
    session.user = user
    await session.save()

    return NextResponse.json(
      { success: true, data: { user } },
      { status: 201 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Signup failed'

    // Duplicate email — return 409
    if (message.includes('already exists')) {
      return NextResponse.json(
        { success: false, error: message },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'An error occurred during signup' },
      { status: 500 }
    )
  }
}
