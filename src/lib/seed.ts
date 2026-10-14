import type { Bill, CurrencyCode, ProductItem } from '@/types/split'
import { newId } from '@/lib/id'

/**
 * Sample data for visual testing on first visit — matches the dashboard
 * concept. Every value is fully editable; the app never restricts users
 * to these products, names or prices.
 */
export function createSampleBill(): Bill {
  const now = new Date().toISOString()
  const people = {
    maya: newId('person'),
    arjun: newId('person'),
    neha: newId('person'),
    ravi: newId('person'),
  }

  const item = (
    name: string,
    quantity: number,
    unitPriceRupees: number,
    participantIds: string[],
  ): ProductItem => ({
    id: newId('item'),
    name,
    quantity,
    unitPrice: unitPriceRupees * 100,
    allocation: { mode: 'equal', participantIds },
  })

  return {
    id: newId('bill'),
    name: 'Dinner',
    currency: 'INR',
    items: [
      item('Pizza', 2, 450, [people.maya, people.arjun]),
      item('Garlic bread', 1, 180, [people.maya, people.neha]),
      item('Pasta', 2, 320, [people.maya, people.neha]),
      item('Cold coffee', 3, 160, [people.arjun, people.neha, people.ravi]),
      item('Brownie', 2, 130, [people.neha, people.ravi]),
    ],
    people: [
      { id: people.maya, name: 'Maya', paidAmount: 246000 },
      { id: people.arjun, name: 'Arjun', paidAmount: 0 },
      { id: people.neha, name: 'Neha', paidAmount: 0 },
      { id: people.ravi, name: 'Ravi', paidAmount: 0 },
    ],
    adjustments: [],
    createdAt: now,
    updatedAt: now,
  }
}

/** A fresh, empty bill. */
export function createEmptyBill(currency: CurrencyCode): Bill {
  const now = new Date().toISOString()
  return {
    id: newId('bill'),
    name: '',
    currency,
    items: [],
    people: [],
    adjustments: [],
    createdAt: now,
    updatedAt: now,
  }
}
