import type { Bill, CalculateResponse, CalculationResult, ValidationIssue } from '@/types/split'

/** Error thrown when /api/calculate rejects or cannot be reached. */
export class ApiError extends Error {
  code: string
  issues: ValidationIssue[]

  constructor(message: string, code = 'CALCULATION_ERROR', issues: ValidationIssue[] = []) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.issues = issues
  }
}

/**
 * Send the bill to the backend calculation endpoint.
 * The server owns the official result; the UI never decides amounts itself.
 */
export async function calculateBillViaApi(bill: Bill): Promise<CalculationResult> {
  let response: Response
  try {
    response = await fetch('/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bill }),
    })
  } catch {
    throw new ApiError(
      'Could not reach the calculation service. Check your connection and try again — your bill is safe and nothing was lost.',
      'NETWORK_ERROR',
    )
  }

  let data: CalculateResponse | null = null
  try {
    data = (await response.json()) as CalculateResponse
  } catch {
    throw new ApiError('The calculation service returned an unreadable response.', 'INVALID_RESPONSE')
  }

  if (!response.ok || !data || data.ok !== true) {
    const failure = data && data.ok === false ? data.error : null
    throw new ApiError(
      failure?.message ?? 'The bill could not be calculated.',
      failure?.code ?? 'CALCULATION_ERROR',
      failure?.issues ?? [],
    )
  }
  return data.result
}
