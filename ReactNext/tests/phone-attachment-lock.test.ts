import { describe, it, expect, beforeEach } from 'vitest'
import { PhoneVerificationService } from '@/lib/phone-verification/service'
import { VerificationRepository } from '@/lib/phone-verification/repository'
import { resetRateLimits } from '@/lib/phone-verification/rate-limiter'

describe('Phone Number Exclusive Binding & Settings Removal Test Suite', () => {
  let service: PhoneVerificationService

  beforeEach(async () => {
    service = new PhoneVerificationService('919111222333', 'SplitAppTestBot')
    resetRateLimits()
    await VerificationRepository.clearAll()
  })

  it('Rule 1 & 2: should attach a phone number to an account and stop another account from claiming it', async () => {
    const userAIdentityId = 'user_identity_A_google'
    const phone = '+919876543210'

    // Attach phone to User A
    await VerificationRepository.attachPhone(phone, userAIdentityId, {
      email: 'usera@gmail.com',
      provider: 'google',
    })

    // User A can verify their own number
    const checkUserA = await VerificationRepository.checkPhoneAttachment(phone, userAIdentityId)
    expect(checkUserA.allowed).toBe(true)

    // User B (another account) tries to attach User A's phone number -> STOPPED!
    const userBIdentityId = 'user_identity_B_email'
    const checkUserB = await VerificationRepository.checkPhoneAttachment(phone, userBIdentityId)
    expect(checkUserB.allowed).toBe(false)
    expect(checkUserB.error).toContain('already attached to another account')
    expect(checkUserB.error).toContain('Settings')

    // Challenge creation for User B with User A's phone is blocked
    const challengeResult = await service.createChallenge({
      rawPhone: phone,
      userId: userBIdentityId,
      channel: 'telegram',
    })
    expect(challengeResult.success).toBe(false)
    expect(challengeResult.error).toContain('already attached to another account')
  })

  it('Rule 3: should stop an account that already has an attached phone from attaching a second phone', async () => {
    const userIdentity = 'user_identity_alice'
    const existingPhone = '+919876543210'
    const secondPhone = '+919111122222'

    // Attach first phone to Alice
    await VerificationRepository.attachPhone(existingPhone, userIdentity, {
      email: 'alice@example.com',
      provider: 'email',
    })

    // Alice tries to attach a second different phone -> STOPPED!
    const checkSecond = await VerificationRepository.checkPhoneAttachment(secondPhone, userIdentity)
    expect(checkSecond.allowed).toBe(false)
    expect(checkSecond.error).toContain('already has phone number')
    expect(checkSecond.error).toContain(existingPhone)
    expect(checkSecond.error).toContain('Settings')

    // Challenge creation is blocked
    const challengeResult = await service.createChallenge({
      rawPhone: secondPhone,
      userId: userIdentity,
      channel: 'telegram',
    })
    expect(challengeResult.success).toBe(false)
    expect(challengeResult.error).toContain('already has phone number')
  })

  it('Rule 4: should stop unauthenticated phone login if the number is attached to a primary Google/Email account', async () => {
    const userGoogleId = 'user_google_123'
    const phone = '+919876543210'

    // User has a primary Google account with attached phone
    await VerificationRepository.attachPhone(phone, userGoogleId, {
      email: 'jibin@gmail.com',
      provider: 'google',
    })

    // An unauthenticated user tries to log in via phone using that number -> STOPPED!
    const checkUnauthenticated = await VerificationRepository.checkPhoneAttachment(phone, undefined)
    expect(checkUnauthenticated.allowed).toBe(false)
    expect(checkUnauthenticated.isBoundToPrimaryAccount).toBe(true)
    expect(checkUnauthenticated.primaryEmail).toBe('jibin@gmail.com')
    expect(checkUnauthenticated.error).toContain('Google account')
    expect(checkUnauthenticated.error).toContain('jibin@gmail.com')
    expect(checkUnauthenticated.error).toContain('Settings')

    // Challenge creation is blocked with explanatory error
    const challengeResult = await service.createChallenge({
      rawPhone: phone,
      channel: 'telegram',
    })
    expect(challengeResult.success).toBe(false)
    expect(challengeResult.error).toContain('Google account')
    expect(challengeResult.error).toContain('jibin@gmail.com')
  })

  it('Rule 5: should allow attaching a new number and freeing up the old number once removed from Settings', async () => {
    const userGoogleId = 'user_google_123'
    const phoneA = '+919876543210'
    const phoneB = '+919111122222'

    // User initially has Phone A attached
    await VerificationRepository.attachPhone(phoneA, userGoogleId, {
      email: 'jibin@gmail.com',
      provider: 'google',
    })

    // User removes Phone A from Settings
    const unlinked = await VerificationRepository.unlinkPhone(userGoogleId)
    expect(unlinked).toBe(phoneA)

    // Now, the user can attach Phone B!
    const checkPhoneB = await VerificationRepository.checkPhoneAttachment(phoneB, userGoogleId)
    expect(checkPhoneB.allowed).toBe(true)

    const attachBResult = await service.createChallenge({
      rawPhone: phoneB,
      userId: userGoogleId,
      channel: 'telegram',
    })
    expect(attachBResult.success).toBe(true)

    // And Phone A is now freed up for anyone else to claim or log in with!
    const checkPhoneAFreed = await VerificationRepository.checkPhoneAttachment(phoneA, undefined)
    expect(checkPhoneAFreed.allowed).toBe(true)
  })
})

