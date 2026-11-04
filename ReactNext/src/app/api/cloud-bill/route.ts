import { NextResponse } from 'next/server'
import { verifyCloudSession } from '@/lib/supabase/db'
import {
  getActiveBillForUser,
  saveActiveBillForUser,
  resetActiveBillForUser,
} from '@/lib/cloud-bill/bill-repository'
import { parseBillPayload } from '@/lib/validation'

export const dynamic = 'force-dynamic'

/**
 * Helper to extract and verify session token from headers or cookies
 */
async function authenticateRequest(request: Request) {
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
    return { authenticated: false as const, error: 'Unauthorized: No active session' }
  }

  const session = await verifyCloudSession(token)
  if (!session) {
    return { authenticated: false as const, error: 'Unauthorized: Session invalid or expired' }
  }

  return { authenticated: true as const, session }
}

/**
 * GET /api/cloud-bill
 * Retrieves the authenticated user's isolated bill from the backend server.
 * Multi-tenant: User only receives bills they own or belong to.
 */
export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request)
    if (!auth.authenticated) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: 401 })
    }

    const bill = await getActiveBillForUser(auth.session.identityId, {
      name: auth.session.displayName || 'You',
      avatarUrl: auth.session.avatarUrl,
    })

    return NextResponse.json({
      ok: true,
      success: true,
      identityId: auth.session.identityId,
      bill,
    })
  } catch (error: any) {
    console.error('GET /api/cloud-bill error:', error)
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to fetch bill' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/cloud-bill
 * Saves/syncs the bill to the backend server with authoritative calculation.
 * Strictly verifies ownership so other users cannot see or overwrite this data.
 */
export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request)
    if (!auth.authenticated) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const payload = body.bill ? body : { bill: body }

    // Validate bill schema constraints
    const parsed = parseBillPayload(payload)
    if (!parsed.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Submitted bill violates split schema constraints.',
            issues: parsed.issues,
          },
        },
        { status: 400 }
      )
    }

    const result = await saveActiveBillForUser(auth.session.identityId, parsed.bill)
    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error || 'Permission denied' },
        { status: result.status || 403 }
      )
    }

    return NextResponse.json({
      ok: true,
      success: true,
      identityId: auth.session.identityId,
      bill: result.bill,
      result: result.result,
    })
  } catch (error: any) {
    console.error('POST /api/cloud-bill error:', error)
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to save bill' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/cloud-bill
 * Clears the active bill and resets to an isolated clean bill.
 */
export async function DELETE(request: Request) {
  try {
    const auth = await authenticateRequest(request)
    if (!auth.authenticated) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: 401 })
    }

    const bill = await resetActiveBillForUser(auth.session.identityId, {
      name: auth.session.displayName || 'You',
      avatarUrl: auth.session.avatarUrl,
    })

    return NextResponse.json({
      ok: true,
      success: true,
      identityId: auth.session.identityId,
      bill,
    })
  } catch (error: any) {
    console.error('DELETE /api/cloud-bill error:', error)
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to reset bill' },
      { status: 500 }
    )
  }
}
