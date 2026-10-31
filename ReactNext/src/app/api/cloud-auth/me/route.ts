import { NextResponse } from 'next/server'
import { verifyCloudSession, getUnifiedIdentity } from '@/lib/supabase/db'

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const cookieHeader = request.headers.get('cookie') || ''

    let token: string | null = null
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else {
      const match = cookieHeader.match(/cloud_session=([^;]+)/)
      if (match) token = match[1]
    }

    if (!token) {
      return NextResponse.json(
        { authenticated: false, error: 'No active session token' },
        { status: 401 }
      )
    }

    const session = await verifyCloudSession(token)
    if (!session) {
      return NextResponse.json(
        { authenticated: false, error: 'Session expired or invalid' },
        { status: 401 }
      )
    }

    const unified = await getUnifiedIdentity(session.identityId)

    return NextResponse.json({
      authenticated: true,
      identityId: session.identityId,
      user: {
        id: session.identityId,
        displayName: session.displayName,
        username: session.username,
        email: session.email,
        avatarUrl: session.avatarUrl,
      },
      unified,
    })
  } catch (error: any) {
    return NextResponse.json(
      { authenticated: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
