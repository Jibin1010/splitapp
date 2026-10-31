import { NextResponse } from 'next/server'
import { loginLocalUser, createCloudSession } from '@/lib/supabase/db'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { identifier, password } = body

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: 'Username/Email and password are required.' },
        { status: 400 }
      )
    }

    const result = await loginLocalUser(identifier, password)
    if (!result.success || !result.identity) {
      return NextResponse.json(
        { success: false, error: result.error || 'Invalid credentials' },
        { status: 401 }
      )
    }

    const forwarded = request.headers.get('x-forwarded-for')
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1'
    const userAgent = request.headers.get('user-agent') || ''

    const session = await createCloudSession(result.identity.id, clientIp, userAgent)

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: result.identity.id,
          username: result.identity.username,
          email: result.identity.email,
          name: result.identity.displayName,
          avatarUrl: result.identity.avatarUrl,
        },
        sessionToken: session.sessionToken,
      },
      { status: 200 }
    )

    response.cookies.set('cloud_session', session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    })

    return response
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Login failed' },
      { status: 500 }
    )
  }
}

