import { NextResponse } from 'next/server'
import {
  loginLocalUser,
  registerLocalUser,
  createCloudSession,
  verifyCloudSession,
  getUnifiedIdentity,
} from '@/lib/supabase/db'

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

    // Check if user is already connected (active session from Google, WhatsApp, or previous session)
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

    let result = await loginLocalUser(identifier, password)

    // AUTOMATIC ACCOUNT CREATION:
    // If the user presses login without having created an account yet,
    // automatically register the account and log them in seamlessly!
    let wasAutoRegistered = false
    if (!result.success && result.error === 'User not found') {
      if (password.length < 6) {
        return NextResponse.json(
          {
            success: false,
            error: 'Account not found. To automatically create an account, password must be at least 6 characters.',
          },
          { status: 400 }
        )
      }

      const cleanId = String(identifier).trim()
      const isEmail = cleanId.includes('@')
      const email = isEmail ? cleanId : `${cleanId.replace(/[^a-zA-Z0-9_-]/g, '')}@local.splitapp.io`
      const username = isEmail ? cleanId.split('@')[0] : cleanId
      const displayName = username.charAt(0).toUpperCase() + username.slice(1)

      const newUser = await registerLocalUser({
        username,
        email,
        password,
        displayName,
        targetIdentityId: currentIdentityId,
      })

      wasAutoRegistered = true
      result = {
        success: true,
        identity: {
          id: newUser.identityId,
          username: newUser.username,
          email: newUser.email,
          displayName: newUser.displayName,
          avatarUrl: null,
        },
      }
    } else if (!result.success || !result.identity) {
      return NextResponse.json(
        { success: false, error: result.error || 'Invalid credentials' },
        { status: 401 }
      )
    }

    const forwarded = request.headers.get('x-forwarded-for')
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1'
    const userAgent = request.headers.get('user-agent') || ''

    const session = await createCloudSession(result.identity.id, clientIp, userAgent)
    const unified = await getUnifiedIdentity(result.identity.id)

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
        unified,
        sessionToken: session.sessionToken,
        autoRegistered: wasAutoRegistered,
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

