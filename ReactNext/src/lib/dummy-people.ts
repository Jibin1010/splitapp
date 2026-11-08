import type { Bill, CurrencyCode, Person } from '@/types/split'
import { newId } from '@/lib/id'
import { DUMMY_PEOPLE_RAW, ALL_SUGGESTED_NAMES, type DummyPersonRaw } from './dummy-people-data'

export { DUMMY_PEOPLE_RAW, ALL_SUGGESTED_NAMES }
export type { DummyPersonRaw }

/**
 * Returns all 1,000 fresh Person objects with unique IDs, names, portrait avatars,
 * and verified E.164 phone numbers.
 */
export function get1000DummyPeople(): Person[] {
  return DUMMY_PEOPLE_RAW.map((person) => ({
    id: newId('person'),
    name: person.name,
    photo: person.photo,
    paidAmount: 0,
    phone: person.phone,
    isPhoneVerified: true,
  }))
}

/**
 * Returns 50 fresh Person objects with unique IDs, realistic names, photos, and verified phone numbers.
 */
export function get50DummyPeople(): Person[] {
  return DUMMY_PEOPLE_RAW.slice(0, 50).map((person) => ({
    id: newId('person'),
    name: person.name,
    photo: person.photo,
    paidAmount: 0,
    phone: person.phone,
    isPhoneVerified: true,
  }))
}

/**
 * Creates a bill with 0 items, 0 adjustments, and 1,000 verified dummy people.
 */
export function create1000PeopleBill(currency: CurrencyCode = 'INR'): Bill {
  const now = new Date().toISOString()
  return {
    id: newId('bill'),
    name: '1000 Verified People Split',
    currency,
    items: [],
    adjustments: [],
    people: get1000DummyPeople(),
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Creates a clean bill with 0 items, 0 adjustments, and 50 verified dummy people.
 */
export function create50PeopleBill(currency: CurrencyCode = 'INR'): Bill {
  const now = new Date().toISOString()
  return {
    id: newId('bill'),
    name: 'Group Split',
    currency,
    items: [],
    adjustments: [],
    people: get50DummyPeople(),
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Pick a random avatar from the curated list for any newly created person.
 */
export function getRandomAvatarForName(name: string): string {
  if (!name.trim()) return DUMMY_PEOPLE_RAW[0].photo
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % DUMMY_PEOPLE_RAW.length
  return DUMMY_PEOPLE_RAW[index].photo
}

/**
 * Derives a deterministic verified phone number for any person name.
 */
export function getRandomPhoneForName(name: string): string {
  if (!name.trim()) return '+919820000001'
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i)
    hash |= 0
  }
  const num = (Math.abs(hash) % 1000) + 1
  return `+919820${String(num).padStart(6, '0')}`
}

/**
 * Searches person name and phone suggestions matching a query string across all 1,000 verified dummy people.
 * Supports searching by letters or digits (e.g. "Maya", "Aarav", "98200").
 */
export function searchPeopleSuggestions(
  query: string,
  excludeNames: string[] = [],
  limit: number = 10
): DummyPersonRaw[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  const excludeSet = new Set(excludeNames.map((n) => n.trim().toLowerCase()))
  const qCleanDigits = q.replace(/[^0-9]/g, '')
  const qNationalDigits =
    qCleanDigits.startsWith('91') && qCleanDigits.length > 10
      ? qCleanDigits.slice(2)
      : qCleanDigits.replace(/^0+/, '')

  const filtered = ALL_SUGGESTED_NAMES.filter((p) => {
    const lower = p.name.toLowerCase()
    if (excludeSet.has(lower)) return false

    // Name matching
    if (lower.includes(q)) return true

    // Phone matching: matches even if stored with +91 and user didn't type 91
    if (qCleanDigits.length >= 2) {
      const pClean = p.phone.replace(/[^0-9]/g, '')
      const pNational = pClean.startsWith('91') ? pClean.slice(2) : pClean

      if (
        pClean.includes(qCleanDigits) ||
        pNational.includes(qNationalDigits) ||
        (qNationalDigits.length >= 2 && pClean.includes(qNationalDigits)) ||
        p.phone.toLowerCase().includes(q)
      ) {
        return true
      }
    }

    return false
  })

  const PRIMARY_NUMBERS = new Set([
    '+919207293021',
    '+919400986188',
    '+919188724538',
    '+919847416607',
  ])

  filtered.sort((a, b) => {
    // Primary curated priority
    const aPrimary = PRIMARY_NUMBERS.has(a.phone)
    const bPrimary = PRIMARY_NUMBERS.has(b.phone)
    if (aPrimary && !bPrimary) return -1
    if (!aPrimary && bPrimary) return 1

    const aLower = a.name.toLowerCase()
    const bLower = b.name.toLowerCase()
    const aStarts = aLower.startsWith(q)
    const bStarts = bLower.startsWith(q)
    if (aStarts && !bStarts) return -1
    if (!aStarts && bStarts) return 1

    const aWords = aLower.split(/\s+/)
    const bWords = bLower.split(/\s+/)
    const aWordStarts = aWords.some((w) => w.startsWith(q))
    const bWordStarts = bWords.some((w) => w.startsWith(q))
    if (aWordStarts && !bWordStarts) return -1
    if (!aWordStarts && bWordStarts) return 1

    return aLower.localeCompare(bLower)
  })

  return filtered.slice(0, limit)
}
