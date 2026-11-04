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

describe('1,000 Dummy People with Verified Phone Numbers Preset', () => {
  it('defines exactly 1,000 dummy people with unique names, photos, and verified E.164 phone numbers', () => {
    expect(DUMMY_PEOPLE_RAW).toHaveLength(1000)

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

    expect(names.size).toBe(1000)
    expect(phones.size).toBe(1000)
  })

  it('generates 1,000 Person objects with unique ids, verified numbers, and zero paid amounts', () => {
    const people = get1000DummyPeople()
    expect(people).toHaveLength(1000)

    const ids = new Set<string>()
    for (const person of people) {
      expect(person.id).toBeTruthy()
      expect(person.paidAmount).toBe(0)
      expect(person.photo).toBeDefined()
      expect(person.phone).toMatch(/^\+91[0-9]{10}$/)
      expect(person.isPhoneVerified).toBe(true)
      ids.add(person.id)
    }
    expect(ids.size).toBe(1000)
  })

  it('creates a clean bill with 0 items, 0 adjustments, and 1,000 people passing schema validation', () => {
    const bill = create1000PeopleBill('INR')
    expect(bill.items).toHaveLength(0)
    expect(bill.adjustments).toHaveLength(0)
    expect(bill.people).toHaveLength(1000)

    const parsed = billSchema.safeParse(bill)
    expect(parsed.success).toBe(true)

    const calc = calculateBill(bill)
    expect(calc.itemsTotal).toBe(0)
    expect(calc.billTotal).toBe(0)
    expect(calc.settlements).toEqual([])
  })

  it('supports backwards-compatible 50 people generation with verified numbers', () => {
    const people = get50DummyPeople()
    expect(people).toHaveLength(50)
    expect(people.every((p) => p.isPhoneVerified === true && p.phone?.startsWith('+91'))).toBe(true)
  })

  it('searches people suggestions by name and verified phone number', () => {
    // When typing 'a', returns verified suggestions
    const aResults = searchPeopleSuggestions('a')
    expect(aResults.length).toBeGreaterThan(0)
    expect(aResults[0].isPhoneVerified).toBe(true)
    expect(aResults[0].phone).toBeDefined()

    // When searching by phone digits e.g. '98200'
    const phoneResults = searchPeopleSuggestions('98200')
    expect(phoneResults.length).toBeGreaterThan(0)
    expect(phoneResults[0].phone).toContain('98200')

    // Excludes names already in the bill
    const sample = DUMMY_PEOPLE_RAW[0]
    const excludedResults = searchPeopleSuggestions(sample.name, [sample.name])
    expect(excludedResults.some((p) => p.name === sample.name)).toBe(false)
  })
})
