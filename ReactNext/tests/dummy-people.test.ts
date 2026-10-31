import { describe, expect, it } from 'vitest'
import { create50PeopleBill, DUMMY_PEOPLE_RAW, get50DummyPeople } from '@/lib/dummy-people'
import { billSchema } from '@/lib/validation'
import { calculateBill } from '@/lib/calculations'

describe('50 dummy people preset', () => {
  it('defines exactly 50 dummy people with unique names and photo URLs', () => {
    expect(DUMMY_PEOPLE_RAW).toHaveLength(50)

    const names = new Set<string>()
    for (const person of DUMMY_PEOPLE_RAW) {
      expect(person.name.trim().length).toBeGreaterThan(0)
      expect(person.photo).toMatch(/^https?:\/\//)
      names.add(person.name.toLowerCase())
    }
    expect(names.size).toBe(50)
  })

  it('generates 50 Person objects with unique ids and zero paid amounts', () => {
    const people = get50DummyPeople()
    expect(people).toHaveLength(50)

    const ids = new Set<string>()
    for (const person of people) {
      expect(person.id).toBeTruthy()
      expect(person.paidAmount).toBe(0)
      expect(person.photo).toBeDefined()
      ids.add(person.id)
    }
    expect(ids.size).toBe(50)
  })

  it('creates a clean bill with 0 items, 0 adjustments, and 50 people passing schema validation', () => {
    const bill = create50PeopleBill('INR')
    expect(bill.items).toHaveLength(0)
    expect(bill.adjustments).toHaveLength(0)
    expect(bill.people).toHaveLength(50)

    const parsed = billSchema.safeParse(bill)
    expect(parsed.success).toBe(true)

    const calc = calculateBill(bill)
    expect(calc.itemsTotal).toBe(0)
    expect(calc.billTotal).toBe(0)
    expect(calc.settlements).toEqual([])
  })

  it('searches people suggestions when pressing letters', async () => {
    const { searchPeopleSuggestions } = await import('@/lib/dummy-people')
    // When typing 'a', returns names like Alok Mishra, Aarav Patel, etc.
    const aResults = searchPeopleSuggestions('a')
    expect(aResults.length).toBeGreaterThan(0)
    expect(aResults.some((p) => p.name.toLowerCase().includes('alok'))).toBe(true)

    // When typing 'alok', finds Alok Mishra
    const alokResults = searchPeopleSuggestions('alok')
    expect(alokResults.length).toBeGreaterThan(0)
    expect(alokResults[0].name).toContain('Alok')

    // Excludes names already in the bill
    const excludedResults = searchPeopleSuggestions('alok', ['Alok Mishra'])
    expect(excludedResults.some((p) => p.name === 'Alok Mishra')).toBe(false)
  })
})
