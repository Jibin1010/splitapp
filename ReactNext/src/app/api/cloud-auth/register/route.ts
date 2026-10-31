import { NextResponse } from 'next/server'
import {
  registerLocalUser,
  loginLocalUser,
  createCloudSession,
  verifyCloudSession,
  getUnifiedIdentity,
} from '@/lib/supabase/db'

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

    // Check if user is already connected (active session)
    let currentIdentityId: string | undefined = body?.currentIdentityId
    if (!currentIdentityId) {
      const authHeader = request.headers.get('authorization')
      const cookieHeader = request.headers.get('cookie') || ''
      let token: string | null = null
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      } else {
        const match = cookieHeader.match(/cloud_session=([^;]+)/)
        if (match) token = match[1]
      }
      if (token) {
        const active = await verifyCloudSession(token)
        if (active?.identityId) {
          currentIdentityId = active.identityId
        }
      }
    }

    // AUTOMATIC SEAMLESS AUTH:
    // If an account already exists with this email or username, check password:
    // If password matches, automatically log them in instead of rejecting!
    const existingCheck = await loginLocalUser(email, password)
    if (existingCheck.success && existingCheck.identity) {
      const forwarded = request.headers.get('x-forwarded-for')
      const clientIp = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1'
      const userAgent = request.headers.get('user-agent') || ''

      const session = await createCloudSession(existingCheck.identity.id, clientIp, userAgent)
      const unified = await getUnifiedIdentity(existingCheck.identity.id)

      const response = NextResponse.json(
        {
          success: true,
          user: {
            id: existingCheck.identity.id,
            username: existingCheck.identity.username,
            email: existingCheck.identity.email,
            name: existingCheck.identity.displayName,
          },
          unified,
          sessionToken: session.sessionToken,
          alreadyExisted: true,
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
    }

    const user = await registerLocalUser({
      username,
      email,
      password,
      displayName,
      targetIdentityId: currentIdentityId,
    })

    const forwarded = request.headers.get('x-forwarded-for')
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1'
    const userAgent = request.headers.get('user-agent') || ''

    const session = await createCloudSession(user.identityId, clientIp, userAgent)
    const unified = await getUnifiedIdentity(user.identityId)

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.identityId,
          username: user.username,
          email: user.email,
          name: user.displayName,
          isNewUser: user.isNewUser,
          isLinked: user.isLinked,
        },
        unified,
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

