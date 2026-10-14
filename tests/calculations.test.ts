import { describe, expect, it } from 'vitest'
import type { Adjustment, Allocation, Bill, Person, ProductItem } from '@/types/split'
import {
  allocationWithoutPerson,
  assignedIdsOf,
  billTotalsOf,
  calculateBill,
  computeSettlements,
  lineTotalOf,
  normalizeName,
} from '@/lib/calculations'

let counter = 0
const nextId = (prefix: string) => `${prefix}-${(counter += 1)}`

function makePerson(name: string, paid = 0): Person {
  return { id: nextId('person'), name, paidAmount: paid }
}

function makeItem(name: string, quantity: number, unitPrice: number, allocation: Allocation): ProductItem {
  return { id: nextId('item'), name, quantity, unitPrice, allocation: JSON.parse(JSON.stringify(allocation)) }
}

function makeAdjustment(partial: Partial<Adjustment> & Pick<Adjustment, 'kind' | 'method' | 'value'>): Adjustment {
  return { id: nextId('adj'), label: 'Service charge', ...partial }
}

function makeBill(people: Person[], items: ProductItem[], adjustments: Adjustment[] = []): Bill {
  return {
    id: nextId('bill'),
    name: 'Test bill',
    currency: 'INR',
    items,
    people,
    adjustments,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

/** Record the first participant as having paid the whole bill (incl. adjustments). */
function payFull(bill: Bill): Bill {
  const total = billTotalsOf(bill).billTotal
  bill.people = bill.people.map((p, i) => (i === 0 ? { ...p, paidAmount: total } : p))
  return bill
}

describe('normalizeName', () => {
  it('ignores case, spacing and trimming differences', () => {
    expect(normalizeName('  Maya ')).toBe('maya')
    expect(normalizeName('MAYA')).toBe('maya')
    expect(normalizeName('Neha   Sharma')).toBe('neha sharma')
  })
})

describe('line totals', () => {
  it('multiplies quantity by unit price in paise', () => {
    expect(lineTotalOf(makeItem('Pizza', 2, 45000, { mode: 'equal', participantIds: [] }))).toBe(90000)
  })
})

describe('equal splits', () => {
  it('splits ₹900 pizza between two people', () => {
    const maya = makePerson('Maya')
    const arjun = makePerson('Arjun')
    const bill = makeBill([maya, arjun], [
      makeItem('Pizza', 2, 45000, { mode: 'equal', participantIds: [maya.id, arjun.id] }),
    ])
    const result = calculateBill(payFull(bill))
    expect(result.valid).toBe(true)
    expect(result.people[maya.id].share).toBe(45000)
    expect(result.people[arjun.id].share).toBe(45000)
  })

  it('never loses a paisa: ₹100 across three people', () => {
    const a = makePerson('A')
    const b = makePerson('B')
    const c = makePerson('C')
    const bill = makeBill([a, b, c], [
      makeItem('Shared', 1, 10000, { mode: 'equal', participantIds: [a.id, b.id, c.id] }),
    ])
    const result = calculateBill(payFull(bill))
    const shares = [a, b, c].map((p) => result.people[p.id].share)
    expect(shares.reduce((x, y) => x + y, 0)).toBe(10000)
    expect(shares).toEqual([3334, 3333, 3333])
  })
})

describe('quantity splits', () => {
  it('charges by units consumed: 2 and 1 of three ₹160 coffees', () => {
    const maya = makePerson('Maya')
    const arjun = makePerson('Arjun')
    const bill = makeBill([maya, arjun], [
      makeItem('Cold coffee', 3, 16000, { mode: 'quantity', shares: { [maya.id]: 2, [arjun.id]: 1 } }),
    ])
    const result = calculateBill(payFull(bill))
    expect(result.valid).toBe(true)
    expect(result.people[maya.id].share).toBe(32000)
    expect(result.people[arjun.id].share).toBe(16000)
  })

  it('rejects consumed units that do not match the quantity purchased', () => {
    const maya = makePerson('Maya')
    const bill = makeBill([maya], [
      makeItem('Cold coffee', 3, 16000, { mode: 'quantity', shares: { [maya.id]: 2 } }),
    ])
    const result = calculateBill(bill)
    expect(result.valid).toBe(false)
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'QUANTITY_MISMATCH' }))
    expect(result.settlements).toEqual([])
  })
})

describe('custom amount splits', () => {
  it('accepts exact custom amounts: ₹400 + ₹200 of ₹600', () => {
    const maya = makePerson('Maya')
    const neha = makePerson('Neha')
    const bill = makeBill([maya, neha], [
      makeItem('Dish', 1, 60000, { mode: 'custom', shares: { [maya.id]: 40000, [neha.id]: 20000 } }),
    ])
    const result = calculateBill(payFull(bill))
    expect(result.valid).toBe(true)
    expect(result.people[maya.id].share).toBe(40000)
    expect(result.people[neha.id].share).toBe(20000)
  })

  it('blocks finalization when custom amounts do not add up', () => {
    const maya = makePerson('Maya')
    const neha = makePerson('Neha')
    const bill = makeBill([maya, neha], [
      makeItem('Dish', 1, 60000, { mode: 'custom', shares: { [maya.id]: 40000, [neha.id]: 10000 } }),
    ])
    const result = calculateBill(bill)
    expect(result.valid).toBe(false)
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'CUSTOM_SUM_MISMATCH' }))
    expect(result.unassignedValue).toBe(10000)
    expect(result.settlements).toEqual([])
  })
})

describe('percentage splits', () => {
  it('allocates 60/40 of ₹1,000', () => {
    const maya = makePerson('Maya')
    const arjun = makePerson('Arjun')
    const bill = makeBill([maya, arjun], [
      makeItem('Expense', 1, 100000, { mode: 'percentage', shares: { [maya.id]: 60, [arjun.id]: 40 } }),
    ])
    const result = calculateBill(payFull(bill))
    expect(result.valid).toBe(true)
    expect(result.people[maya.id].share).toBe(60000)
    expect(result.people[arjun.id].share).toBe(40000)
  })

  it('accepts fractional percentages that total exactly 100', () => {
    const a = makePerson('A')
    const b = makePerson('B')
    const c = makePerson('C')
    const bill = makeBill([a, b, c], [
      makeItem('Expense', 1, 10000, { mode: 'percentage', shares: { [a.id]: 33.33, [b.id]: 33.33, [c.id]: 33.34 } }),
    ])
    const result = calculateBill(payFull(bill))
    expect(result.valid).toBe(true)
    expect(result.itemsTotal).toBe(10000)
  })

  it('rejects percentages that do not sum to 100', () => {
    const maya = makePerson('Maya')
    const bill = makeBill([maya], [
      makeItem('Expense', 1, 100000, { mode: 'percentage', shares: { [maya.id]: 60 } }),
    ])
    const result = calculateBill(bill)
    expect(result.valid).toBe(false)
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'PERCENT_SUM_MISMATCH' }))
  })
})

describe('spec example: item-level splitting', () => {
  it('matches the documented ₹2,020 example exactly', () => {
    const maya = makePerson('Maya')
    const arjun = makePerson('Arjun')
    const neha = makePerson('Neha')
    const ravi = makePerson('Ravi')
    const bill = makeBill([maya, arjun, neha, ravi], [
      makeItem('Pizza', 1, 90000, { mode: 'equal', participantIds: [maya.id, arjun.id] }),
      makeItem('Pasta', 2, 32000, { mode: 'equal', participantIds: [maya.id, neha.id] }),
      makeItem('Cold coffee', 3, 16000, { mode: 'equal', participantIds: [arjun.id, neha.id, ravi.id] }),
    ])

    const result = calculateBill(payFull(bill))
    expect(result.valid).toBe(true)
    expect(result.itemsTotal).toBe(202000)
    expect(result.people[maya.id].share).toBe(77000) // ₹770
    expect(result.people[arjun.id].share).toBe(61000) // ₹610
    expect(result.people[neha.id].share).toBe(48000) // ₹480
    expect(result.people[ravi.id].share).toBe(16000) // ₹160
    expect(Object.values(result.people).reduce((sum, r) => sum + r.share, 0)).toBe(202000)
  })
})

describe('adjustments', () => {
  it('allocates a 10% service charge proportionally to item shares', () => {
    const maya = makePerson('Maya')
    const arjun = makePerson('Arjun')
    const bill = makeBill([maya, arjun], [
      makeItem('Pizza', 1, 90000, { mode: 'equal', participantIds: [maya.id, arjun.id] }),
      makeItem('Solo drink', 1, 30000, { mode: 'equal', participantIds: [arjun.id] }),
    ], [makeAdjustment({ kind: 'service_charge', method: 'percent', value: 10 })])

    const result = calculateBill(payFull(bill))
    // Subtotal ₹1,200; 10% = ₹120. Maya's share ₹450 => +₹45; Arjun ₹750 => +₹75.
    expect(result.valid).toBe(true)
    expect(result.adjustmentsTotal).toBe(12000)
    expect(result.billTotal).toBe(132000)
    expect(result.people[maya.id].share).toBe(49500)
    expect(result.people[arjun.id].share).toBe(82500)
  })

  it('handles fixed discounts proportionally', () => {
    const maya = makePerson('Maya')
    const arjun = makePerson('Arjun')
    const bill = makeBill([maya, arjun], [
      makeItem('Pizza', 1, 90000, { mode: 'equal', participantIds: [maya.id, arjun.id] }),
    ], [makeAdjustment({ kind: 'discount', method: 'fixed', value: 9000, label: 'Coupon' })])

    const result = calculateBill(payFull(bill))
    expect(result.valid).toBe(true)
    expect(result.billTotal).toBe(81000)
    expect(result.people[maya.id].share).toBe(40500)
    expect(result.people[arjun.id].share).toBe(40500)
  })

  it('flags discounts that exceed the subtotal', () => {
    const maya = makePerson('Maya')
    const bill = makeBill([maya], [
      makeItem('Pizza', 1, 90000, { mode: 'equal', participantIds: [maya.id] }),
    ], [makeAdjustment({ kind: 'discount', method: 'fixed', value: 100000 })])

    const result = calculateBill(bill)
    expect(result.valid).toBe(false)
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'NEGATIVE_TOTAL' }))
  })
})

describe('payer validation', () => {
  const items = (a: Person, b: Person) => [
    makeItem('Pizza', 1, 90000, { mode: 'equal', participantIds: [a.id, b.id] }),
  ]

  it('rejects settlement when nothing is marked as paid', () => {
    const a = makePerson('A')
    const b = makePerson('B')
    const result = calculateBill(makeBill([a, b], items(a, b)))
    expect(result.valid).toBe(false)
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'PAID_TOTAL_MISMATCH' }))
    expect(result.settlements).toEqual([])
  })

  it('rejects settlement when paid total differs from bill total', () => {
    const a = makePerson('A')
    const b = makePerson('B')
    const result = calculateBill(makeBill([{ ...a, paidAmount: 50000 }, b], items(a, b)))
    expect(result.valid).toBe(false)
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'PAID_TOTAL_MISMATCH' }))
  })

  it('supports multiple payers whose amounts together cover the bill', () => {
    const a = makePerson('A')
    const b = makePerson('B')
    const bill = makeBill([{ ...a, paidAmount: 40000 }, { ...b, paidAmount: 50000 }], items(a, b))
    const result = calculateBill(bill)
    expect(result.valid).toBe(true)
    // A paid ₹400 of a ₹450 share -> owes ₹50 to B (paid ₹500, share ₹450).
    expect(result.settlements).toEqual([{ fromPersonId: a.id, toPersonId: b.id, amount: 5000 }])
  })
})

describe('settlement algorithm', () => {
  it('matches debtors to creditors deterministically', () => {
    const maya = makePerson('Maya')
    const arjun = makePerson('Arjun')
    const neha = makePerson('Neha')
    const ravi = makePerson('Ravi')
    const bill = makeBill(
      [maya, arjun, neha, ravi],
      [
        makeItem('Pizza', 1, 90000, { mode: 'equal', participantIds: [maya.id, arjun.id] }),
        makeItem('Pasta', 2, 32000, { mode: 'equal', participantIds: [maya.id, neha.id] }),
        makeItem('Cold coffee', 3, 16000, { mode: 'equal', participantIds: [arjun.id, neha.id, ravi.id] }),
      ],
    )
    bill.people = bill.people.map((p) => (p.id === maya.id ? { ...p, paidAmount: 202000 } : p))

    const result = calculateBill(bill)
    expect(result.valid).toBe(true)
    expect(result.settlements).toEqual([
      { fromPersonId: arjun.id, toPersonId: maya.id, amount: 61000 },
      { fromPersonId: neha.id, toPersonId: maya.id, amount: 48000 },
      { fromPersonId: ravi.id, toPersonId: maya.id, amount: 16000 },
    ])
  })

  it('produces identical output for identical input', () => {
    const a = makePerson('A')
    const b = makePerson('B')
    const c = makePerson('C')
    const build = () =>
      makeBill(
        [a, b, c],
        [
          makeItem('Item 1', 2, 12345, { mode: 'equal', participantIds: [a.id, b.id] }),
          makeItem('Item 2', 3, 999, { mode: 'quantity', shares: { [a.id]: 1, [c.id]: 2 } }),
        ],
      )
    const bill = build()
    bill.people = bill.people.map((p) => (p.id === a.id ? { ...p, paidAmount: billTotalsOf(bill).billTotal } : p))
    const first = calculateBill(bill)
    const second = calculateBill(JSON.parse(JSON.stringify(bill)) as Bill)
    expect(first).toEqual(second)
  })
})

describe('bill-level validation', () => {
  it('flags an empty bill', () => {
    const result = calculateBill(makeBill([], []))
    expect(result.valid).toBe(false)
    expect(result.issues.map((i) => i.code)).toEqual(expect.arrayContaining(['EMPTY_BILL', 'NO_PEOPLE']))
  })

  it('flags duplicate names regardless of case or spacing', () => {
    const maya = makePerson('Maya')
    const dup = makePerson('  maYa ')
    const result = calculateBill(makeBill([maya, dup], []))
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'DUPLICATE_NAME' }))
  })

  it('flags unassigned products and their value', () => {
    const maya = makePerson('Maya')
    const bill = makeBill([maya], [
      makeItem('Assigned', 1, 50000, { mode: 'equal', participantIds: [maya.id] }),
      makeItem('Unassigned', 2, 15000, { mode: 'equal', participantIds: [] }),
    ])
    const result = calculateBill(bill)
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'ITEM_UNASSIGNED', itemId: bill.items[1].id }))
    expect(result.unassignedValue).toBe(30000)
  })

  it('flags invalid item data (zero quantity, negative price)', () => {
    const maya = makePerson('Maya')
    const zeroQty = makeItem('Bad qty', 0, 100, { mode: 'equal', participantIds: [maya.id] })
    const negativePrice = makeItem('Bad price', 1, -100, { mode: 'equal', participantIds: [maya.id] })
    const result = calculateBill(makeBill([maya], [zeroQty, negativePrice]))
    const codes = result.issues.map((i) => i.code)
    expect(codes).toContain('INVALID_ITEM')
    expect(result.valid).toBe(false)
  })
})

describe('removing a participant', () => {
  it('clears their shares from every allocation', () => {
    const maya = makePerson('Maya')
    const arjun = makePerson('Arjun')
    const pizza = makeItem('Pizza', 1, 90000, { mode: 'equal', participantIds: [maya.id, arjun.id] })
    const coffee = makeItem('Coffee', 2, 16000, { mode: 'quantity', shares: { [maya.id]: 1, [arjun.id]: 1 } })

    expect(assignedIdsOf(pizza)).toEqual([maya.id, arjun.id])

    pizza.allocation = allocationWithoutPerson(pizza.allocation, arjun.id)
    coffee.allocation = allocationWithoutPerson(coffee.allocation, arjun.id)

    expect(assignedIdsOf(pizza)).toEqual([maya.id])
    expect(assignedIdsOf(coffee)).toEqual([maya.id])
  })
})

describe('computeSettlements (direct)', () => {
  it('minimizes transfers between many debtors and one creditor', () => {
    const people = {
      a: { personId: 'a', share: 0, paid: 100, net: 100, itemContributions: {} },
      b: { personId: 'b', share: 30, paid: 0, net: -30, itemContributions: {} },
      c: { personId: 'c', share: 70, paid: 0, net: -70, itemContributions: {} },
    }
    const settlements = computeSettlements(people, [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
      { id: 'c', name: 'C' },
    ])
    expect(settlements).toEqual([
      { fromPersonId: 'c', toPersonId: 'a', amount: 70 },
      { fromPersonId: 'b', toPersonId: 'a', amount: 30 },
    ])
  })
})
