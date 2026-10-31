import { NextResponse } from 'next/server'
import { phoneVerification } from '@/lib/phone-verification/service'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ success: false, error: 'Challenge ID is required' }, { status: 400 })
    }

    const result = await phoneVerification.checkStatus(id)
    if (result.status === 'NOT_FOUND') {
      return NextResponse.json({ success: false, status: 'not_found', error: 'Challenge not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      challengeId: id,
      status: result.status.toLowerCase(), // 'pending' | 'verified' | 'expired' | 'cancelled'
      phoneNumber: result.phoneNumber,
      verifiedAt: result.verifiedAt,
      expiresAt: result.expiresAt,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

