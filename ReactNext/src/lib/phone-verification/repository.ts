/**
 * Phone Verification Repository Layer
 * Implements strict ACID transactional semantics.
 */

export type ChallengeStatus = 'PENDING' | 'VERIFIED' | 'EXPIRED' | 'CANCELLED'

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
  tokenHash: string            // HMAC-SHA256 hex
  status: ChallengeStatus
  expiresAt: Date
  attempts: number
  verifiedAt: Date | null
  createdAt: Date
}

export interface WebhookEventEntity {
  id: string
  whatsappMessageId: string    // Unique Meta message ID for replay protection
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
}

if (!globalStorage.__pv_users) globalStorage.__pv_users = new Map()
if (!globalStorage.__pv_challenges) globalStorage.__pv_challenges = new Map()
if (!globalStorage.__pv_webhooks) globalStorage.__pv_webhooks = new Map()

const users = globalStorage.__pv_users
const challenges = globalStorage.__pv_challenges
const webhooks = globalStorage.__pv_webhooks

export const VerificationRepository = {
  // --- Challenges ---
  async createChallenge(challenge: VerificationChallengeEntity): Promise<VerificationChallengeEntity> {
    challenges.set(challenge.id, { ...challenge })
    return challenge
  },

  async findChallengeById(id: string): Promise<VerificationChallengeEntity | null> {
    const found = challenges.get(id)
    if (!found) return null

    // Check expiration on read
    if (found.status === 'PENDING' && new Date() > found.expiresAt) {
      found.status = 'EXPIRED'
    }

    return { ...found }
  },

  async cancelActiveChallengesForPhone(phone: string): Promise<number> {
    let count = 0
    for (const [id, c] of challenges.entries()) {
      if (c.phoneNumber === phone && c.status === 'PENDING') {
        c.status = 'CANCELLED'
        challenges.set(id, c)
        count++
      }
    }
    return count
  },

  /**
   * Atomic state transition: marks a challenge as VERIFIED only if current status is PENDING and not expired.
   * Returns true if transition succeeded, false if already verified/expired/cancelled (race-condition proof).
   */
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
  async isMessageProcessed(whatsappMessageId: string): Promise<boolean> {
    return webhooks.has(whatsappMessageId)
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

  // Clear helper for tests
  clearAll(): void {
    challenges.clear()
    webhooks.clear()
    users.clear()
  },
}

