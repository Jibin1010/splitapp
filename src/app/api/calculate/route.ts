import { NextResponse } from 'next/server'
import type { Bill } from '@/types/split'
import { calculateBill } from '@/lib/calculations'
import { parseBillPayload, calculateSuccessSchema, zodIssuesToValidationIssues } from '@/lib/validation'
import { z } from 'zod'

export const runtime = 'nodejs'

/**
 * POST /api/calculate
 *
 * The official calculation endpoint. The browser sends the full bill as JSON;
 * this route validates it, runs the shared calculation engine and returns
 * per-item allocations, per-person totals, net balances and settlement
 * transfers. Invalid or incomplete bills receive a 400 with structured,
 * actionable validation issues — never a silently wrong settlement.
 */
export async function POST(request: Request): Promise<Response> {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json(
      {
        ok: false as const,
        error: {
          code: 'INVALID_JSON' as const,
          message: 'The request body is not valid JSON.',
        },
      },
      { status: 400 },
    )
  }

  const parsed = parseBillPayload(payload)
  if (!parsed.ok) {
    const zodError = new z.ZodError([])
    const issues = parsed.issues.length > 0 ? parsed.issues : zodIssuesToValidationIssues(zodError)
    return NextResponse.json(
      {
        ok: false as const,
        error: {
          code: 'VALIDATION_ERROR' as const,
          message: 'The request payload is not a valid bill.',
          issues,
        },
      },
      { status: 400 },
    )
  }

  const bill = parsed.bill as unknown as Bill
  const result = calculateBill(bill)

  if (!result.valid) {
    return NextResponse.json(
      {
        ok: false as const,
        error: {
          code: 'VALIDATION_ERROR' as const,
          message: 'The bill cannot be finalized yet. Fix the issues below and calculate again.',
          issues: result.issues,
        },
      },
      { status: 400 },
    )
  }

  // Shape-check the outgoing result so the response contract is guaranteed.
  const response = { ok: true as const, result }
  const checked = calculateSuccessSchema.safeParse(response)
  if (!checked.success) {
    return NextResponse.json(
      {
        ok: false as const,
        error: {
          code: 'INTERNAL_ERROR' as const,
          message: 'The calculation result failed its own response validation.',
          issues: zodIssuesToValidationIssues(checked.error),
        },
      },
      { status: 500 },
    )
  }

  return NextResponse.json(response)
}
