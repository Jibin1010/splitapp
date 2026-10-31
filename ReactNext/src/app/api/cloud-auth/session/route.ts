import { NextResponse } from 'next/server'
import { verifyCloudSession, revokeCloudSession } from '@/lib/supabase/db'

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
      return NextResponse.json({ authenticated: false }, { status: 200 })
    }

    const session = await verifyCloudSession(token)
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 200 })
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.identityId,
        name: session.displayName,
        username: session.username,
        email: session.email,
        avatarUrl: session.avatarUrl,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ authenticated: false, error: error?.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || ''
    const match = cookieHeader.match(/cloud_session=([^;]+)/)
    const token = match ? match[1] : null

    if (token) {
      await revokeCloudSession(token)
    }

    const response = NextResponse.json({ success: true, message: 'Logged out' })
    response.cookies.delete('cloud_session')
    return response
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

