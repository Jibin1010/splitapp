import { NextResponse } from 'next/server'
import { phoneVerification } from '@/lib/phone-verification/service'
import { verifyCloudSession } from '@/lib/supabase/db'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const rawPhone = typeof body?.phone === 'string' ? body.phone : ''

    if (!rawPhone) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required.' },
        { status: 400 }
      )
    }

    // Extract client IP from headers
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : realIp || '127.0.0.1'

    // Automatically associate challenge with authenticated cloud user if logged in
    let userId = body?.userId
    if (!userId) {
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
        const session = await verifyCloudSession(token)
        if (session?.identityId) {
          userId = session.identityId
        }
      }
    }

    const result = await phoneVerification.createChallenge({
      rawPhone,
      channel: body?.channel === 'whatsapp' ? 'whatsapp' : 'telegram',
      clientIp,
      defaultCountryCode: body?.countryCode || '91',
      userId,
    })

    if (!result.success) {
      const status = result.rateLimitResetMs ? 429 : 400
      return NextResponse.json(result, { status })
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

