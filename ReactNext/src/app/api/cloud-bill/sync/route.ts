import { NextResponse } from 'next/server'
import { calculateBill } from '@/lib/calculations'
import { parseBillPayload } from '@/lib/validation'

export const runtime = 'edge'

/**
 * Cloud Edge Function for Authoritative Bill Splitting.
 * Destructive & complex mathematical computation runs exclusively in the cloud;
 * the client never calculates its own settlements or allocations.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))

    // 1. Cloud-side schema validation
    const parsed = parseBillPayload(body)
    if (!parsed.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'The submitted bill violates split schema constraints.',
            issues: parsed.issues,
          },
        },
        { status: 400 }
      )
    }

    // 2. Authoritative Cloud Calculation (Exact integer arithmetic & min-cash-flow graph)
    const result = calculateBill(parsed.bill)

    // Return the cloud-certified calculation result
    return NextResponse.json(
      {
        ok: true,
        computedIn: 'cloud-edge',
        timestamp: new Date().toISOString(),
        result,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'X-Computed-By': 'SplitApp-Cloud-Edge',
        },
      }
    )
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'CLOUD_EXECUTION_ERROR',
          message: error?.message || 'Cloud calculation failed',
        },
      },
      { status: 500 }
    )
  }
}
