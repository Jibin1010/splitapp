import { NextResponse } from 'next/server'
import {
  verifyCloudSession,
  linkPhoneIdentity,
  unlinkPhoneIdentity,
  getUnifiedIdentity,
} from '@/lib/supabase/db'
import { VerificationRepository } from '@/lib/phone-verification/repository'

function extractToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization')
  const cookieHeader = request.headers.get('cookie') || ''

  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  const match = cookieHeader.match(/cloud_session=([^;]+)/)
  return match ? match[1] : null
}

/**
 * POST: Links a verified phone number to the active cloud identity.
 * Rejects if phone is already attached to another account or if account already has a number.
 */
export async function POST(request: Request) {
  try {
    const token = extractToken(request)
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

    // Also update in-memory repository
    await VerificationRepository.attachPhone(phone, session.identityId, {
      email: session.email || '',
      provider: session.email ? 'google' : 'email',
    })

    const unified = await getUnifiedIdentity(session.identityId)

    return NextResponse.json({
      success: true,
      linked,
      unified,
    })
  } catch (error: any) {
    const msg = error?.message || 'Failed to link phone'
    const isConflict = msg.includes('already attached') || msg.includes('already has phone')
    return NextResponse.json(
      { success: false, error: msg },
      { status: isConflict ? 409 : 500 }
    )
  }
}

/**
 * DELETE: Unlinks/removes the attached phone number from the user's account.
 * Frees up the number so it can be connected again.
 */
export async function DELETE(request: Request) {
  try {
    const token = extractToken(request)
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

    // 1. Unlink in Supabase database
    const unlinkedDb = await unlinkPhoneIdentity(session.identityId)

    // 2. Unlink in memory repository
    const unlinkedMem = await VerificationRepository.unlinkPhone(session.identityId)

    const unlinkedPhone = unlinkedDb.unlinkedPhone || unlinkedMem || null
    const unified = await getUnifiedIdentity(session.identityId)

    return NextResponse.json({
      success: true,
      unlinkedPhone,
      message: unlinkedPhone
        ? `Phone number ${unlinkedPhone} was removed from your account.`
        : 'No phone number was attached.',
      unified,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to unlink phone number' },
      { status: 500 }
    )
  }
}
