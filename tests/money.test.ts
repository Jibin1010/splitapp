import { describe, expect, it } from 'vitest'
import { allocateProportionally, amountToInputString, distributeEvenly, formatMoney, parseAmount } from '@/lib/money'

describe('parseAmount', () => {
  it('parses plain amounts into integer paise', () => {
    expect(parseAmount('450')).toBe(45000)
    expect(parseAmount('450.00')).toBe(45000)
    expect(parseAmount('450.5')).toBe(45050)
    expect(parseAmount('0.01')).toBe(1)
  })

  it('accepts currency symbols, commas and whitespace', () => {
    expect(parseAmount('₹450')).toBe(45000)
    expect(parseAmount('1,234.50')).toBe(123450)
    expect(parseAmount(' 99 ')).toBe(9900)
  })

  it('accepts numbers and rounds to two decimals', () => {
    expect(parseAmount(450)).toBe(45000)
    expect(parseAmount(12.345)).toBe(1235)
  })

  it('rejects invalid input with null', () => {
    expect(parseAmount('')).toBeNull()
    expect(parseAmount('abc')).toBeNull()
    expect(parseAmount('12.34.56')).toBeNull()
    expect(parseAmount('-')).toBeNull()
    expect(parseAmount('1e5')).toBeNull()
  })

  it('supports negative amounts from strings only when well-formed', () => {
    expect(parseAmount('-5')).toBe(-500)
    expect(parseAmount('+5')).toBe(500)
  })
})

describe('formatMoney', () => {
  it('formats paise as currency', () => {
    expect(formatMoney(246000, 'INR')).toBe('₹2,460.00')
    expect(formatMoney(45050, 'INR')).toBe('₹450.50')
    expect(formatMoney(100, 'INR')).toBe('₹1.00')
  })

  it('handles negatives and other currencies', () => {
    expect(formatMoney(-61000, 'INR')).toBe('-₹610.00')
    expect(formatMoney(123456, 'USD')).toBe('$1,234.56')
  })
})

describe('amountToInputString', () => {
  it('renders plain decimal strings for inputs', () => {
    expect(amountToInputString(45000)).toBe('450.00')
    expect(amountToInputString(0)).toBe('0.00')
  })
})

describe('distributeEvenly', () => {
  it('never loses a paisa: ₹100 across three people', () => {
    const parts = distributeEvenly(10000, 3)
    expect(parts.reduce((a, b) => a + b, 0)).toBe(10000)
    expect(parts).toEqual([3334, 3333, 3333])
  })

  it('is exact when the amount divides cleanly', () => {
    expect(distributeEvenly(90000, 2)).toEqual([45000, 45000])
  })

  it('handles zero and single participants', () => {
    expect(distributeEvenly(0, 4)).toEqual([0, 0, 0, 0])
    expect(distributeEvenly(999, 1)).toEqual([999])
  })

  it('returns an empty array for zero participants', () => {
    expect(distributeEvenly(500, 0)).toEqual([])
  })
})

describe('allocateProportionally', () => {
  it('splits proportionally and preserves the exact total', () => {
    // 60% / 40% of ₹1,000
    const parts = allocateProportionally(100000, [6000, 4000])
    expect(parts).toEqual([60000, 40000])
  })

  it('uses largest remainder so the total is exact for awkward ratios', () => {
    const parts = allocateProportionally(10000, [1, 1, 1])
    expect(parts.reduce((a, b) => a + b, 0)).toBe(10000)
    expect(new Set(parts).size).toBeLessThanOrEqual(2)
  })

  it('gives zero-weight participants nothing', () => {
    const parts = allocateProportionally(10000, [5000, 0, 5000])
    expect(parts[1]).toBe(0)
    expect(parts.reduce((a, b) => a + b, 0)).toBe(10000)
  })

  it('is deterministic for identical inputs', () => {
    expect(allocateProportionally(73333, [3, 7, 11])).toEqual(allocateProportionally(73333, [3, 7, 11]))
  })
})
