import { NextResponse } from 'next/server'
import { verifyCloudSession, linkPhoneIdentity, getUnifiedIdentity } from '@/lib/supabase/db'

export async function POST(request: Request) {
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
        { success: false, error: 'Unauthorized: active session required' },
        { status: 401 }
      )
    }

    const session = await verifyCloudSession(token)
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const phone = typeof body?.phone === 'string' ? body.phone.trim() : ''

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      )
    }

    const linked = await linkPhoneIdentity({
      phone,
      targetIdentityId: session.identityId,
    })

    const unified = await getUnifiedIdentity(session.identityId)

    return NextResponse.json({
      success: true,
      linked,
      unified,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to link phone' },
      { status: 500 }
    )
  }
}

