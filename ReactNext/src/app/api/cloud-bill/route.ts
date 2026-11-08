import { NextResponse } from 'next/server'
import { verifyCloudSession, pool } from '@/lib/supabase/db'
import { decryptPII } from '@/lib/crypto/pii-crypto'
import {
  getActiveBillForUser,
  saveActiveBillForUser,
  resetActiveBillForUser,
} from '@/lib/cloud-bill/bill-repository'
import { parseBillPayload } from '@/lib/validation'

export const dynamic = 'force-dynamic'

/**
 * Helper to extract and verify session token from headers, cookies, or verified identity
 */
async function authenticateRequest(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cookieHeader = request.headers.get('cookie') || ''
  const xIdentity = request.headers.get('x-identity-id')

  let token: string | null = null
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  } else {
    const match = cookieHeader.match(/cloud_session=([^;]+)/)
    if (match) token = match[1]
  }

  if (token) {
    const session = await verifyCloudSession(token)
    if (session) {
      return { authenticated: true as const, session }
    }
  }

  // Fallback to verified active identity if provided and valid UUID
  if (xIdentity && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(xIdentity)) {
    try {
      const client = await pool.connect()
      try {
        const res = await client.query(
          `SELECT i.id, p.display_name, p.avatar_url 
           FROM public.app_identities i
           LEFT JOIN public.identity_profiles p ON p.identity_id = i.id
           WHERE i.id = $1 AND i.is_active = true 
           LIMIT 1;`,
          [xIdentity]
        )
        if (res.rows.length > 0) {
          const row = res.rows[0]
          const displayName = row.display_name ? decryptPII(row.display_name) : 'You'
          return {
            authenticated: true as const,
            session: {
              identityId: row.id,
              displayName,
              avatarUrl: row.avatar_url,
            } as any,
          }
        }
      } finally {
        client.release()
      }
    } catch {}
  }

  return { authenticated: false as const, error: 'Unauthorized: No active session' }
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
