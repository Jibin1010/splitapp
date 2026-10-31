import { describe, expect, it } from 'vitest'
import {
  authenticateGoogleUser,
  createCloudSession,
  loginLocalUser,
  registerLocalUser,
  revokeCloudSession,
  verifyCloudSession,
} from '@/lib/supabase/db'

describe('Supabase 5NF Authentication & Cloud Architecture', () => {
  const testId = Date.now().toString(36)
  const username = `testuser_${testId}`
  const email = `test_${testId}@splitapp.io`
  const password = 'SecurePassword123!'

  it('1. should register a new user in 5NF tables (identities, profiles, local_credentials, roles)', async () => {
    const user = await registerLocalUser({
      username,
      email,
      password,
      displayName: 'Test User 5NF',
    })

    expect(user.identityId).toBeDefined()
    expect(user.username).toBe(username)
    expect(user.email).toBe(email)
    expect(user.displayName).toBe('Test User 5NF')
  })

  it('2. should authenticate registered user with correct password and reject wrong password', async () => {
    // Valid login
    const validRes = await loginLocalUser(username, password)
    expect(validRes.success).toBe(true)
    expect(validRes.identity?.email).toBe(email)

    // Invalid login
    const invalidRes = await loginLocalUser(username, 'WrongPass123')
    expect(invalidRes.success).toBe(false)
    expect(invalidRes.error).toContain('Incorrect password')
  })

  it('3. should create, verify, and revoke cloud authoritative sessions', async () => {
    const loginRes = await loginLocalUser(username, password)
    expect(loginRes.success).toBe(true)

    const session = await createCloudSession(loginRes.identity!.id, '127.0.0.1', 'Vitest')
    expect(session.sessionToken).toBeDefined()

    // Verify session
    const verified = await verifyCloudSession(session.sessionToken)
    expect(verified).not.toBeNull()
    expect(verified?.identityId).toBe(loginRes.identity!.id)

    // Revoke session
    await revokeCloudSession(session.sessionToken)
    const revoked = await verifyCloudSession(session.sessionToken)
    expect(revoked).toBeNull()
  })

  it('4. should authenticate and upsert Google OAuth user in 5NF without duplication', async () => {
    const googleSub = `google_sub_${testId}`
    const googleEmail = `google_${testId}@gmail.com`

    // First login -> creates identity, profile, google_oauth_account
    const res1 = await authenticateGoogleUser({
      googleSub,
      email: googleEmail,
      name: 'Google User',
      avatarUrl: 'https://lh3.googleusercontent.com/a/test',
    })

    expect(res1.identityId).toBeDefined()
    expect(res1.isNewUser).toBe(true)
    expect(res1.email).toBe(googleEmail)

    // Subsequent login with updated profile -> updates existing record
    const res2 = await authenticateGoogleUser({
      googleSub,
      email: googleEmail,
      name: 'Google User Updated',
      avatarUrl: 'https://lh3.googleusercontent.com/a/test_updated',
    })

    expect(res2.identityId).toBe(res1.identityId) // Same identity!
    expect(res2.isNewUser).toBe(false)
    expect(res2.displayName).toBe('Google User Updated')
  })
})
