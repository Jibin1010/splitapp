import { describe, it, expect, beforeEach } from 'vitest'
import {
  PhoneVerificationService,
} from '@/lib/phone-verification/service'
import { VerificationRepository } from '@/lib/phone-verification/repository'
import { resetRateLimits } from '@/lib/phone-verification/rate-limiter'

describe('Telegram 1-Tap SIM Verification Test Suite', () => {
  let service: PhoneVerificationService
  const botUsername = 'SplitAppTestBot'

  beforeEach(async () => {
    service = new PhoneVerificationService('919111222333', botUsername)
    resetRateLimits()
    await VerificationRepository.clearAll()
  })

  it('Vector 1: should generate secure challenge and Telegram deep-link', async () => {
    const result = await service.createChallenge({
      rawPhone: '+91 98765 43210',
      channel: 'telegram',
      clientIp: '192.168.1.50',
    })

    expect(result.success).toBe(true)
    expect(result.challengeId).toBeDefined()
    expect(result.channel).toBe('telegram')
    expect(result.e164).toBe('+919876543210')
    expect(result.telegramUrl).toBe(
      `https://t.me/${botUsername}?start=${result.challengeId}`
    )
  })

  it('Vector 2: should handle /start <challengeId> and link Telegram user ID', async () => {
    const created = await service.createChallenge({
      rawPhone: '+91 98765 43210',
      channel: 'telegram',
    })

    const telegramUserId = 55443322
    const update = {
      message: {
        message_id: 101,
        from: {
          id: telegramUserId,
          is_bot: false,
          first_name: 'Maya',
          username: 'mayatest',
        },
        chat: { id: telegramUserId, type: 'private' },
        text: `/start ${created.challengeId}`,
      },
    }

    const startResult = await service.processTelegramUpdate(update)
    expect(startResult.success).toBe(true)
    expect(startResult.action).toBe('START_COMMAND')
    expect(startResult.challengeId).toBe(created.challengeId)

    // Verify repository associated the Telegram user ID
    const pending = await VerificationRepository.findPendingChallengeByTelegramUser(telegramUserId)
    expect(pending).not.toBeNull()
    expect(pending?.id).toBe(created.challengeId)
    expect(pending?.telegramUserId).toBe(telegramUserId)
  })

  it('Vector 3: should verify successfully when Telegram shares verified matching contact', async () => {
    const created = await service.createChallenge({
      rawPhone: '+91 98765 43210',
      channel: 'telegram',
    })

    const telegramUserId = 77889900

    // Step 1: User starts bot
    await service.processTelegramUpdate({
      message: {
        message_id: 201,
        from: { id: telegramUserId, username: 'testuser' },
        chat: { id: telegramUserId },
        text: `/start ${created.challengeId}`,
      },
    })

    // Step 2: User taps "📱 Verify My Phone Number" (request_contact)
    const contactUpdate = {
      message: {
        message_id: 202,
        from: { id: telegramUserId, username: 'testuser' },
        chat: { id: telegramUserId },
        contact: {
          phone_number: '919876543210', // Telegram contact format
          first_name: 'Test',
          user_id: telegramUserId,       // Validates SIM belongs to this Telegram user
        },
      },
    }

    const verifyResult = await service.processTelegramUpdate(contactUpdate)
    expect(verifyResult.success).toBe(true)
    expect(verifyResult.action).toBe('PROCESSED_CONTACT')
    expect(verifyResult.status).toBe('VERIFIED')
    expect(verifyResult.matches).toBe(true)

    // Check challenge status
    const status = await service.checkStatus(created.challengeId!)
    expect(status.status).toBe('VERIFIED')
    expect(status.numbersMatch).toBe(true)
  })

  it('Vector 4: should reject spoofed contact card when contact.user_id does not match sender', async () => {
    const created = await service.createChallenge({
      rawPhone: '+91 98765 43210',
      channel: 'telegram',
    })

    const attackerUserId = 111111
    const victimUserId = 222222

    await service.processTelegramUpdate({
      message: {
        message_id: 301,
        from: { id: attackerUserId },
        chat: { id: attackerUserId },
        text: `/start ${created.challengeId}`,
      },
    })

    // Attacker manually picks someone else's contact card from phone book
    const spoofedUpdate = {
      message: {
        message_id: 302,
        from: { id: attackerUserId },
        chat: { id: attackerUserId },
        contact: {
          phone_number: '+919876543210',
          first_name: 'Victim',
          user_id: victimUserId, // MISMATCH with message.from.id!
        },
      },
    }

    const spoofResult = await service.processTelegramUpdate(spoofedUpdate)
    expect(spoofResult.success).toBe(false)
    expect(spoofResult.reason).toBe('CONTACT_USER_ID_MISMATCH')

    // Challenge should still be PENDING (not compromised)
    const status = await service.checkStatus(created.challengeId!)
    expect(status.status).toBe('PENDING')
  })

  it('Vector 5: should reject mismatch when actual Telegram SIM phone does not match entered phone', async () => {
    const created = await service.createChallenge({
      rawPhone: '+91 98765 43210',
      channel: 'telegram',
    })

    const telegramUserId = 333444

    await service.processTelegramUpdate({
      message: {
        message_id: 401,
        from: { id: telegramUserId },
        chat: { id: telegramUserId },
        text: `/start ${created.challengeId}`,
      },
    })

    // User's Telegram SIM phone is +91 99999 88888, which differs from claimed +91 98765 43210
    const mismatchUpdate = {
      message: {
        message_id: 402,
        from: { id: telegramUserId },
        chat: { id: telegramUserId },
        contact: {
          phone_number: '+919999988888',
          user_id: telegramUserId,
        },
      },
    }

    const mismatchResult = await service.processTelegramUpdate(mismatchUpdate)
    expect(mismatchResult.success).toBe(false)
    expect(mismatchResult.matches).toBe(false)
    expect(mismatchResult.status).toBe('MISMATCH_REJECTED')

    const status = await service.checkStatus(created.challengeId!)
    expect(status.status).toBe('MISMATCH_REJECTED')
    expect(status.numbersMatch).toBe(false)
    expect(status.attempts).toBe(1)
  })

  it('Vector 6: should enforce strict 3-attempt burn policy on repeated mismatches', async () => {
    const created = await service.createChallenge({
      rawPhone: '+91 98765 43210',
      channel: 'telegram',
    })

    const telegramUserId = 555666

    await service.processTelegramUpdate({
      message: {
        message_id: 501,
        from: { id: telegramUserId },
        chat: { id: telegramUserId },
        text: `/start ${created.challengeId}`,
      },
    })

    const makeWrongContact = (msgId: number) => ({
      message: {
        message_id: msgId,
        from: { id: telegramUserId },
        chat: { id: telegramUserId },
        contact: {
          phone_number: '+911111122222',
          user_id: telegramUserId,
        },
      },
    })

    // Attempt 1: Mismatch
    const res1 = await service.processTelegramUpdate(makeWrongContact(502))
    expect(res1.status).toBe('MISMATCH_REJECTED')

    // Attempt 2: Mismatch
    const res2 = await service.processTelegramUpdate(makeWrongContact(503))
    expect(res2.status).toBe('MISMATCH_REJECTED')

    // Attempt 3: Burn challenge!
    const res3 = await service.processTelegramUpdate(makeWrongContact(504))
    expect(res3.status).toBe('MAX_ATTEMPTS_EXCEEDED')

    const status = await service.checkStatus(created.challengeId!)
    expect(status.status).toBe('MAX_ATTEMPTS_EXCEEDED')
    expect(status.attempts).toBe(3)
  })

  it('Vector 7: should support testing simulation for match and mismatch', async () => {
    const created = await service.createChallenge({
      rawPhone: '+91 98765 43210',
      channel: 'telegram',
    })

    // Test match simulation
    const simMatch = await service.simulateTelegramContact({
      challengeId: created.challengeId!,
      simulateMismatch: false,
    })

    expect(simMatch.success).toBe(true)
    expect(simMatch.matches).toBe(true)
    expect(simMatch.status).toBe('VERIFIED')

    const verifiedStatus = await service.checkStatus(created.challengeId!)
    expect(verifiedStatus.status).toBe('VERIFIED')
  })
})
