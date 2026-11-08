import { describe, expect, it } from 'vitest'
import {
  create1000PeopleBill,
  create50PeopleBill,
  DUMMY_PEOPLE_RAW,
  get1000DummyPeople,
  get50DummyPeople,
  searchPeopleSuggestions,
} from '@/lib/dummy-people'
import { billSchema } from '@/lib/validation'
import { calculateBill } from '@/lib/calculations'

describe('Verified Primary Users Directory Test Suite', () => {
  it('defines strictly the 4 verified users with unique names, photos, and verified E.164 phone numbers', () => {
    expect(DUMMY_PEOPLE_RAW).toHaveLength(4)

    const names = new Set<string>()
    const phones = new Set<string>()

    for (const person of DUMMY_PEOPLE_RAW) {
      expect(person.name.trim().length).toBeGreaterThan(0)
      expect(person.photo).toMatch(/^https?:\/\//)
      expect(person.phone).toMatch(/^\+91[0-9]{10}$/)
      expect(person.isPhoneVerified).toBe(true)

      names.add(person.name.toLowerCase())
      phones.add(person.phone)
    }

    expect(names.size).toBe(4)
    expect(phones.size).toBe(4)
  })

  it('generates Person objects with unique ids, verified numbers, and zero paid amounts', () => {
    const people = get1000DummyPeople()
    expect(people).toHaveLength(4)

    const ids = new Set<string>()
    for (const person of people) {
      expect(person.id).toBeTruthy()
      expect(person.paidAmount).toBe(0)
      expect(person.photo).toBeDefined()
      expect(person.phone).toMatch(/^\+91[0-9]{10}$/)
      expect(person.isPhoneVerified).toBe(true)
      ids.add(person.id)
    }
    expect(ids.size).toBe(4)
  })

  it('creates a clean bill with 0 items, 0 adjustments, and verified people passing schema validation', () => {
    const bill = create1000PeopleBill('INR')
    expect(bill.items).toHaveLength(0)
    expect(bill.adjustments).toHaveLength(0)
    expect(bill.people).toHaveLength(4)

    const parsed = billSchema.safeParse(bill)
    expect(parsed.success).toBe(true)

    const calc = calculateBill(bill)
    expect(calc.itemsTotal).toBe(0)
    expect(calc.billTotal).toBe(0)
    expect(calc.settlements).toEqual([])
  })

  it('supports backwards-compatible people generation with verified numbers', () => {
    const people = get50DummyPeople()
    expect(people).toHaveLength(4)
    expect(people.every((p) => p.isPhoneVerified === true && p.phone?.startsWith('+91'))).toBe(true)
  })

  it('searches people suggestions by name and verified phone number, returning only verified users', () => {
    // When typing 's', returns Sindhu and Smeety
    const sResults = searchPeopleSuggestions('s')
    expect(sResults.length).toBe(2)
    expect(sResults.map((p) => p.name)).toEqual(['Sindhu', 'Smeety'])

    // When typing 'j', returns Jibin Jijo and Jijo P George
    const jResults = searchPeopleSuggestions('j')
    expect(jResults.length).toBe(2)
    expect(jResults.map((p) => p.name)).toEqual(['Jibin Jijo', 'Jijo P George'])

    // When searching by phone digits e.g. '9207293021'
    const phoneResults = searchPeopleSuggestions('9207293021')
    expect(phoneResults.length).toBe(1)
    expect(phoneResults[0].name).toBe('Jibin Jijo')

    // Arbitrary unverified person e.g. 'Sachin' returns empty
    const unverifiedResults = searchPeopleSuggestions('Sachin')
    expect(unverifiedResults).toHaveLength(0)

    // Excludes names already in the bill
    const sample = DUMMY_PEOPLE_RAW[0]
    const excludedResults = searchPeopleSuggestions(sample.name, [sample.name])
    expect(excludedResults.some((p) => p.name === sample.name)).toBe(false)
  })
})
