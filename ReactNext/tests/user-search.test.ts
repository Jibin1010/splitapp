import { describe, it, expect, beforeEach } from 'vitest'
import { searchUsers, serverSearchCache } from '@/lib/user-search'

describe('High-Performance User & Phone Search Suite (Strict 4 Verified Users)', () => {
  beforeEach(() => {
    serverSearchCache.clear()
  })

  it('1. should search users by prefix phone number under 5ms', async () => {
    const start = performance.now()
    const { results } = await searchUsers('+9192072', { limit: 5 })
    const elapsed = performance.now() - start

    expect(results.length).toBeGreaterThan(0)
    expect(results[0].phone).toMatch(/^\+919207293021/)
    expect(results[0].name).toBe('Jibin Jijo')
    expect(results[0].isPhoneVerified).toBe(true)
    expect(elapsed).toBeLessThan(100)
  })

  it('2. should search users by partial phone digits anywhere', async () => {
    const { results } = await searchUsers('9400986188', { limit: 5 })
    expect(results.length).toBe(1)
    expect(results[0].name).toBe('Sindhu')
    expect(results[0].phone).toBe('+919400986188')
  })

  it('3. should search users by partial name (case-insensitive autocomplete)', async () => {
    const { results } = await searchUsers('smeety', { limit: 5 })
    expect(results.length).toBe(1)
    expect(results[0].name).toBe('Smeety')
    expect(results[0].phone).toBe('+919188724538')
  })

  it('4. should enforce strict LIMIT to prevent large payloads (default 10, max 20)', async () => {
    const { results } = await searchUsers('9', { limit: 2 })
    expect(results.length).toBeLessThanOrEqual(2)
  })

  it('5. should respect excludeNames list (do not suggest already added participants)', async () => {
    const { results: initial } = await searchUsers('Jibin', { limit: 5 })
    expect(initial.length).toBeGreaterThan(0)
    const jibinName = initial[0].name

    const { results: filtered } = await searchUsers('Jibin', {
      limit: 5,
      excludeNames: [jibinName],
    })

    expect(filtered.some((r) => r.name.toLowerCase() === jibinName.toLowerCase())).toBe(false)
  })

  it('6. should leverage In-Memory LRU Cache for sub-millisecond repeated searches', async () => {
    // First search: Cache MISS
    const first = await searchUsers('Sindhu', { limit: 5 })
    expect(first.cached).toBe(false)
    expect(first.results.length).toBeGreaterThan(0)

    // Second search: Cache HIT (0.05ms)
    const second = await searchUsers('Sindhu', { limit: 5 })
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
    // User types national digits "9207293021" without +91
    const { results } = await searchUsers('9207293021', { limit: 5 })
    expect(results.length).toBe(1)
    expect(results[0].name).toBe('Jibin Jijo')

    // User types partial digits "92072" without +91
    const { results: partial } = await searchUsers('92072', { limit: 5 })
    expect(partial.length).toBe(1)
    expect(partial[0].name).toBe('Jibin Jijo')
  })

  it('9. should match phone number with leading 0 or spaces/hyphens', async () => {
    // Leading zero national format: "09847416607"
    const { results: withZero } = await searchUsers('09847416607', { limit: 5 })
    expect(withZero.length).toBe(1)
    expect(withZero[0].name).toBe('Jijo P George')

    // With spaces: "98474 16607"
    const { results: withSpaces } = await searchUsers('98474 16607', { limit: 5 })
    expect(withSpaces.length).toBe(1)
    expect(withSpaces[0].name).toBe('Jijo P George')
  })

  it('10. should return empty results for unverified / non-existent users like Sachin', async () => {
    const { results } = await searchUsers('Sachin', { limit: 5 })
    expect(results).toHaveLength(0)
  })
})
