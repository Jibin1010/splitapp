import type { CurrencyCode, Paise } from '@/types/split'

export const CURRENCY_META: Record<CurrencyCode, { symbol: string; locale: string; label: string }> = {
  INR: { symbol: '₹', locale: 'en-IN', label: 'Indian Rupee (₹)' },
  USD: { symbol: '$', locale: 'en-US', label: 'US Dollar ($)' },
  EUR: { symbol: '€', locale: 'de-DE', label: 'Euro (€)' },
  GBP: { symbol: '£', locale: 'en-GB', label: 'British Pound (£)' },
}

/** Keep intermediate arithmetic comfortably within Number.MAX_SAFE_INTEGER. */
export const MAX_MONEY = Number.MAX_SAFE_INTEGER / 2

/**
 * Parse a user-entered amount into integer paise.
 * Accepts forms like "450", "450.00", "450.5", "1,234.50", "₹450".
 * Returns null when the input cannot be interpreted as an amount.
 */
export function parseAmount(input: string | number): Paise | null {
  if (typeof input === 'number') {
    if (!Number.isFinite(input)) return null
    const paise = Math.round(input * 100)
    return Math.abs(paise) <= MAX_MONEY ? paise : null
  }
  let cleaned = input.trim().replace(/[₹$€£,\s]/g, '')
  if (cleaned === '') return null
  if (cleaned === '-' || cleaned === '+') return null
  if (!/^[+-]?\d*(?:\.\d*)?$/.test(cleaned)) return null
  const value = Number(cleaned)
  if (!Number.isFinite(value)) return null
  const paise = Math.round(value * 100)
  if (Math.abs(paise) > MAX_MONEY) return null
  return paise
}

/** Format paise as a currency string, e.g. 246000 -> "₹2,460.00". */
export function formatMoney(paise: Paise, currency: CurrencyCode = 'INR'): string {
  const meta = CURRENCY_META[currency] ?? CURRENCY_META.INR
  const formatted = new Intl.NumberFormat(meta.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(paise) / 100)
  const sign = paise < 0 ? '-' : ''
  return `${sign}${meta.symbol}${formatted}`
}

/** Plain decimal string for inputs, e.g. 45000 -> "450.00". */
export function amountToInputString(paise: Paise): string {
  return ((paise < 0 ? -paise : paise) / 100).toFixed(2)
}

/**
 * Split an integer amount as evenly as possible across `parts` buckets.
 * The first (total % parts) buckets receive one extra unit, so the result
 * always sums to exactly `total` — no paisa is ever lost.
 */
export function distributeEvenly(total: number, parts: number): number[] {
  if (parts <= 0) return []
  const safeTotal = Math.trunc(total)
  const base = Math.floor(safeTotal / parts)
  const remainder = safeTotal - base * parts
  return Array.from({ length: parts }, (_, i) => base + (i < remainder ? 1 : 0))
}

/**
 * Allocate `total` across buckets proportionally to integer `weights`
 * using the largest-remainder method. Ties break toward the lower index,
 * so results are fully deterministic and sum to exactly `total`.
 */
export function allocateProportionally(total: number, weights: number[]): number[] {
  const n = weights.length
  if (n === 0) return []
  const safeTotal = Math.trunc(total)
  const clamped = weights.map((w) => (Number.isFinite(w) && w > 0 ? w : 0))
  const weightSum = clamped.reduce((a, b) => a + b, 0)
  if (weightSum === 0) {
    if (safeTotal === 0) return clamped.map(() => 0)
    throw new Error('Cannot allocate a non-zero amount across zero total weight.')
  }
  const exact = clamped.map((w) => (safeTotal * w) / weightSum)
  const floors = exact.map((x) => Math.floor(x))
  let remainder = safeTotal - floors.reduce((a, b) => a + b, 0)
  // Order by largest fractional part, ties by lower index (deterministic).
  const order = exact
    .map((x, i) => ({ i, frac: x - Math.floor(x), weight: clamped[i] }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i)
  const result = [...floors]
  for (const { i, weight } of order) {
    if (remainder <= 0) break
    if (weight <= 0) continue
    result[i] += 1
    remainder -= 1
  }
  if (remainder !== 0) {
    throw new Error(`Money integrity violation: ${remainder} units could not be allocated.`)
  }
  return result
}
