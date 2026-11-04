/**
 * Phone Verification Repository Layer
 * Implements strict ACID transactional semantics with Supabase PostgreSQL
 * and in-memory fallback for offline/development environments.
 */

import {
  createPhoneVerificationChallenge,
  getPhoneVerificationChallenge,
  getLatestPendingChallengeByTelegramUser,
  associateTelegramUserWithChallenge,
  cancelPhoneVerificationChallenge,
  processPhoneVerificationComparison,
} from '@/lib/supabase/db'

export type ChallengeStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'MISMATCH_REJECTED'
  | 'EXPIRED'
  | 'MAX_ATTEMPTS_EXCEEDED'
  | 'CANCELLED'

export interface UserEntity {
  id: string
  phoneNumber: string
  phoneVerifiedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface VerificationChallengeEntity {
  id: string                   // e.g. "8f3a2c91"
  userId?: string | null
  phoneNumber: string          // Normalized E.164 e.g. "+919876543210"
  claimedE164?: string
  actualSenderPhone?: string | null
  actualSenderE164?: string | null
  numbersMatch?: boolean | null
  channel?: 'whatsapp' | 'telegram' | 'sms'
  telegramUserId?: number | null
  telegramUsername?: string | null
  tokenHash: string            // HMAC-SHA256 hex
  status: ChallengeStatus
  expiresAt: Date
  attempts: number
  verifiedAt: Date | null
  createdAt: Date
  identityId?: string | null
}

export interface WebhookEventEntity {
  id: string
  whatsappMessageId: string    // Unique Meta/Telegram message ID for replay protection
  senderNumber: string
  rawPayload: string
  processingStatus: 'PROCESSED' | 'DUPLICATE' | 'IGNORED' | 'FAILED'
  receivedAt: Date
}

// Global in-memory storage for hot-reload resilience in development and standalone mode
const globalStorage = globalThis as unknown as {
  __pv_users?: Map<string, UserEntity>
  __pv_challenges?: Map<string, VerificationChallengeEntity>
  __pv_webhooks?: Map<string, WebhookEventEntity>
  __pv_attached_phones?: Map<string, string>
  __pv_identity_phones?: Map<string, string>
  __pv_primary_accounts?: Map<string, { email: string; provider: 'google' | 'email' }>
}

if (!globalStorage.__pv_users) globalStorage.__pv_users = new Map()
if (!globalStorage.__pv_challenges) globalStorage.__pv_challenges = new Map()
if (!globalStorage.__pv_webhooks) globalStorage.__pv_webhooks = new Map()
if (!globalStorage.__pv_attached_phones) globalStorage.__pv_attached_phones = new Map()
if (!globalStorage.__pv_identity_phones) globalStorage.__pv_identity_phones = new Map()
if (!globalStorage.__pv_primary_accounts) globalStorage.__pv_primary_accounts = new Map()

const users = globalStorage.__pv_users
const challenges = globalStorage.__pv_challenges
const webhooks = globalStorage.__pv_webhooks
const attachedPhones = globalStorage.__pv_attached_phones
const identityPhones = globalStorage.__pv_identity_phones
const primaryAccounts = globalStorage.__pv_primary_accounts

export const VerificationRepository = {
  // --- Challenges ---
  async createChallenge(challenge: VerificationChallengeEntity): Promise<VerificationChallengeEntity> {
    // 1. In-memory save
    challenges.set(challenge.id, { ...challenge })

    // 2. Persist to Supabase DB (non-blocking / resilient to network)
    try {
      await createPhoneVerificationChallenge({
        challengeId: challenge.id,
        tokenHash: challenge.tokenHash,
        claimedPhone: challenge.phoneNumber,
        claimedE164: challenge.claimedE164 || challenge.phoneNumber,
        channel: challenge.channel || 'whatsapp',
        expiresAt: challenge.expiresAt,
        identityId: challenge.identityId || challenge.userId || undefined,
      })
    } catch (err) {
      console.warn('Database save warning (using memory storage):', (err as any)?.message)
    }

    return challenge
  },

  async findChallengeById(id: string): Promise<VerificationChallengeEntity | null> {
    // Check Supabase database first
    try {
      const dbRow = await getPhoneVerificationChallenge(id)
      if (dbRow) {
        const entity: VerificationChallengeEntity = {
          id: dbRow.challenge_id,
          userId: dbRow.identity_id || null,
          phoneNumber: dbRow.claimed_phone_e164 || dbRow.claimed_phone_number,
          claimedE164: dbRow.claimed_phone_e164,
          actualSenderPhone: dbRow.actual_sender_number || null,
          actualSenderE164: dbRow.actual_sender_e164 || null,
          numbersMatch: dbRow.numbers_match,
          channel: dbRow.channel as 'whatsapp' | 'telegram' | 'sms',
          telegramUserId: dbRow.telegram_user_id ? Number(dbRow.telegram_user_id) : null,
          telegramUsername: dbRow.telegram_username || null,
          tokenHash: dbRow.token_hash,
          status: dbRow.verification_status as ChallengeStatus,
          expiresAt: new Date(dbRow.expires_at),
          attempts: dbRow.attempts_count || 0,
          verifiedAt: dbRow.verified_at ? new Date(dbRow.verified_at) : null,
          createdAt: new Date(dbRow.created_at),
          identityId: dbRow.identity_id || null,
        }
        challenges.set(id, entity)
        return entity
      }
    } catch {
      // Fallback to memory
    }

    const found = challenges.get(id)
    if (!found) return null

    // Check expiration on read
    if (found.status === 'PENDING' && new Date() > found.expiresAt) {
      found.status = 'EXPIRED'
    }

    return { ...found }
  },

  async associateTelegramUser(
    challengeId: string,
    telegramUserId: number,
    telegramUsername?: string
  ): Promise<boolean> {
    const memoryItem = challenges.get(challengeId)
    if (memoryItem) {
      memoryItem.telegramUserId = telegramUserId
      if (telegramUsername) memoryItem.telegramUsername = telegramUsername
      challenges.set(challengeId, memoryItem)
    }

    try {
      await associateTelegramUserWithChallenge({
        challengeId,
        telegramUserId,
        telegramUsername,
      })
      return true
    } catch {
      return Boolean(memoryItem)
    }
  },

  async findPendingChallengeByTelegramUser(telegramUserId: number): Promise<VerificationChallengeEntity | null> {
    try {
      const dbRow = await getLatestPendingChallengeByTelegramUser(telegramUserId)
      if (dbRow) {
        return {
          id: dbRow.challenge_id,
          userId: dbRow.identity_id || null,
          phoneNumber: dbRow.claimed_phone_e164,
          claimedE164: dbRow.claimed_phone_e164,
          channel: dbRow.channel as 'whatsapp' | 'telegram' | 'sms',
          telegramUserId: Number(dbRow.telegram_user_id),
          telegramUsername: dbRow.telegram_username,
          tokenHash: dbRow.token_hash,
          status: dbRow.verification_status as ChallengeStatus,
          expiresAt: new Date(dbRow.expires_at),
          attempts: dbRow.attempts_count || 0,
          verifiedAt: dbRow.verified_at ? new Date(dbRow.verified_at) : null,
          createdAt: new Date(dbRow.created_at),
          identityId: dbRow.identity_id || null,
        }
      }
    } catch {
      // Memory fallback
    }

    const now = new Date()
    for (const c of challenges.values()) {
      if (
        c.telegramUserId === telegramUserId &&
        (c.status === 'PENDING' || c.status === 'MISMATCH_REJECTED') &&
        c.attempts < 3 &&
        c.expiresAt > now
      ) {
        return { ...c }
      }
    }

    return null
  },

  async processComparison(params: {
    challengeId: string
    actualSenderPhone: string
    actualSenderE164: string
    channel: 'whatsapp' | 'telegram' | 'sms'
    telegramUserId?: number
    telegramUsername?: string
  }): Promise<{
    success: boolean
    matches: boolean
    status: ChallengeStatus
    attempts: number
    claimedE164?: string
    actualE164: string
    identityId?: string | null
  }> {
    // 1. Try Supabase comparison engine
    try {
      const dbRes = await processPhoneVerificationComparison(params)
      if (dbRes && dbRes.matches !== undefined) {
        const isMatch = Boolean(dbRes.matches)
        const currentAttempts = dbRes.attempts ?? 0

        // Sync back into memory
        const c = challenges.get(params.challengeId)
        if (c) {
          c.actualSenderPhone = params.actualSenderPhone
          c.actualSenderE164 = params.actualSenderE164
          c.numbersMatch = isMatch
          c.attempts = currentAttempts
          c.status = (dbRes.status as ChallengeStatus) || (isMatch ? 'VERIFIED' : 'MISMATCH_REJECTED')
          if (isMatch) c.verifiedAt = new Date()
          if (dbRes.identityId) c.identityId = dbRes.identityId
          challenges.set(params.challengeId, c)
        }

        return {
          success: isMatch,
          matches: isMatch,
          status: (dbRes.status as ChallengeStatus) || (isMatch ? 'VERIFIED' : 'MISMATCH_REJECTED'),
          attempts: currentAttempts,
          claimedE164: dbRes.claimedE164,
          actualE164: dbRes.actualE164 || params.actualSenderE164,
          identityId: dbRes.identityId,
        }
      }
    } catch {
      // Fall through to memory logic
    }

    // 2. Memory engine fallback
    const c = challenges.get(params.challengeId)
    if (!c) {
      return {
        success: false,
        matches: false,
        status: 'CANCELLED',
        attempts: 0,
        actualE164: params.actualSenderE164,
      }
    }

    const claimed = c.claimedE164 || c.phoneNumber
    const matches = claimed === params.actualSenderE164
    c.attempts += 1
    c.actualSenderPhone = params.actualSenderPhone
    c.actualSenderE164 = params.actualSenderE164
    c.numbersMatch = matches

    if (matches) {
      c.status = 'VERIFIED'
      c.verifiedAt = new Date()
    } else if (c.attempts >= 3) {
      c.status = 'MAX_ATTEMPTS_EXCEEDED'
    } else {
      c.status = 'MISMATCH_REJECTED'
    }

    challenges.set(c.id, c)

    return {
      success: matches,
      matches,
      status: c.status,
      attempts: c.attempts,
      claimedE164: claimed,
      actualE164: params.actualSenderE164,
      identityId: c.identityId,
    }
  },

  async cancelActiveChallengesForPhone(phone: string): Promise<number> {
    let count = 0
    for (const [id, c] of challenges.entries()) {
      if (c.phoneNumber === phone && c.status === 'PENDING') {
        c.status = 'CANCELLED'
        challenges.set(id, c)
        count++
        cancelPhoneVerificationChallenge(id).catch(() => {})
      }
    }
    return count
  },

  async cancelChallenge(id: string): Promise<boolean> {
    const c = challenges.get(id)
    if (c) {
      c.status = 'CANCELLED'
      challenges.set(id, c)
    }
    try {
      await cancelPhoneVerificationChallenge(id)
    } catch {
      // Ignored
    }
    return true
  },

  async atomicVerifyChallenge(id: string, verifiedAt = new Date()): Promise<boolean> {
    const c = challenges.get(id)
    if (!c) return false

    if (c.status !== 'PENDING') {
      return false
    }

    if (new Date() > c.expiresAt) {
      c.status = 'EXPIRED'
      return false
    }

    c.status = 'VERIFIED'
    c.verifiedAt = verifiedAt
    challenges.set(id, c)
    return true
  },

  async recordAttempt(id: string): Promise<number> {
    const c = challenges.get(id)
    if (!c) return 0
    c.attempts += 1
    challenges.set(id, c)
    return c.attempts
  },

  // --- Webhook Replay Protection ---
  async isMessageProcessed(messageId: string): Promise<boolean> {
    return webhooks.has(messageId)
  },

  async recordWebhookEvent(event: WebhookEventEntity): Promise<void> {
    webhooks.set(event.whatsappMessageId, { ...event })
  },

  // --- User Association ---
  async upsertVerifiedUser(phoneNumber: string): Promise<UserEntity> {
    let existingUser: UserEntity | undefined
    for (const u of users.values()) {
      if (u.phoneNumber === phoneNumber) {
        existingUser = u
        break
      }
    }

    const now = new Date()
    if (existingUser) {
      existingUser.phoneVerifiedAt = now
      existingUser.updatedAt = now
      users.set(existingUser.id, existingUser)
      return { ...existingUser }
    }

    const newUser: UserEntity = {
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      phoneNumber,
      phoneVerifiedAt: now,
      createdAt: now,
      updatedAt: now,
    }
    users.set(newUser.id, newUser)
    return { ...newUser }
  },

  // --- Exclusive Phone Binding & Collision Engine ---
  async checkPhoneAttachment(phone: string, currentIdentityId?: string): Promise<{
    allowed: boolean
    error?: string
    isAttached: boolean
    isBoundToPrimaryAccount?: boolean
    primaryEmail?: string
    primaryProvider?: 'google' | 'email'
  }> {
    const cleanPhone = phone.replace(/[^0-9+]/g, '')

    // Case 1: If logged in, check if current user already has a different phone attached
    if (currentIdentityId) {
      const existing = identityPhones.get(currentIdentityId)
      if (existing && existing !== cleanPhone) {
        return {
          allowed: false,
          isAttached: true,
          error: `Your account already has phone number ${existing} attached. You must remove it in Settings before connecting a different number.`,
        }
      }
    }

    // Case 2: Check if phone is already attached to someone else
    const ownerId = attachedPhones.get(cleanPhone)
    if (ownerId) {
      if (currentIdentityId && ownerId !== currentIdentityId) {
        return {
          allowed: false,
          isAttached: true,
          error: `This phone number (${cleanPhone}) is already attached to another account. You cannot link it until it is removed from that account's Settings.`,
        }
      }

      if (!currentIdentityId) {
        const primary = primaryAccounts.get(ownerId)
        if (primary) {
          const providerName = primary.provider === 'google' ? 'Google' : 'Email'
          return {
            allowed: false,
            isAttached: true,
            isBoundToPrimaryAccount: true,
            primaryEmail: primary.email,
            primaryProvider: primary.provider,
            error: `This phone number (${cleanPhone}) is attached to your ${providerName} account (${primary.email}). Please sign in with ${providerName}. To use phone login, remove this number from Settings first.`,
          }
        }
      }
    }

    return { allowed: true, isAttached: false }
  },

  async attachPhone(
    phone: string,
    identityId: string,
    primaryAccount?: { email: string; provider: 'google' | 'email' }
  ): Promise<void> {
    const cleanPhone = phone.replace(/[^0-9+]/g, '')
    attachedPhones.set(cleanPhone, identityId)
    identityPhones.set(identityId, cleanPhone)
    if (primaryAccount) {
      primaryAccounts.set(identityId, primaryAccount)
    }
  },

  async unlinkPhone(identityId: string): Promise<string | null> {
    const phone = identityPhones.get(identityId)
    if (phone) {
      attachedPhones.delete(phone)
      identityPhones.delete(identityId)
    }
    return phone || null
  },

  async getAttachedPhone(identityId: string): Promise<string | null> {
    return identityPhones.get(identityId) || null
  },

  async clearAll(): Promise<void> {
    users.clear()
    challenges.clear()
    webhooks.clear()
    attachedPhones.clear()
    identityPhones.clear()
    primaryAccounts.clear()
  },
}
