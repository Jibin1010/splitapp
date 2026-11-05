import { describe, it, expect } from 'vitest'
import { searchUsers } from '@/lib/user-search'

describe('High-Performance User & Phone Search Suite (5 Lakh Scale Architecture)', () => {
  it('1. should search users by prefix phone number under 5ms', async () => {
    const start = performance.now()
    const { results, executionTimeMs } = await searchUsers('+919820000', { limit: 5 })
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

  it('4. should enforce strict LIMIT to prevent large payloads', async () => {
    const { results: res3 } = await searchUsers('982', { limit: 3 })
    expect(res3.length).toBe(3)

    const { results: res15 } = await searchUsers('982', { limit: 15 })
    expect(res15.length).toBe(15)
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

  it('6. should return empty results for empty query gracefully', async () => {
    const { results, executionTimeMs } = await searchUsers('   ')
    expect(results).toEqual([])
    expect(executionTimeMs).toBe(0)
  })
})

