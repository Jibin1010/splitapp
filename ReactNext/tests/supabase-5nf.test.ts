import { describe, expect, it } from 'vitest'
import {
  authenticateGoogleUser,
  createCloudSession,
  getUnifiedIdentity,
  linkPhoneIdentity,
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

  it('5. should link Google OAuth account to an existing local password identity with matching email', async () => {
    const linkingId = Date.now().toString(36) + '_link'
    const linkEmail = `link_${linkingId}@splitapp.io`
    const linkUser = await registerLocalUser({
      username: `linkuser_${linkingId}`,
      email: linkEmail,
      password: 'StrongPassword456!',
      displayName: 'Link Local User',
    })

    // Sign in with Google using the same verified email
    const googleRes = await authenticateGoogleUser({
      googleSub: `sub_${linkingId}`,
      email: linkEmail,
      name: 'Google Name',
      avatarUrl: 'https://lh3.googleusercontent.com/avatar',
    })

    // Should automatically link to existing identity
    expect(googleRes.identityId).toBe(linkUser.identityId)
    expect(googleRes.isLinked).toBe(true)
    expect(googleRes.isNewUser).toBe(false)
  })

  it('6. should link WhatsApp phone to an existing identity and retrieve 5NF unified profile', async () => {
    const multiId = Date.now().toString(36) + '_multi'
    const multiUser = await registerLocalUser({
      username: `multi_${multiId}`,
      email: `multi_${multiId}@splitapp.io`,
      password: 'PassWord123!',
      displayName: 'Multi Auth User',
    })

    // Link WhatsApp phone to this identity
    const phone = `+9198${Math.floor(10000000 + Math.random() * 90000000)}`
    const phoneRes = await linkPhoneIdentity({
      phone,
      targetIdentityId: multiUser.identityId,
    })

    expect(phoneRes.identityId).toBe(multiUser.identityId)
    expect(phoneRes.isLinked).toBe(true)

    // Also link Google with explicit currentIdentityId
    const googleRes = await authenticateGoogleUser({
      googleSub: `google_multi_${multiId}`,
      email: `google_${multiId}@customdomain.com`,
      name: 'Google Persona',
      currentIdentityId: multiUser.identityId,
    })

    expect(googleRes.identityId).toBe(multiUser.identityId)
    expect(googleRes.isLinked).toBe(true)

    // Retrieve Unified 5NF Identity
    const unified = await getUnifiedIdentity(multiUser.identityId)
    expect(unified).toBeDefined()
    expect(unified.identityId).toBe(multiUser.identityId)
    expect(unified.authMethods).toContain('local_password')
    expect(unified.authMethods).toContain('google_oauth')
    expect(unified.authMethods).toContain('whatsapp_phone')
    expect(unified.credentials?.email).toBe(`multi_${multiId}@splitapp.io`)
    expect(unified.google?.email).toBe(`google_${multiId}@customdomain.com`)
    expect(unified.phone?.e164Phone).toBe(phone)
    // Verify password hash or salt is NEVER returned in the unified profile
    expect(unified.credentials.password_hash).toBeUndefined()
    expect(unified.credentials.password_salt).toBeUndefined()
  })

  it('7. should enforce bulletproof RLS: anon role is blocked with permission denied on credentials and oauth accounts', async () => {
    const { pool } = await import('@/lib/supabase/db')
    const client = await pool.connect()
    try {
      // 7.1 Verify local_credentials blocked
      let localBlocked = false
      try {
        await client.query('SET ROLE anon; SELECT * FROM public.local_credentials;')
      } catch (err: any) {
        localBlocked = err.message.includes('permission denied')
      } finally {
        await client.query('RESET ROLE;')
      }
      expect(localBlocked).toBe(true)

      // 7.2 Verify google_oauth_accounts blocked
      let googleBlocked = false
      try {
        await client.query('SET ROLE anon; SELECT * FROM public.google_oauth_accounts;')
      } catch (err: any) {
        googleBlocked = err.message.includes('permission denied')
      } finally {
        await client.query('RESET ROLE;')
      }
      expect(googleBlocked).toBe(true)

      // 7.3 Verify phone_whatsapp_identities blocked
      let phoneBlocked = false
      try {
        await client.query('SET ROLE anon; SELECT * FROM public.phone_whatsapp_identities;')
      } catch (err: any) {
        phoneBlocked = err.message.includes('permission denied')
      } finally {
        await client.query('RESET ROLE;')
      }
      expect(phoneBlocked).toBe(true)
    } finally {
      client.release()
    }
  })

  it('8. should support seamless auto-registration and linking when user presses login or register', async () => {
    const autoId = Date.now().toString(36) + '_auto'
    const autoEmail = `auto_${autoId}@splitapp.io`
    const autoPassword = 'AutoPassword987!'

    // First attempt to register
    const regRes = await registerLocalUser({
      username: `auto_${autoId}`,
      email: autoEmail,
      password: autoPassword,
      displayName: 'Auto User',
    })

    expect(regRes.identityId).toBeDefined()
    expect(regRes.email).toBe(autoEmail)

    // Second registration with same credentials succeeds and returns existing identity
    const regAgain = await registerLocalUser({
      username: `auto_${autoId}`,
      email: autoEmail,
      password: autoPassword,
    })

    expect(regAgain.identityId).toBe(regRes.identityId)
  })
})

