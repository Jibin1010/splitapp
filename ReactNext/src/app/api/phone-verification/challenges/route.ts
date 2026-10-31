import { NextResponse } from 'next/server'
import { phoneVerification } from '@/lib/phone-verification/service'

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

    const result = await phoneVerification.createChallenge({
      rawPhone,
      clientIp,
      defaultCountryCode: body?.countryCode || '91',
      userId: body?.userId,
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

