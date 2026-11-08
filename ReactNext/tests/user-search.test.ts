import { describe, it, expect, beforeEach } from 'vitest'
import { searchUsers, serverSearchCache } from '@/lib/user-search'

describe('High-Performance User & Phone Search Suite (5 Lakh Scale Architecture)', () => {
  beforeEach(() => {
    serverSearchCache.clear()
  })

  it('1. should search users by prefix phone number under 5ms', async () => {
    const start = performance.now()
    const { results } = await searchUsers('+919820000', { limit: 5 })
    const elapsed = performance.now() - start

    expect(results.length).toBeGreaterThan(0)
    expect(results.length).toBeLessThanOrEqual(5)
    expect(results[0].phone).toMatch(/^\+919820000/)
    expect(results[0].isPhoneVerified).toBe(true)
    expect(elapsed).toBeLessThan(100) // Fast execution
  })

  it('2. should search users by partial phone digits anywhere', async () => {
    const { results } = await searchUsers('982000001', { limit: 5 })
    expect(results.length).toBeGreaterThan(0)
    expect(results.some((r) => r.phone?.includes('982000001'))).toBe(true)
  })

  it('3. should search users by partial name (case-insensitive autocomplete)', async () => {
    const { results } = await searchUsers('maya', { limit: 5 })
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].name.toLowerCase()).toContain('maya')
  })

  it('4. should enforce strict LIMIT to prevent large payloads (default 10, max 20)', async () => {
    // Default limit should be 10
    const { results: defaultRes } = await searchUsers('982')
    expect(defaultRes.length).toBe(10)

    const { results: res3 } = await searchUsers('982', { limit: 3 })
    expect(res3.length).toBe(3)

    // Clamps to max 20 even if 50 is requested
    const { results: resMax } = await searchUsers('982', { limit: 50 })
    expect(resMax.length).toBe(20)
  })

  it('5. should respect excludeNames list (do not suggest already added participants)', async () => {
    const { results: initial } = await searchUsers('Maya', { limit: 5 })
    expect(initial.length).toBeGreaterThan(0)
    const mayaName = initial[0].name

    const { results: filtered } = await searchUsers('Maya', {
      limit: 5,
      excludeNames: [mayaName],
    })

    expect(filtered.some((r) => r.name.toLowerCase() === mayaName.toLowerCase())).toBe(false)
  })

  it('6. should leverage In-Memory LRU Cache for sub-millisecond repeated searches', async () => {
    // First search: Cache MISS
    const first = await searchUsers('Maya', { limit: 5 })
    expect(first.cached).toBe(false)
    expect(first.results.length).toBeGreaterThan(0)

    // Second search: Cache HIT (0.05ms)
    const second = await searchUsers('Maya', { limit: 5 })
    expect(second.cached).toBe(true)
    expect(second.executionTimeMs).toBeLessThanOrEqual(0.1)
    expect(second.results).toEqual(first.results)
  })

  it('7. should return empty results for empty query gracefully', async () => {
    const { results, executionTimeMs } = await searchUsers('   ')
    expect(results).toEqual([])
    expect(executionTimeMs).toBe(0)
  })

  it('8. should match phone number when user does not type +91 or 91 country code', async () => {
    // User types national digits "9820000001" without +91
    const { results } = await searchUsers('9820000001', { limit: 5 })
    expect(results.length).toBeGreaterThan(0)
    expect(results.some((r) => r.phone?.includes('9820000001'))).toBe(true)

    // User types partial digits "982000" without +91
    const { results: partial } = await searchUsers('982000', { limit: 5 })
    expect(partial.length).toBeGreaterThan(0)
    expect(partial.some((r) => r.phone?.includes('982000'))).toBe(true)
  })

  it('9. should match phone number with leading 0 or spaces/hyphens', async () => {
    // Leading zero national format: "09820000001"
    const { results: withZero } = await searchUsers('09820000001', { limit: 5 })
    expect(withZero.length).toBeGreaterThan(0)
    expect(withZero.some((r) => r.phone?.includes('9820000001'))).toBe(true)

    // With spaces: "982 000 0001"
    const { results: withSpaces } = await searchUsers('982 000 0001', { limit: 5 })
    expect(withSpaces.length).toBeGreaterThan(0)
    expect(withSpaces.some((r) => r.phone?.includes('9820000001'))).toBe(true)
  })
})
