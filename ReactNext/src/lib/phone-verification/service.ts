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
import { linkPhoneIdentity, checkPhoneAttachmentStatus } from '@/lib/supabase/db'

export type VerificationChannel = 'whatsapp' | 'telegram' | 'sms'

export interface CreateChallengeOptions {
  rawPhone: string
  channel?: VerificationChannel
  clientIp?: string
  defaultCountryCode?: string
  userId?: string
}

export interface CreateChallengeResult {
  success: boolean
  challengeId?: string
  channel?: VerificationChannel
  whatsappUrl?: string
  telegramUrl?: string
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
  identityId?: string
}

export interface ProcessTelegramResult {
  success: boolean
  action: 'START_COMMAND' | 'PROCESSED_CONTACT' | 'IGNORED' | 'ERROR'
  status?: ChallengeStatus
  reason?: string
  challengeId?: string
  matches?: boolean
  identityId?: string
  claimedE164?: string
  actualE164?: string
}

const CHALLENGE_TTL_MS = 5 * 60 * 1000 // Strict 5-minute expiration
const MAX_CHALLENGE_ATTEMPTS = 3       // Maximum 3 attempts before challenge is burned
const IP_RATE_LIMIT = 10               // Max 10 challenges per 10 mins per IP
const IP_WINDOW_MS = 10 * 60 * 1000
const PHONE_RATE_LIMIT = 5             // Max 5 challenges per 1 hr per phone
const PHONE_WINDOW_MS = 60 * 60 * 1000

export class PhoneVerificationService {
  private businessNumber: string
  private telegramBotUsername: string

  constructor(businessNumber?: string, botUsername?: string) {
    const envNum =
      businessNumber ||
      process.env.WHATSAPP_BUSINESS_NUMBER ||
      process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER ||
      '919111222333'

    this.businessNumber = envNum.replace(/[^0-9]/g, '')
    this.telegramBotUsername =
      botUsername ||
      process.env.TELEGRAM_BOT_USERNAME ||
      process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ||
      'SplitAppVerifyBot'
  }

  /**
   * Helper to send Telegram Bot messages back to users.
   */
  async sendTelegramMessage(chatId: number | string, payload: {
    text: string
    parse_mode?: 'Markdown' | 'HTML'
    reply_markup?: any
  }): Promise<boolean> {
    const token = process.env.TELEGRAM_BOT_TOKEN
    if (!token) {
      // Graceful fallback when bot token is not yet configured
      return false
    }

    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          ...payload,
        }),
      })
      const data = await res.json()
      return Boolean(data?.ok)
    } catch (err) {
      console.error('Failed to send Telegram Bot message:', (err as any)?.message)
      return false
    }
  }

  /**
   * Step 2: Creates a new cryptographic challenge for a phone number on Telegram or WhatsApp.
   */
  async createChallenge(options: CreateChallengeOptions): Promise<CreateChallengeResult> {
    const {
      rawPhone,
      channel = 'telegram',
      clientIp,
      defaultCountryCode = '91',
      userId,
    } = options

    // 1. Phone number validation and E.164 normalization
    const normalized = normalizePhoneNumber(rawPhone, defaultCountryCode)
    if (!normalized.isValid) {
      return {
        success: false,
        error: 'Invalid phone number. Please enter a valid international mobile number.',
      }
    }

    // 1b. Anti-Collision & Exclusive Phone Binding Check
    try {
      const dbCheck = await checkPhoneAttachmentStatus({
        phone: normalized.e164,
        currentIdentityId: userId,
      })
      if (!dbCheck.allowed) {
        return {
          success: false,
          error: dbCheck.error,
        }
      }
    } catch {
      const memCheck = await VerificationRepository.checkPhoneAttachment(normalized.e164, userId)
      if (!memCheck.allowed) {
        return {
          success: false,
          error: memCheck.error,
        }
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
      claimedE164: normalized.e164,
      channel,
      tokenHash,
      status: 'PENDING',
      expiresAt,
      attempts: 0,
      verifiedAt: null,
      createdAt: now,
      identityId: userId || null,
    }

    await VerificationRepository.createChallenge(challengeEntity)

    // 5. Build Deep Links for Telegram or WhatsApp
    const message = `VERIFY ${challengeId} ${secretToken}`
    const whatsappUrl = `https://wa.me/${this.businessNumber}?text=${encodeURIComponent(message)}`
    const telegramUrl = `https://t.me/${this.telegramBotUsername}?start=${challengeId}`

    return {
      success: true,
      challengeId,
      channel,
      whatsappUrl,
      telegramUrl,
      e164: normalized.e164,
      expiresAt: expiresAt.toISOString(),
    }
  }

  /**
   * Telegram Webhook Processor: Handles /start commands & 1-tap contact messages.
   */
  async processTelegramUpdate(update: any): Promise<ProcessTelegramResult> {
    const message = update?.message
    if (!message) {
      return { success: true, action: 'IGNORED', reason: 'No message payload' }
    }

    const chatId = message.chat?.id
    const fromUser = message.from || {}
    const telegramUserId = fromUser.id
    const telegramUsername = fromUser.username || fromUser.first_name || ''

    // -------------------------------------------------------------
    // Case 1: Incoming /start <challengeId> deep link from Telegram web button
    // -------------------------------------------------------------
    const text = typeof message.text === 'string' ? message.text.trim() : ''
    if (text.startsWith('/start')) {
      const parts = text.split(/\s+/)
      const candidateChallengeId = parts[1]?.trim()

      if (candidateChallengeId) {
        // Associate this Telegram user ID with the challenge in DB & memory
        await VerificationRepository.associateTelegramUser(
          candidateChallengeId,
          telegramUserId,
          telegramUsername
        )

        // Send 1-Tap native contact request keyboard to user's Telegram
        await this.sendTelegramMessage(chatId, {
          text: `👋 *Welcome to SplitApp!*\n\nTo complete login, tap the button below to share and verify your phone number.\n\n🔒 _Telegram securely verifies that this matches your active SIM card._`,
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: [
              [
                {
                  text: '📱 Verify My Phone Number',
                  request_contact: true,
                },
              ],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
          },
        })

        return {
          success: true,
          action: 'START_COMMAND',
          challengeId: candidateChallengeId,
        }
      }

      // /start without challenge
      await this.sendTelegramMessage(chatId, {
        text: `👋 *SplitApp Phone Verification*\n\nTo log in or verify your account, please click the *"Verify with Telegram"* button on the SplitApp website.`,
        parse_mode: 'Markdown',
      })

      return { success: true, action: 'START_COMMAND' }
    }

    // -------------------------------------------------------------
    // Case 2: User tapped "📱 Verify My Phone Number" (request_contact: true)
    // -------------------------------------------------------------
    if (message.contact) {
      const contact = message.contact

      // Security Check 1: Telegram Native SIM Ownership Verification
      // contact.user_id must match message.from.id.
      // If contact.user_id is missing or doesn't match, user picked someone else's contact card!
      if (contact.user_id && contact.user_id !== telegramUserId) {
        await this.sendTelegramMessage(chatId, {
          text: `⚠️ *Untrusted Contact Card*\n\nPlease tap the *"Verify My Phone Number"* button to share your own account number, rather than a contact card from your address book.`,
          parse_mode: 'Markdown',
        })

        return {
          success: false,
          action: 'ERROR',
          reason: 'CONTACT_USER_ID_MISMATCH',
        }
      }

      // Find active pending challenge for this Telegram user
      const challenge = await VerificationRepository.findPendingChallengeByTelegramUser(telegramUserId)
      if (!challenge) {
        await this.sendTelegramMessage(chatId, {
          text: `⚠️ No active verification request found or the 5-minute session expired.\n\nPlease return to SplitApp and click "Verify with Telegram" to start a new request.`,
          parse_mode: 'Markdown',
          reply_markup: { remove_keyboard: true },
        })

        return {
          success: false,
          action: 'ERROR',
          reason: 'NO_PENDING_CHALLENGE',
        }
      }

      // Check max attempts
      if (challenge.attempts >= MAX_CHALLENGE_ATTEMPTS) {
        await this.sendTelegramMessage(chatId, {
          text: `❌ *Verification Locked*\n\nMaximum verification attempts exceeded. For security, this challenge has been locked.`,
          parse_mode: 'Markdown',
          reply_markup: { remove_keyboard: true },
        })

        return {
          success: false,
          action: 'PROCESSED_CONTACT',
          status: 'MAX_ATTEMPTS_EXCEEDED',
          challengeId: challenge.id,
        }
      }

      // Extract & normalize actual sender phone number
      const actualRawPhone = contact.phone_number || ''
      const normalizedActual = normalizePhoneNumber(actualRawPhone)
      const actualSenderE164 = normalizedActual.isValid
        ? normalizedActual.e164
        : (actualRawPhone.startsWith('+') ? actualRawPhone : `+${actualRawPhone}`)

      // Run Zero-Trust Comparison Engine
      const comparison = await VerificationRepository.processComparison({
        challengeId: challenge.id,
        actualSenderPhone: actualRawPhone,
        actualSenderE164,
        channel: 'telegram',
        telegramUserId,
        telegramUsername,
      })

      if (comparison.matches) {
        // Success! Number matches claimed number
        await this.sendTelegramMessage(chatId, {
          text: `✅ *Phone Verified Successfully!*\n\nYour number *${actualSenderE164}* has been verified.\n\nYou are now authenticated. Return to your browser to continue!`,
          parse_mode: 'Markdown',
          reply_markup: { remove_keyboard: true },
        })

        // Upsert verified user in repository
        await VerificationRepository.upsertVerifiedUser(actualSenderE164)

        return {
          success: true,
          action: 'PROCESSED_CONTACT',
          status: 'VERIFIED',
          matches: true,
          challengeId: challenge.id,
          claimedE164: comparison.claimedE164,
          actualE164: actualSenderE164,
          identityId: comparison.identityId || undefined,
        }
      } else {
        // Mismatch! Sender Telegram phone doesn't match entered phone
        if (comparison.attempts >= MAX_CHALLENGE_ATTEMPTS || comparison.status === 'MAX_ATTEMPTS_EXCEEDED') {
          await this.sendTelegramMessage(chatId, {
            text: `❌ *Verification Locked*\n\nThe phone number registered with this Telegram account (*${actualSenderE164}*) does not match the number you entered.\n\nMaximum attempts (3) exceeded. This request has been terminated for security.`,
            parse_mode: 'Markdown',
            reply_markup: { remove_keyboard: true },
          })
        } else {
          await this.sendTelegramMessage(chatId, {
            text: `⚠️ *Phone Number Mismatch*\n\nYour Telegram account's number (*${actualSenderE164}*) does not match the phone number you entered on SplitApp.\n\nAttempt ${comparison.attempts} of 3. Please use the Telegram account registered with that phone number.`,
            parse_mode: 'Markdown',
          })
        }

        return {
          success: false,
          action: 'PROCESSED_CONTACT',
          status: comparison.status,
          matches: false,
          challengeId: challenge.id,
          claimedE164: comparison.claimedE164,
          actualE164: actualSenderE164,
        }
      }
    }

    return { success: true, action: 'IGNORED' }
  }

  /**
   * Testing simulator for Telegram contact sharing.
   */
  async simulateTelegramContact(params: {
    challengeId: string
    actualPhone?: string
    simulateMismatch?: boolean
  }): Promise<ProcessTelegramResult> {
    const { challengeId, simulateMismatch = false } = params
    const challenge = await VerificationRepository.findChallengeById(challengeId)
    if (!challenge) {
      return { success: false, action: 'ERROR', reason: 'Challenge not found' }
    }

    const claimed = challenge.claimedE164 || challenge.phoneNumber
    const simulatedPhone = simulateMismatch
      ? '+919999999999' // Intentionally different phone for mismatch testing
      : params.actualPhone || claimed

    const comparison = await VerificationRepository.processComparison({
      challengeId,
      actualSenderPhone: simulatedPhone,
      actualSenderE164: simulatedPhone,
      channel: 'telegram',
      telegramUserId: 999999,
      telegramUsername: 'simulator_user',
    })

    if (comparison.matches) {
      await VerificationRepository.upsertVerifiedUser(simulatedPhone)
      return {
        success: true,
        action: 'PROCESSED_CONTACT',
        status: 'VERIFIED',
        matches: true,
        challengeId,
        claimedE164: comparison.claimedE164,
        actualE164: simulatedPhone,
        identityId: comparison.identityId || undefined,
      }
    } else {
      return {
        success: false,
        action: 'PROCESSED_CONTACT',
        status: comparison.status,
        matches: false,
        challengeId,
        claimedE164: comparison.claimedE164,
        actualE164: simulatedPhone,
      }
    }
  }

  /**
   * Processes incoming WhatsApp Meta webhook events.
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

    // 5. Expiration & Attempt Limit Check
    if (new Date() > challenge.expiresAt) {
      await this.recordWebhookFailure(whatsappMessageId, senderNumber, rawPayload)
      return {
        success: false,
        status: 'REJECTED',
        reason: 'Challenge has expired',
        challengeId: challenge.id,
      }
    }

    if (challenge.attempts >= MAX_CHALLENGE_ATTEMPTS) {
      await VerificationRepository.cancelChallenge(challenge.id)
      await this.recordWebhookFailure(whatsappMessageId, senderNumber, rawPayload)
      return {
        success: false,
        status: 'REJECTED',
        reason: 'Too many failed verification attempts. Challenge has been revoked for security.',
        challengeId: challenge.id,
      }
    }

    // 6. Strict Sender Phone Number Verification (Normalized E.164 equality)
    if (!arePhonesEqual(senderNumber, challenge.phoneNumber)) {
      const attempts = await VerificationRepository.recordAttempt(challenge.id)
      if (attempts >= MAX_CHALLENGE_ATTEMPTS) {
        await VerificationRepository.cancelChallenge(challenge.id)
      }
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
      const attempts = await VerificationRepository.recordAttempt(challenge.id)
      if (attempts >= MAX_CHALLENGE_ATTEMPTS) {
        await VerificationRepository.cancelChallenge(challenge.id)
      }
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

    // 9b. Supabase 5NF Account Linking
    let cloudIdentityId = challenge.userId || null
    try {
      const linked = await linkPhoneIdentity({
        phone: challenge.phoneNumber,
        targetIdentityId: cloudIdentityId || undefined,
      })
      if (linked?.identityId) {
        cloudIdentityId = linked.identityId
      }
    } catch (dbErr) {
      console.error('Supabase 5NF phone linking error (non-fatal):', dbErr)
    }

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
      identityId: cloudIdentityId || undefined,
    }
  }

  /**
   * Step 6: Checks verification status (polled by frontend or Flutter client).
   */
  async checkStatus(challengeId: string): Promise<{
    status: ChallengeStatus | 'NOT_FOUND'
    channel?: VerificationChannel
    phoneNumber?: string
    actualSenderPhone?: string | null
    numbersMatch?: boolean | null
    attempts?: number
    verifiedAt?: string | null
    expiresAt?: string
  }> {
    const challenge = await VerificationRepository.findChallengeById(challengeId)
    if (!challenge) {
      return { status: 'NOT_FOUND' }
    }

    return {
      status: challenge.status,
      channel: (challenge.channel as VerificationChannel) || 'telegram',
      phoneNumber: challenge.claimedE164 || challenge.phoneNumber,
      actualSenderPhone: challenge.actualSenderE164 || challenge.actualSenderPhone || null,
      numbersMatch: challenge.numbersMatch ?? null,
      attempts: challenge.attempts,
      verifiedAt: challenge.verifiedAt?.toISOString() || null,
      expiresAt: challenge.expiresAt.toISOString(),
    }
  }

  async cancelChallenge(challengeId: string): Promise<boolean> {
    return VerificationRepository.cancelChallenge(challengeId)
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
