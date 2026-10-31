import type { Bill, CurrencyCode, Person } from '@/types/split'
import { newId } from '@/lib/id'
import { DUMMY_PEOPLE_RAW, ALL_SUGGESTED_NAMES } from './dummy-people-data'

export { DUMMY_PEOPLE_RAW, ALL_SUGGESTED_NAMES }

/**
 * Returns 50 fresh Person objects with unique IDs, realistic names and photos.
 */
export function get50DummyPeople(): Person[] {
  return DUMMY_PEOPLE_RAW.map((person) => ({
    id: newId('person'),
    name: person.name,
    photo: person.photo,
    paidAmount: 0,
  }))
}

/**
 * Creates a clean bill with 0 items, 0 adjustments, and all 50 dummy people.
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
 * Searches person name suggestions matching a query string or letter prefix.
 * Prioritizes names starting with the query.
 */
export function searchPeopleSuggestions(
  query: string,
  excludeNames: string[] = []
): Array<{ name: string; photo: string }> {
  const q = query.trim().toLowerCase()
  if (!q) return []

  const excludeSet = new Set(excludeNames.map((n) => n.trim().toLowerCase()))

  const filtered = ALL_SUGGESTED_NAMES.filter((p) => {
    const lower = p.name.toLowerCase()
    if (excludeSet.has(lower)) return false
    return lower.includes(q)
  })

  filtered.sort((a, b) => {
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

  return filtered.slice(0, 8)
}
