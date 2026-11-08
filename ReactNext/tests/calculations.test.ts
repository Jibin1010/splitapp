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

  it('supports multiple head payers with user-defined tail-to-head mappings', () => {
    const head1 = makePerson('Tanvi')
    const head2 = makePerson('Aarav')
    const tail1 = makePerson('Yash')
    const tail2 = makePerson('Isha')

    const bill = makeBill(
      [head1, head2, tail1, tail2],
      [
        makeItem('Item 1', 1, 40000, { mode: 'equal', participantIds: [head1.id, tail1.id] }),
        makeItem('Item 2', 1, 60000, { mode: 'equal', participantIds: [head2.id, tail2.id] }),
      ],
    )

    // Tanvi paid ₹600, Aarav paid ₹400 upfront (total ₹1,000)
    bill.people = bill.people.map((p) => {
      if (p.id === head1.id) return { ...p, paidAmount: 60000 }
      if (p.id === head2.id) return { ...p, paidAmount: 40000 }
      return { ...p, paidAmount: 0 }
    })

    // Tail preferences: Yash prefers Tanvi, Isha prefers Aarav
    bill.headTailPreferences = {
      [tail1.id]: head1.id,
      [tail2.id]: head2.id,
    }

    const result = calculateBill(bill)
    expect(result.valid).toBe(true)
    // Yash owes ₹200 -> pays Tanvi
    expect(result.settlements).toContainEqual({ fromPersonId: tail1.id, toPersonId: head1.id, amount: 20000 })
    // Isha owes ₹300 -> prefers Aarav (net +₹100), remaining ₹200 goes to Tanvi
    expect(result.settlements).toContainEqual({ fromPersonId: tail2.id, toPersonId: head2.id, amount: 10000 })
    expect(result.settlements).toContainEqual({ fromPersonId: tail2.id, toPersonId: head1.id, amount: 20000 })
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

describe('custom adjustment percentage shares (GST)', () => {
  it('allocates GST according to specified person percentage shares', () => {
    const rahul = makePerson('Rahul')
    const priya = makePerson('Priya')
    // ₹1,000 subtotal item split equally (₹500 each)
    const item = makeItem('Dinner', 1, 100000, { mode: 'equal', participantIds: [rahul.id, priya.id] })
    // ₹100 GST (10000 paise): Rahul pays 40% (₹40 / 4000 paise), Priya pays 60% (₹60 / 6000 paise)
    const gst = makeAdjustment({
      kind: 'tax',
      label: 'GST',
      method: 'fixed',
      value: 10000,
      shares: {
        [rahul.id]: 40,
        [priya.id]: 60,
      },
    })
    const bill = payFull(makeBill([rahul, priya], [item], [gst]))
    const result = calculateBill(bill)

    expect(result.valid).toBe(true)
    // Rahul: 50000 + 4000 = 54000 paise (₹540)
    expect(result.people[rahul.id].share).toBe(54000)
    // Priya: 50000 + 6000 = 56000 paise (₹560)
    expect(result.people[priya.id].share).toBe(56000)
    // Total shares equal bill total: 54000 + 56000 = 110000 paise
    expect(result.billTotal).toBe(110000)
  })

  it('flags PERCENT_SUM_MISMATCH if adjustment shares do not total 100%', () => {
    const rahul = makePerson('Rahul')
    const priya = makePerson('Priya')
    const item = makeItem('Dinner', 1, 100000, { mode: 'equal', participantIds: [rahul.id, priya.id] })
    const gst = makeAdjustment({
      kind: 'tax',
      label: 'GST',
      method: 'fixed',
      value: 10000,
      shares: {
        [rahul.id]: 30,
        [priya.id]: 50, // 80% total
      },
    })
    const bill = payFull(makeBill([rahul, priya], [item], [gst]))
    const result = calculateBill(bill)
    const issueCodes = result.issues.map((i) => i.code)
    expect(issueCodes).toContain('PERCENT_SUM_MISMATCH')
    expect(result.valid).toBe(false)
  })

  it('calculates GST percentage for each person proportionally based on their spend (e.g. 1 person ate meals for ₹120)', () => {
    const yash = makePerson('Yash Chopra')
    const rahul = makePerson('Rahul Roy')
    const aditya = makePerson('Aditya Das')
    const bharat = makePerson('Bharat Verma')

    // Chicken Biriyani: ₹540 total (54000 paise), split across 3 people = ₹180 each
    const biriyani = makeItem('Chicken Biriyani', 3, 18000, {
      mode: 'equal',
      participantIds: [yash.id, aditya.id, bharat.id],
    })

    // Meals: ₹120 total (12000 paise), 1 person ate meals = Rahul
    const meals = makeItem('Meals', 1, 12000, {
      mode: 'equal',
      participantIds: [rahul.id],
    })

    // Total spend = ₹540 + ₹120 = ₹660 (66000 paise)
    // Rahul: 120 / 660 = 18.2%
    // Yash: 180 / 660 = 27.3%
    // Aditya: 180 / 660 = 27.3%
    // Bharat: 27.2% (balances to 100%)
    const gst = makeAdjustment({
      kind: 'tax',
      label: 'GST',
      method: 'fixed',
      value: 6600,
      shares: {
        [rahul.id]: 18.2,
        [yash.id]: 27.3,
        [aditya.id]: 27.3,
        [bharat.id]: 27.2,
      },
    })

    const bill = payFull(makeBill([yash, rahul, aditya, bharat], [biriyani, meals], [gst]))
    const result = calculateBill(bill)

    expect(result.valid).toBe(true)
    // Total bill = 66000 items + 6600 GST = 72600 paise (₹726.00)
    expect(result.billTotal).toBe(72600)
    expect(result.people[rahul.id].share).toBeGreaterThan(12000)
    // Individual shares sum to total bill
    const sumShares = Object.values(result.people).reduce((sum, p) => sum + p.share, 0)
    expect(sumShares).toBe(72600)
  })

  it('calculates valid settlement when secondary head pays 60 and head 1 pays reduced balance', () => {
    const aarav = makePerson('Aarav Patel')
    const farhan = makePerson('Farhan Akhtar')
    const sandeep = makePerson('Sandeep Chawla')

    // Bill total ₹693 (69300 paise): Chicken Biriyani 540 + Meals 120 + GST 33
    const item1 = makeItem('Chicken Biriyani', 3, 18000, { mode: 'equal', participantIds: [aarav.id, farhan.id, sandeep.id] })
    const item2 = makeItem('Meals', 1, 12000, { mode: 'equal', participantIds: [sandeep.id] })
    const gst = makeAdjustment({ kind: 'tax', label: 'GST', method: 'fixed', value: 3300 })

    const totalBillPaise = 69300
    const head2PaidPaise = 6000 // ₹60 paid by Head 2 (Farhan)
    const head1PaidPaise = totalBillPaise - head2PaidPaise // ₹633 paid by Head 1 (Aarav, reduced from ₹693)

    aarav.paidAmount = head1PaidPaise
    farhan.paidAmount = head2PaidPaise
    sandeep.paidAmount = 0

    const bill = makeBill([aarav, farhan, sandeep], [item1, item2], [gst])
    const result = calculateBill(bill)

    expect(result.valid).toBe(true)
    expect(result.billTotal).toBe(69300)
    expect(aarav.paidAmount + farhan.paidAmount + sandeep.paidAmount).toBe(69300)
    expect(result.settlements.length).toBeGreaterThan(0)
  })

  it('ensures when one debtor pays 2 creditors, both transfers are whole full amounts without decimal paise', () => {
    // Mock net results where a debtor owes 188.97 (18897 paise) split between 2 creditors (2798 and 16099 paise)
    const personResults: Record<string, any> = {
      p1: { personId: 'p1', share: 18897, paidAmount: 0, net: -18897 },
      c1: { personId: 'c1', share: 3202, paidAmount: 6000, net: 2798 },
      c2: { personId: 'c2', share: 20898, paidAmount: 63300, net: 42402 },
    }
    const ordered = [
      { id: 'c2', name: 'Sandeep Chawla' },
      { id: 'c1', name: 'Farhan Akhtar' },
      { id: 'p1', name: 'Radhika Soni' },
    ]

    const settlements = computeSettlements(personResults, ordered, { p1: 'c1' })
    expect(settlements.length).toBe(2)

    // Check that both transfers from p1 are whole amounts (multiples of 100 paise)
    for (const s of settlements) {
      expect(s.amount % 100).toBe(0)
    }

    // First transfer to c1 is ₹28 (2800 paise), second transfer to c2 is ₹161 (16100 paise)
    const t1 = settlements.find((s) => s.toPersonId === 'c1')
    const t2 = settlements.find((s) => s.toPersonId === 'c2')
    expect(t1?.amount).toBe(2800)
    expect(t2?.amount).toBe(16100)
    expect(t1!.amount + t2!.amount).toBe(18900) // 189.00 full amount
  })

  it('correctly calculates Duniyav Bir multi-head payer split: Jijo fronted ₹150 on ₹126 share and collects back ₹24', () => {
    const sindhu = makePerson('Sindhu', 54300)
    const smeety = makePerson('Smeety', 0)
    const jibin = makePerson('Jibin Jijo', 0)
    const jijo = makePerson('Jijo P George', 15000)

    const biriyani = makeItem('Chicken Biriyani', 3, 18000, {
      mode: 'equal',
      participantIds: [sindhu.id, smeety.id, jibin.id],
    })
    const meals = makeItem('Meals', 1, 12000, {
      mode: 'equal',
      participantIds: [jijo.id],
    })
    const gst = makeAdjustment({ kind: 'tax', method: 'percent', value: 5, label: 'GST (5%)' })

    const bill = makeBill([sindhu, smeety, jibin, jijo], [biriyani, meals], [gst])
    const result = calculateBill(bill)

    expect(result.valid).toBe(true)
    expect(result.billTotal).toBe(69300)

    // Sindhu: share 18900, paid 54300, net +35400
    expect(result.people[sindhu.id].share).toBe(18900)
    expect(result.people[sindhu.id].paid).toBe(54300)
    expect(result.people[sindhu.id].net).toBe(35400)

    // Jijo P George: share 12600, paid 15000, net +2400 (collects back ₹24.00!)
    expect(result.people[jijo.id].share).toBe(12600)
    expect(result.people[jijo.id].paid).toBe(15000)
    expect(result.people[jijo.id].net).toBe(2400)

    // Jibin & Smeety: share 18900, paid 0, net -18900
    expect(result.people[jibin.id].net).toBe(-18900)
    expect(result.people[smeety.id].net).toBe(-18900)

    // Check settlements: Smeety pays Jijo ₹24!
    const toJijo = result.settlements.filter((s) => s.toPersonId === jijo.id)
    expect(toJijo.length).toBe(1)
    expect(toJijo[0].fromPersonId).toBe(smeety.id)
    expect(toJijo[0].amount).toBe(2400)

    // Sindhu receives 18900 + 16500 = 35400
    const toSindhu = result.settlements.filter((s) => s.toPersonId === sindhu.id)
    const sindhuTotal = toSindhu.reduce((sum, s) => sum + s.amount, 0)
    expect(sindhuTotal).toBe(35400)
  })
})

