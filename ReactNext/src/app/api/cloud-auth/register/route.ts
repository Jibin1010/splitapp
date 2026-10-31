import { NextResponse } from 'next/server'
import { registerLocalUser, createCloudSession } from '@/lib/supabase/db'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { username, email, password, displayName } = body

    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Username, email, and password are required.' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters.' },
        { status: 400 }
      )
    }

    const user = await registerLocalUser({
      username,
      email,
      password,
      displayName,
    })

    const forwarded = request.headers.get('x-forwarded-for')
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1'
    const userAgent = request.headers.get('user-agent') || ''

    const session = await createCloudSession(user.identityId, clientIp, userAgent)

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.identityId,
          username: user.username,
          email: user.email,
          name: user.displayName,
        },
        sessionToken: session.sessionToken,
      },
      { status: 201 }
    )

    // Set secure HTTP-only cloud session cookie
    response.cookies.set('cloud_session', session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    })

    return response
  } catch (error: any) {
    const msg = error?.message || 'Registration failed'
    const status = msg.includes('already taken') || msg.includes('already registered') ? 409 : 500
    return NextResponse.json({ success: false, error: msg }, { status })
  }
}
