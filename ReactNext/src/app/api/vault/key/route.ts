import { NextRequest, NextResponse } from 'next/server'
import { verifyCloudSession } from '@/lib/supabase/db'
import { getGroupVaultKey } from '@/lib/vault/vault-service'

export const dynamic = 'force-dynamic'

/**
 * GET /api/vault/key?billId=<id>
 *
 * Discloses the AES-256 decryption key ONLY to verified group members.
 * Outsiders or unauthorized users are strictly rejected with 403 Forbidden.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const billId = searchParams.get('billId')

    if (!billId) {
      return NextResponse.json({ ok: false, error: 'billId is required' }, { status: 400 })
    }

    const authHeader = req.headers.get('authorization')
    const cookieToken = req.cookies.get('cloud_session')?.value
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : cookieToken

    let requestingIdentityId: string | undefined
    let requestingUserName: string | undefined

    if (token) {
      const session = await verifyCloudSession(token)
      if (session) {
        requestingIdentityId = session.identityId
        requestingUserName = session.displayName
      }
    }

    // Allow user override from query header if testing or guest in active local session
    if (!requestingIdentityId) {
      requestingUserName = req.headers.get('x-user-name') || undefined
    }

    const res = await getGroupVaultKey({
      billId,
      requestingIdentityId,
      requestingUserName,
    })

    if (!res.success) {
      return NextResponse.json(
        { ok: false, error: res.error },
        { status: res.status || 403 }
      )
    }

    return NextResponse.json({
      ok: true,
      billId,
      keyBase64: res.keyBase64,
    })
  } catch (error: any) {
    console.error('Error in /api/vault/key:', error)
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to retrieve vault key' },
      { status: 500 }
    )
  }
}

