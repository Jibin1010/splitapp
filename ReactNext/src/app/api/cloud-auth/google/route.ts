import { NextResponse } from 'next/server'
import { authenticateGoogleUser, createCloudSession, verifyCloudSession, getUnifiedIdentity } from '@/lib/supabase/db'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { accessToken, idToken, profile } = body

    let googleSub = profile?.sub
    let email = profile?.email
    let name = profile?.name || profile?.given_name
    let picture = profile?.picture

    // Check if user is already logged in to link account to active identity
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

    // If an access token is provided, verify it directly against Google API in the cloud
    if (accessToken && (!googleSub || !email)) {
      const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!googleRes.ok) {
        return NextResponse.json(
          { success: false, error: 'Failed to verify Google access token' },
          { status: 401 }
        )
      }

      const googleData = await googleRes.json()
      googleSub = googleData.sub
      email = googleData.email
      name = googleData.name || googleData.given_name
      picture = googleData.picture
    }

    if (!googleSub || !email) {
      return NextResponse.json(
        { success: false, error: 'Google authentication details incomplete' },
        { status: 400 }
      )
    }

    // Upsert into Supabase 5NF database (auto-links if active session or matching verified email exists)
    const user = await authenticateGoogleUser({
      googleSub,
      email,
      name,
      avatarUrl: picture,
      rawProfile: profile || { sub: googleSub, email, name, picture },
      currentIdentityId,
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
          name: user.displayName,
          email: user.email,
          avatarUrl: user.avatarUrl,
          isNewUser: user.isNewUser,
          isLinked: user.isLinked,
        },
        unified,
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
      { success: false, error: error?.message || 'Google authentication failed' },
      { status: 500 }
    )
  }
}

