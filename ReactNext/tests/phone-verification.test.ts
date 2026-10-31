import { beforeEach, describe, expect, it } from 'vitest'
import {
  generateChallengeId,
  generateSecureToken,
  hashToken,
  verifyMetaWebhookSignature,
  verifyToken,
} from '@/lib/phone-verification/crypto'
import { arePhonesEqual, normalizePhoneNumber } from '@/lib/phone-verification/phone'
import { checkRateLimit, resetRateLimits } from '@/lib/phone-verification/rate-limiter'
import { VerificationRepository } from '@/lib/phone-verification/repository'
import { PhoneVerificationService } from '@/lib/phone-verification/service'
import crypto from 'crypto'

describe('WhatsApp Phone Verification Architecture Test Suite', () => {
  let service: PhoneVerificationService

  beforeEach(async () => {
    service = new PhoneVerificationService('919111222333')
    resetRateLimits()
    await VerificationRepository.clearAll()
  })

  // =========================================================================
  // Vector 1: Valid Phone & Valid Token -> VERIFIED
  // =========================================================================
  it('Vector 1: should successfully verify a challenge when phone and token match exactly', async () => {
    const rawPhone = '+91 98765 43210'
    const challengeRes = await service.createChallenge({
      rawPhone,
      clientIp: '127.0.0.1',
    })

    expect(challengeRes.success).toBe(true)
    expect(challengeRes.challengeId).toBeDefined()
    expect(challengeRes.whatsappUrl).toContain('https://wa.me/919111222333?text=')

    // Parse the message sent to WhatsApp
    const url = new URL(challengeRes.whatsappUrl!)
    const messageText = url.searchParams.get('text')!
    expect(messageText).toMatch(/^VERIFY\s+[A-Za-z0-9_-]+\s+[a-f0-9]{64}$/)

    // Simulate incoming Meta webhook
    const webhookRes = await service.processIncomingMessage({
      whatsappMessageId: 'wam_msg_001',
      senderNumber: '919876543210',
      text: messageText,
    })

    expect(webhookRes.success).toBe(true)
    expect(webhookRes.status).toBe('VERIFIED')
    expect(webhookRes.phoneNumber).toBe('+919876543210')

    // Check status via checkStatus endpoint query
    const status = await service.checkStatus(challengeRes.challengeId!)
    expect(status.status).toBe('VERIFIED')
    expect(status.verifiedAt).toBeTruthy()
  })

  // =========================================================================
  // Vector 2: Wrong Sender Phone -> REJECTED
  // =========================================================================
  it('Vector 2: should reject verification when sender phone does not match challenge phone', async () => {
    const challengeRes = await service.createChallenge({
      rawPhone: '+91 98765 43210',
      clientIp: '127.0.0.1',
    })

    const url = new URL(challengeRes.whatsappUrl!)
    const messageText = url.searchParams.get('text')!

    // Sender sends from a different phone number
    const webhookRes = await service.processIncomingMessage({
      whatsappMessageId: 'wam_msg_wrong_sender',
      senderNumber: '919999999999', // Different sender!
      text: messageText,
    })

    expect(webhookRes.success).toBe(false)
    expect(webhookRes.status).toBe('REJECTED')
    expect(webhookRes.reason).toContain('Sender WhatsApp number does not match')

    // Challenge should remain PENDING or increment attempts
    const status = await service.checkStatus(challengeRes.challengeId!)
    expect(status.status).toBe('PENDING')
  })

  // =========================================================================
  // Vector 3: Tampered or Invalid Token -> REJECTED
  // =========================================================================
  it('Vector 3: should reject tampered secret token via constant-time verification', async () => {
    const challengeRes = await service.createChallenge({
      rawPhone: '+91 98765 43210',
      clientIp: '127.0.0.1',
    })

    const fakeToken = crypto.randomBytes(32).toString('hex')
    const tamperedMessage = `VERIFY ${challengeRes.challengeId} ${fakeToken}`

    const webhookRes = await service.processIncomingMessage({
      whatsappMessageId: 'wam_msg_tampered',
      senderNumber: '919876543210',
      text: tamperedMessage,
    })

    expect(webhookRes.success).toBe(false)
    expect(webhookRes.status).toBe('REJECTED')
    expect(webhookRes.reason).toContain('Invalid secret verification token')

    const status = await service.checkStatus(challengeRes.challengeId!)
    expect(status.status).toBe('PENDING')
  })

  // =========================================================================
  // Vector 4: Expired Challenge -> REJECTED
  // =========================================================================
  it('Vector 4: should reject verification after challenge expiration (5 min TTL)', async () => {
    const challengeRes = await service.createChallenge({
      rawPhone: '+91 98765 43210',
      clientIp: '127.0.0.1',
    })

    const url = new URL(challengeRes.whatsappUrl!)
    const messageText = url.searchParams.get('text')!

    // Force expiration in repository
    const challenge = await VerificationRepository.findChallengeById(challengeRes.challengeId!)
    if (challenge) {
      challenge.expiresAt = new Date(Date.now() - 1000) // Expired 1 second ago
      await VerificationRepository.createChallenge(challenge)
    }

    const webhookRes = await service.processIncomingMessage({
      whatsappMessageId: 'wam_msg_expired',
      senderNumber: '919876543210',
      text: messageText,
    })

    expect(webhookRes.success).toBe(false)
    expect(webhookRes.status).toBe('REJECTED')
    expect(webhookRes.reason).toContain('expired')
  })

  // =========================================================================
  // Vector 5: Token Re-use / Single-use Constraint -> REJECTED
  // =========================================================================
  it('Vector 5: should reject replay attempts of an already-verified challenge', async () => {
    const challengeRes = await service.createChallenge({
      rawPhone: '+91 98765 43210',
      clientIp: '127.0.0.1',
    })

    const url = new URL(challengeRes.whatsappUrl!)
    const messageText = url.searchParams.get('text')!

    // First attempt succeeds
    const firstAttempt = await service.processIncomingMessage({
      whatsappMessageId: 'wam_msg_first_use',
      senderNumber: '919876543210',
      text: messageText,
    })
    expect(firstAttempt.status).toBe('VERIFIED')

    // Second attempt with different message ID but same challenge/token
    const secondAttempt = await service.processIncomingMessage({
      whatsappMessageId: 'wam_msg_second_use',
      senderNumber: '919876543210',
      text: messageText,
    })

    expect(secondAttempt.success).toBe(false)
    expect(secondAttempt.status).toBe('REJECTED')
    expect(secondAttempt.reason).toContain('already verified')
  })

  // =========================================================================
  // Vector 6: Duplicate Webhook Event ID -> DUPLICATE (Idempotent)
  // =========================================================================
  it('Vector 6: should idempotently handle duplicate Meta webhook delivery', async () => {
    const challengeRes = await service.createChallenge({
      rawPhone: '+91 98765 43210',
      clientIp: '127.0.0.1',
    })

    const url = new URL(challengeRes.whatsappUrl!)
    const messageText = url.searchParams.get('text')!
    const msgId = 'meta_unique_msg_id_999'

    // First arrival
    const res1 = await service.processIncomingMessage({
      whatsappMessageId: msgId,
      senderNumber: '919876543210',
      text: messageText,
    })
    expect(res1.status).toBe('VERIFIED')

    // Exact duplicate delivery from Meta
    const res2 = await service.processIncomingMessage({
      whatsappMessageId: msgId,
      senderNumber: '919876543210',
      text: messageText,
    })

    expect(res2.success).toBe(true)
    expect(res2.status).toBe('DUPLICATE')
  })

  // =========================================================================
  // Vector 7: Meta HMAC-SHA256 Signature Verification
  // =========================================================================
  it('Vector 7: should validate Meta X-Hub-Signature-256 with timing-safe comparison', () => {
    const appSecret = 'my_secret_meta_app_key'
    const payload = JSON.stringify({ entry: [{ id: '12345' }] })

    // Compute legitimate HMAC
    const legitimateHmac = crypto.createHmac('sha256', appSecret).update(payload, 'utf8').digest('hex')
    const validHeader = `sha256=${legitimateHmac}`

    // Legitimate signature passes
    expect(verifyMetaWebhookSignature(payload, validHeader, appSecret)).toBe(true)

    // Tampered payload fails
    expect(verifyMetaWebhookSignature(payload + 'extra', validHeader, appSecret)).toBe(false)

    // Forged signature fails
    expect(verifyMetaWebhookSignature(payload, 'sha256=abcdef1234567890', appSecret)).toBe(false)

    // Missing header fails
    expect(verifyMetaWebhookSignature(payload, null, appSecret)).toBe(false)
  })

  // =========================================================================
  // Vector 8: Rate Limiting (IP and Phone Sliding-Window Protection)
  // =========================================================================
  it('Vector 8: should enforce sliding-window rate limits per IP and per Phone', () => {
    const testKey = 'test:rate:key'
    const limit = 3
    const windowMs = 5000

    expect(checkRateLimit(testKey, limit, windowMs).allowed).toBe(true)
    expect(checkRateLimit(testKey, limit, windowMs).allowed).toBe(true)
    expect(checkRateLimit(testKey, limit, windowMs).allowed).toBe(true)

    // 4th request exceeds limit
    const exceeded = checkRateLimit(testKey, limit, windowMs)
    expect(exceeded.allowed).toBe(false)
    expect(exceeded.remaining).toBe(0)
    expect(exceeded.resetMs).toBeGreaterThan(0)
  })

  // =========================================================================
  // Vector 9: Malformed Incoming Webhook Command -> IGNORED
  // =========================================================================
  it('Vector 9: should safely ignore non-verification chat messages without error', async () => {
    const randomMessages = [
      'Hello, what is your price?',
      'VERIFY',
      'verify only_id_without_token',
      'CAN YOU HELP ME',
    ]

    for (const msg of randomMessages) {
      const res = await service.processIncomingMessage({
        whatsappMessageId: `rand_${Math.random()}`,
        senderNumber: '919876543210',
        text: msg,
      })

      expect(res.success).toBe(false)
      expect(res.status).toBe('IGNORED')
    }
  })

  // =========================================================================
  // Vector 10: E.164 Phone Normalization Across Formats
  // =========================================================================
  it('Vector 10: should normalize diverse global phone formats to exact E.164', () => {
    // Leading zero in India
    const res1 = normalizePhoneNumber('09876543210', '91')
    expect(res1.isValid).toBe(true)
    expect(res1.e164).toBe('+919876543210')

    // Dashes, spaces and parenthesis
    const res2 = normalizePhoneNumber('+91 (987) 654-3210', '91')
    expect(res2.isValid).toBe(true)
    expect(res2.e164).toBe('+919876543210')

    // Already E.164 with country code
    const res3 = normalizePhoneNumber('919876543210', '91')
    expect(res3.isValid).toBe(true)
    expect(res3.e164).toBe('+919876543210')

    // US number
    const res4 = normalizePhoneNumber('415-555-2671', '1')
    expect(res4.isValid).toBe(true)
    expect(res4.e164).toBe('+14155552671')

    // Equivalence check
    expect(arePhonesEqual('+91 98765 43210', '919876543210')).toBe(true)
    expect(arePhonesEqual('09876543210', '+91 98765 43210')).toBe(true)
    expect(arePhonesEqual('+1 415 555 2671', '+1 415-555-2671')).toBe(true)
    expect(arePhonesEqual('+91 98765 43210', '+91 98765 43211')).toBe(false)
  })

  // =========================================================================
  // Vector 11: Cancellation & Status Lifecycle
  // =========================================================================
  it('Vector 11: should handle challenge cancellation correctly', async () => {
    const challengeRes = await service.createChallenge({
      rawPhone: '+91 98765 43210',
      clientIp: '127.0.0.1',
    })

    const cancelSuccess = await service.cancelChallenge(challengeRes.challengeId!)
    expect(cancelSuccess).toBe(true)

    const status = await service.checkStatus(challengeRes.challengeId!)
    expect(status.status).toBe('CANCELLED')

    // Incoming message for cancelled challenge is rejected
    const url = new URL(challengeRes.whatsappUrl!)
    const messageText = url.searchParams.get('text')!

    const webhookRes = await service.processIncomingMessage({
      whatsappMessageId: 'wam_msg_after_cancel',
      senderNumber: '919876543210',
      text: messageText,
    })

    expect(webhookRes.success).toBe(false)
    expect(webhookRes.status).toBe('REJECTED')
    expect(webhookRes.reason).toContain('cancelled')
  })
})

