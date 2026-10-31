import {
  generateChallengeId,
  generateSecureToken,
  hashToken,
  verifyToken,
} from './crypto'
import { arePhonesEqual, normalizePhoneNumber } from './phone'
import { checkRateLimit } from './rate-limiter'
import {
  ChallengeStatus,
  VerificationChallengeEntity,
  VerificationRepository,
  WebhookEventEntity,
} from './repository'

export interface CreateChallengeOptions {
  rawPhone: string
  clientIp?: string
  defaultCountryCode?: string
  userId?: string
}

export interface CreateChallengeResult {
  success: boolean
  challengeId?: string
  whatsappUrl?: string
  e164?: string
  expiresAt?: string
  error?: string
  rateLimitResetMs?: number
}

export interface ProcessWebhookResult {
  success: boolean
  status: 'VERIFIED' | 'REJECTED' | 'DUPLICATE' | 'IGNORED'
  reason?: string
  challengeId?: string
  phoneNumber?: string
}

const CHALLENGE_TTL_MS = 5 * 60 * 1000 // Strict 5-minute expiration
const IP_RATE_LIMIT = 10               // Max 10 challenges per 10 mins per IP
const IP_WINDOW_MS = 10 * 60 * 1000
const PHONE_RATE_LIMIT = 5             // Max 5 challenges per 1 hr per phone
const PHONE_WINDOW_MS = 60 * 60 * 1000

export class PhoneVerificationService {
  private businessNumber: string

  constructor(businessNumber?: string) {
    // Configurable registered business WhatsApp number
    const envNum =
      businessNumber ||
      process.env.WHATSAPP_BUSINESS_NUMBER ||
      process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER ||
      '919111222333'

    this.businessNumber = envNum.replace(/[^0-9]/g, '')
  }

  /**
   * Step 2: Creates a new cryptographic challenge for a phone number.
   */
  async createChallenge(options: CreateChallengeOptions): Promise<CreateChallengeResult> {
    const { rawPhone, clientIp, defaultCountryCode = '91', userId } = options

    // 1. Phone number validation and E.164 normalization
    const normalized = normalizePhoneNumber(rawPhone, defaultCountryCode)
    if (!normalized.isValid) {
      return {
        success: false,
        error: 'Invalid phone number. Please enter a valid international mobile number.',
      }
    }

    // 2. Anti-abuse Rate Limiting (per IP and per Phone)
    if (clientIp) {
      const ipLimit = checkRateLimit(`pv:ip:${clientIp}`, IP_RATE_LIMIT, IP_WINDOW_MS)
      if (!ipLimit.allowed) {
        return {
          success: false,
          error: 'Too many verification requests from your network. Please try again later.',
          rateLimitResetMs: ipLimit.resetMs,
        }
      }
    }

    const phoneLimit = checkRateLimit(
      `pv:phone:${normalized.e164}`,
      PHONE_RATE_LIMIT,
      PHONE_WINDOW_MS
    )
    if (!phoneLimit.allowed) {
      return {
        success: false,
        error: 'Too many verification attempts for this phone number. Please wait before retrying.',
        rateLimitResetMs: phoneLimit.resetMs,
      }
    }

    // 3. Concurrency policy: Cancel any existing active challenges for this phone
    await VerificationRepository.cancelActiveChallengesForPhone(normalized.e164)

    // 4. Generate 256-bit cryptographically secure token & unique challenge ID
    const challengeId = generateChallengeId()
    const secretToken = generateSecureToken()
    const tokenHash = hashToken(secretToken)

    const now = new Date()
    const expiresAt = new Date(now.getTime() + CHALLENGE_TTL_MS)

    const challengeEntity: VerificationChallengeEntity = {
      id: challengeId,
      userId: userId || null,
      phoneNumber: normalized.e164,
      tokenHash,
      status: 'PENDING',
      expiresAt,
      attempts: 0,
      verifiedAt: null,
      createdAt: now,
    }

    await VerificationRepository.createChallenge(challengeEntity)

    // 5. Build official WhatsApp URL with verification payload:
    // Format: VERIFY <CHALLENGE_ID> <SECRET_TOKEN>
    const message = `VERIFY ${challengeId} ${secretToken}`
    const whatsappUrl = `https://wa.me/${this.businessNumber}?text=${encodeURIComponent(message)}`

    return {
      success: true,
      challengeId,
      whatsappUrl,
      e164: normalized.e164,
      expiresAt: expiresAt.toISOString(),
    }
  }

  /**
   * Step 4 & 5: Processes incoming Meta webhook events with replay protection & token matching.
   */
  async processIncomingMessage(params: {
    whatsappMessageId: string
    senderNumber: string
    text: string
    rawPayload?: any
  }): Promise<ProcessWebhookResult> {
    const { whatsappMessageId, senderNumber, text, rawPayload = {} } = params

    // 1. Replay Protection: Check if this message was already processed
    if (await VerificationRepository.isMessageProcessed(whatsappMessageId)) {
      return {
        success: true,
        status: 'DUPLICATE',
        reason: 'Message was already processed previously (Idempotent response)',
      }
    }

    // 2. Parse command: Case-insensitive "VERIFY <CHALLENGE_ID> <SECRET_TOKEN>"
    const match = text.trim().match(/^VERIFY\s+([A-Za-z0-9_-]+)\s+([A-Fa-f0-9]{32,128})$/i)
    if (!match) {
      await VerificationRepository.recordWebhookEvent({
        id: generateChallengeId(),
        whatsappMessageId,
        senderNumber,
        rawPayload: JSON.stringify(rawPayload),
        processingStatus: 'IGNORED',
        receivedAt: new Date(),
      })
      return {
        success: false,
        status: 'IGNORED',
        reason: 'Message does not match expected VERIFY command format',
      }
    }

    const [, candidateChallengeId, candidateToken] = match

    // 3. Retrieve challenge
    const challenge = await VerificationRepository.findChallengeById(candidateChallengeId)
    if (!challenge) {
      await this.recordWebhookFailure(whatsappMessageId, senderNumber, rawPayload)
      return {
        success: false,
        status: 'REJECTED',
        reason: 'Challenge ID not found',
      }
    }

    // 4. Status Check
    if (challenge.status !== 'PENDING') {
      await this.recordWebhookFailure(whatsappMessageId, senderNumber, rawPayload)
      return {
        success: false,
        status: 'REJECTED',
        reason: `Challenge is already ${challenge.status.toLowerCase()}`,
        challengeId: challenge.id,
      }
    }

    // 5. Expiration Check
    if (new Date() > challenge.expiresAt) {
      await this.recordWebhookFailure(whatsappMessageId, senderNumber, rawPayload)
      return {
        success: false,
        status: 'REJECTED',
        reason: 'Challenge has expired',
        challengeId: challenge.id,
      }
    }

    // 6. Sender Phone Number Verification (Normalized E.164 equality)
    if (!arePhonesEqual(senderNumber, challenge.phoneNumber)) {
      await VerificationRepository.recordAttempt(challenge.id)
      await this.recordWebhookFailure(whatsappMessageId, senderNumber, rawPayload)
      return {
        success: false,
        status: 'REJECTED',
        reason: 'Sender WhatsApp number does not match challenge phone number',
        challengeId: challenge.id,
      }
    }

    // 7. Cryptographic Token Verification (HMAC-SHA256 Constant-Time Equality)
    const isTokenValid = verifyToken(candidateToken, challenge.tokenHash)
    if (!isTokenValid) {
      await VerificationRepository.recordAttempt(challenge.id)
      await this.recordWebhookFailure(whatsappMessageId, senderNumber, rawPayload)
      return {
        success: false,
        status: 'REJECTED',
        reason: 'Invalid secret verification token',
        challengeId: challenge.id,
      }
    }

    // 8. Atomic State Transition: Mark VERIFIED
    const verified = await VerificationRepository.atomicVerifyChallenge(challenge.id)
    if (!verified) {
      await this.recordWebhookFailure(whatsappMessageId, senderNumber, rawPayload)
      return {
        success: false,
        status: 'REJECTED',
        reason: 'Race condition: Challenge status altered during processing',
      }
    }

    // 9. Upsert verified user & record replay protection event
    await VerificationRepository.upsertVerifiedUser(challenge.phoneNumber)
    await VerificationRepository.recordWebhookEvent({
      id: generateChallengeId(),
      whatsappMessageId,
      senderNumber,
      rawPayload: JSON.stringify(rawPayload),
      processingStatus: 'PROCESSED',
      receivedAt: new Date(),
    })

    return {
      success: true,
      status: 'VERIFIED',
      challengeId: challenge.id,
      phoneNumber: challenge.phoneNumber,
    }
  }

  /**
   * Step 6: Checks verification status (polled by frontend or Flutter client).
   */
  async checkStatus(challengeId: string): Promise<{
    status: ChallengeStatus | 'NOT_FOUND'
    phoneNumber?: string
    verifiedAt?: string | null
    expiresAt?: string
  }> {
    const challenge = await VerificationRepository.findChallengeById(challengeId)
    if (!challenge) {
      return { status: 'NOT_FOUND' }
    }

    return {
      status: challenge.status,
      phoneNumber: challenge.phoneNumber,
      verifiedAt: challenge.verifiedAt?.toISOString() || null,
      expiresAt: challenge.expiresAt.toISOString(),
    }
  }

  async cancelChallenge(challengeId: string): Promise<boolean> {
    const challenge = await VerificationRepository.findChallengeById(challengeId)
    if (challenge && challenge.status === 'PENDING') {
      challenge.status = 'CANCELLED'
      await VerificationRepository.createChallenge(challenge)
      return true
    }
    return false
  }

  private async recordWebhookFailure(
    whatsappMessageId: string,
    senderNumber: string,
    rawPayload: any
  ): Promise<void> {
    await VerificationRepository.recordWebhookEvent({
      id: generateChallengeId(),
      whatsappMessageId,
      senderNumber,
      rawPayload: JSON.stringify(rawPayload),
      processingStatus: 'FAILED',
      receivedAt: new Date(),
    })
  }
}

// Singleton instance for use across API routes
export const phoneVerification = new PhoneVerificationService()

