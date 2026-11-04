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
    kiran: newId('person'),
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
      {
        id: people.maya,
        name: 'Maya',
        paidAmount: 246000,
        photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      },
      {
        id: people.arjun,
        name: 'Arjun',
        paidAmount: 0,
        photo: '/images/production/arjun-avatar.jpg',
      },
      {
        id: people.neha,
        name: 'Neha',
        paidAmount: 0,
        photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      },
      {
        id: people.ravi,
        name: 'Ravi',
        paidAmount: 0,
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      },
      {
        id: people.kiran,
        name: 'Kiran',
        paidAmount: 0,
        photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      },
    ],
    adjustments: [],
    createdAt: now,
    updatedAt: now,
  }
}

export { create50PeopleBill, get50DummyPeople } from '@/lib/dummy-people'

/** A clean initial bill with ONLY the active user (zero dummy people). */
export function createCleanBill(
  currency: CurrencyCode = 'INR',
  userName?: string,
  userPhoto?: string | null
): Bill {
  const now = new Date().toISOString()
  const name = userName?.trim() || 'You'
  const personId = newId('person')
  return {
    id: newId('bill'),
    name: 'My Group Split',
    currency,
    items: [],
    people: [
      {
        id: personId,
        name,
        paidAmount: 0,
        photo: userPhoto ?? undefined,
      },
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
