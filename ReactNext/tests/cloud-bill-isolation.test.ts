import { describe, expect, it, beforeEach } from 'vitest'
import {
  getActiveBillForUser,
  saveActiveBillForUser,
  resetActiveBillForUser,
  clearBillRepositoryMemory,
} from '@/lib/cloud-bill/bill-repository'
import type { Bill } from '@/types/split'

describe('Server-Side 5NF Multi-Tenant Bill & Group Data Isolation', () => {
  const userA_id = 'user-identity-aaa-1111-2222'
  const userB_id = 'user-identity-bbb-3333-4444'

  beforeEach(() => {
    clearBillRepositoryMemory()
  })

  it('1. should create an isolated clean bill for User A with ZERO dummy people', async () => {
    const billA = await getActiveBillForUser(userA_id, { name: 'Alice Smith', avatarUrl: null })

    expect(billA).toBeDefined()
    expect(billA.name).toBe('My Group Split')
    // Must contain exactly 1 person: Alice Smith
    expect(billA.people).toHaveLength(1)
    expect(billA.people[0].name).toBe('Alice Smith')
    expect(billA.items).toHaveLength(0)
    expect(billA.adjustments).toHaveLength(0)

    // Verify NONE of the global dummy people exist
    const names = billA.people.map((p) => p.name)
    expect(names).not.toContain('Maya Sharma')
    expect(names).not.toContain('Arjun Patel')
    expect(names).not.toContain('Neha Rao')
    expect(names).not.toContain('Ravi Kumar')
  })

  it('2. should enforce data isolation: User B gets their own isolated bill and cannot see User A data', async () => {
    // Alice creates items and adds Bob to her group
    const billA = await getActiveBillForUser(userA_id, { name: 'Alice Smith' })
    billA.people.push({
      id: 'person-bob',
      name: 'Bob Jones',
      paidAmount: 0,
    })
    billA.items.push({
      id: 'item-pizza',
      name: 'Artisan Pizza',
      quantity: 1,
      unitPrice: 120000, // 1200 INR
      allocation: { mode: 'equal', participantIds: [billA.people[0].id, 'person-bob'] },
    })

    const saveResA = await saveActiveBillForUser(userA_id, billA)
    expect(saveResA.success).toBe(true)

    // User B (Charlie) fetches their bill
    const billB = await getActiveBillForUser(userB_id, { name: 'Charlie Brown' })
    expect(billB).toBeDefined()
    expect(billB.id).not.toBe(billA.id)
    expect(billB.people).toHaveLength(1)
    expect(billB.people[0].name).toBe('Charlie Brown')
    expect(billB.items).toHaveLength(0)

    // Charlie must NOT see Alice or Bob's items or people!
    const charliePeople = billB.people.map((p) => p.name)
    expect(charliePeople).not.toContain('Alice Smith')
    expect(charliePeople).not.toContain('Bob Jones')
    expect(billB.items.map((i) => i.name)).not.toContain('Artisan Pizza')
  })

  it('3. should reject User B from modifying or overwriting User A bill (403 Forbidden)', async () => {
    // Alice's bill
    const billA = await getActiveBillForUser(userA_id, { name: 'Alice' })

    // Charlie attempts to overwrite Alice's bill
    const hijackedBill: Bill = {
      ...billA,
      name: 'Hacked Bill By Charlie',
    }

    const maliciousSave = await saveActiveBillForUser(userB_id, hijackedBill)
    expect(maliciousSave.success).toBe(false)
    expect(maliciousSave.status).toBe(403)
    expect(maliciousSave.error).toContain('Forbidden')

    // Alice's bill remains intact
    const originalBillA = await getActiveBillForUser(userA_id)
    expect(originalBillA.name).toBe('My Group Split')
  })

  it('4. should reset active bill cleanly without restoring dummy people', async () => {
    const billA = await getActiveBillForUser(userA_id, { name: 'Alice Smith' })
    billA.items.push({
      id: 'item-drink',
      name: 'Coffee',
      quantity: 2,
      unitPrice: 20000,
      allocation: { mode: 'equal', participantIds: [billA.people[0].id] },
    })
    await saveActiveBillForUser(userA_id, billA)

    const resetBill = await resetActiveBillForUser(userA_id, { name: 'Alice Smith' })
    expect(resetBill.items).toHaveLength(0)
    expect(resetBill.people).toHaveLength(1)
    expect(resetBill.people[0].name).toBe('Alice Smith')
  })

  it('5. should reject unauthenticated requests to /api/cloud-bill with 401', async () => {
    const { GET, POST, DELETE } = await import('@/app/api/cloud-bill/route')

    const unauthReq = new Request('http://localhost:3000/api/cloud-bill')
    const getRes = await GET(unauthReq)
    expect(getRes.status).toBe(401)

    const postReq = new Request('http://localhost:3000/api/cloud-bill', {
      method: 'POST',
      body: JSON.stringify({ bill: { id: 'test' } }),
    })
    const postRes = await POST(postReq)
    expect(postRes.status).toBe(401)

    const delReq = new Request('http://localhost:3000/api/cloud-bill', { method: 'DELETE' })
    const delRes = await DELETE(delReq)
    expect(delRes.status).toBe(401)
  })
})
