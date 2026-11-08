import { describe, expect, it, beforeEach } from 'vitest'
import {
  getActiveBillForUser,
  saveActiveBillForUser,
  resetActiveBillForUser,
  getUserBills,
  getBillByIdForUser,
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

  it('6. should allow group member Bob to access group bill when Bob logs in', async () => {
    // Alice creates bill and adds Bob Jones
    const billA = await getActiveBillForUser(userA_id, { name: 'Alice Smith' })
    billA.name = 'Dinner at Duniyav Bir'
    billA.people = [
      { id: billA.people[0].id, name: 'Alice Smith', paidAmount: 69300 },
      { id: 'person-bob', name: 'Bob Jones', paidAmount: 0 },
    ]
    billA.items = [
      {
        id: 'item-biriyani',
        name: 'Chicken Biriyani',
        quantity: 3,
        unitPrice: 18000,
        allocation: { mode: 'equal', participantIds: [billA.people[0].id, 'person-bob'] },
      },
    ]
    await saveActiveBillForUser(userA_id, billA)

    // Bob logs in
    const userBob_id = 'user-identity-bob-5555'
    const billBob = await getActiveBillForUser(userBob_id, { name: 'Bob Jones' })
    expect(billBob).toBeDefined()
    expect(billBob.id).toBe(billA.id)
    expect(billBob.name).toBe('Dinner at Duniyav Bir')
    expect(billBob.items).toHaveLength(1)
    expect(billBob.items[0].name).toBe('Chicken Biriyani')
    expect(billBob.people.map((p) => p.name)).toContain('Bob Jones')
  })

  it('7. should preserve draft on reload without vanishing when real items like Biriyani exist', async () => {
    const { saveDraft, loadDraft } = await import('@/lib/storage')
    const testBill: Bill = {
      id: 'bill-test-reload',
      name: 'Duniyav Bir #99307',
      currency: 'INR',
      items: [
        {
          id: 'item-1',
          name: 'Chicken Biriyani',
          quantity: 3,
          unitPrice: 18000,
          allocation: { mode: 'equal', participantIds: ['person-1', 'person-2'] },
        },
      ],
      people: [
        { id: 'person-1', name: 'Jibin Jijo', paidAmount: 54000 },
        { id: 'person-2', name: 'Sindhu', paidAmount: 0 },
      ],
      adjustments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    saveDraft(testBill)
    const reloaded = loadDraft()
    expect(reloaded).not.toBeNull()
    expect(reloaded?.name).toBe('Duniyav Bir #99307')
    expect(reloaded?.items).toHaveLength(1)
    expect(reloaded?.items[0].name).toBe('Chicken Biriyani')
  })

  it('8. should return all bills where user is a participant via getUserBills and hide bills where user is not involved', async () => {
    // Bill 1: Alice + Bob
    const bill1 = await getActiveBillForUser(userA_id, { name: 'Alice Smith' })
    bill1.name = 'Trip to Goa'
    bill1.people.push({ id: 'person-bob', name: 'Bob Jones', paidAmount: 0 })
    bill1.items.push({
      id: 'item-hotel',
      name: 'Resort Stay',
      quantity: 1,
      unitPrice: 500000,
      allocation: { mode: 'equal', participantIds: [bill1.people[0].id, 'person-bob'] },
    })
    await saveActiveBillForUser(userA_id, bill1)

    // Bill 2: Charlie only (userB_id)
    const bill2 = await getActiveBillForUser(userB_id, { name: 'Charlie Brown' })
    bill2.name = 'Lunch with David'
    bill2.people.push({ id: 'person-david', name: 'David Lee', paidAmount: 0 })
    await saveActiveBillForUser(userB_id, bill2)

    // Alice queries her bills: must see "Trip to Goa", must NOT see "Lunch with David"
    const aliceBills = await getUserBills(userA_id, { name: 'Alice Smith' })
    expect(aliceBills.some((b) => b.name === 'Trip to Goa')).toBe(true)
    expect(aliceBills.some((b) => b.name === 'Lunch with David')).toBe(false)

    // Bob queries his bills: must see "Trip to Goa", must NOT see "Lunch with David"
    const bobBills = await getUserBills('person-bob', { name: 'Bob Jones' })
    expect(bobBills.some((b) => b.name === 'Trip to Goa')).toBe(true)
    expect(bobBills.some((b) => b.name === 'Lunch with David')).toBe(false)

    // Charlie queries his bills: must see "Lunch with David", must NOT see "Trip to Goa"
    const charlieBills = await getUserBills(userB_id, { name: 'Charlie Brown' })
    expect(charlieBills.some((b) => b.name === 'Lunch with David')).toBe(true)
    expect(charlieBills.some((b) => b.name === 'Trip to Goa')).toBe(false)
  })

  it('9. should return bill by ID via getBillByIdForUser only if user is owner or participant, and reject non-participants', async () => {
    const billA = await getActiveBillForUser(userA_id, { name: 'Alice Smith' })
    billA.name = 'Secret Split'
    await saveActiveBillForUser(userA_id, billA)

    // Alice can load her own bill
    const loadedByAlice = await getBillByIdForUser(userA_id, billA.id, { name: 'Alice Smith' })
    expect(loadedByAlice).not.toBeNull()
    expect(loadedByAlice?.id).toBe(billA.id)

    // Charlie (userB_id) cannot load Alice's bill
    const loadedByCharlie = await getBillByIdForUser(userB_id, billA.id, { name: 'Charlie Brown' })
    expect(loadedByCharlie).toBeNull()
  })
})
