// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { POST } from '@/app/api/calculate/route'
import { calculateBill } from '@/lib/calculations'
import { createSampleBill } from '@/lib/seed'

function post(json: unknown) {
  const request = new Request('http://localhost:3000/api/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof json === 'string' ? json : JSON.stringify(json),
  })
  return POST(request)
}

describe('POST /api/calculate', () => {
  it('returns a full, valid result for a complete bill', async () => {
    const bill = createSampleBill()
    const response = await post({ bill })
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.ok).toBe(true)
    expect(body.result.valid).toBe(true)
    expect(body.result.billTotal).toBe(246000)
    expect(body.result.settlements.length).toBeGreaterThan(0)

    // The API result must match the shared engine exactly.
    expect(body.result).toEqual(calculateBill(bill))
  })

  it('rejects an incomplete bill with structured validation issues', async () => {
    const bill = createSampleBill()
    bill.items[0].allocation = { mode: 'equal', participantIds: [] } // unassign pizza
    bill.people = bill.people.map((p) => ({ ...p, paidAmount: 0 })) // and clear payers
    const response = await post({ bill })
    expect(response.status).toBe(400)

    const body = await response.json()
    expect(body.ok).toBe(false)
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(body.error.issues).toContainEqual(expect.objectContaining({ code: 'ITEM_UNASSIGNED' }))
    expect(body.error.issues).toContainEqual(expect.objectContaining({ code: 'PAID_TOTAL_MISMATCH' }))
  })

  it('rejects structurally invalid payloads (Zod)', async () => {
    const response = await post({ bill: { id: 'x', items: 'nope' } })
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.ok).toBe(false)
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(Array.isArray(body.error.issues)).toBe(true)
  })

  it('rejects malformed JSON bodies', async () => {
    const response = await post('{ not json')
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.ok).toBe(false)
    expect(body.error.code).toBe('INVALID_JSON')
  })

  it('rejects negative unit prices at the schema boundary', async () => {
    const bill = createSampleBill()
    ;(bill.items[0] as { unitPrice: number }).unitPrice = -45000
    const response = await post({ bill })
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })
})
