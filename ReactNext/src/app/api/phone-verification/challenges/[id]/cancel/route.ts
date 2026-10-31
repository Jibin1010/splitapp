import { NextResponse } from 'next/server'
import { phoneVerification } from '@/lib/phone-verification/service'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ success: false, error: 'Challenge ID is required' }, { status: 400 })
    }

    const cancelled = await phoneVerification.cancelChallenge(id)
    return NextResponse.json({
      success: true,
      challengeId: id,
      cancelled,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

