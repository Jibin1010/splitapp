// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/users/search/route'
import { NextRequest } from 'next/server'
import * as dbModule from '@/lib/supabase/db'

describe('GET /api/users/search - Strict Auth Protection & Link Closure', () => {
  it('1. should reject unauthenticated requests with 401 Unauthorized when no cookie or header is provided', async () => {
    const req = new NextRequest('http://localhost:3000/api/users/search?q=Maya')
    const res = await GET(req)
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.ok).toBe(false)
    expect(json.error).toMatch(/unauthorized/i)
    expect(json.results).toEqual([])
  })

  it('2. should reject invalid/expired token with 401 Unauthorized', async () => {
    const req = new NextRequest('http://localhost:3000/api/users/search?q=Maya', {
      headers: {
        authorization: 'Bearer invalid_or_expired_token_12345',
      },
    })
    const res = await GET(req)
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.ok).toBe(false)
    expect(json.error).toMatch(/unauthorized|expired|invalid/i)
  })

  it('3. should allow authenticated users with valid Bearer token and return search results', async () => {
    vi.spyOn(dbModule, 'verifyCloudSession').mockResolvedValueOnce({
      sessionId: 'test-session-id',
      identityId: 'test-identity-id',
      displayName: 'Verified User',
      localEmail: 'test@example.com',
      username: 'testuser',
      googleEmail: null,
      avatarUrl: null,
      role: 'member',
    } as any)

    const req = new NextRequest('http://localhost:3000/api/users/search?q=Maya', {
      headers: {
        authorization: 'Bearer valid_mock_session_token',
      },
    })
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.results.length).toBeGreaterThan(0)
    expect(json.results[0].name.toLowerCase()).toContain('maya')
  })

  it('4. should allow authenticated users with valid cloud_session cookie', async () => {
    vi.spyOn(dbModule, 'verifyCloudSession').mockResolvedValueOnce({
      sessionId: 'test-session-cookie',
      identityId: 'test-identity-cookie',
      displayName: 'Cookie User',
      localEmail: 'cookie@example.com',
      username: 'cookieuser',
      googleEmail: null,
      avatarUrl: null,
      role: 'member',
    } as any)

    const req = new NextRequest('http://localhost:3000/api/users/search?q=98200', {
      headers: {
        cookie: 'cloud_session=valid_session_cookie_token_abc',
      },
    })
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.results.length).toBeGreaterThan(0)
  })
})

