import { Pool } from 'pg'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

if (!process.env.DATABASE_URL) {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local')
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8')
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const eqIdx = trimmed.indexOf('=')
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim()
          const val = trimmed.slice(eqIdx + 1).trim()
          if (!process.env[key]) {
            process.env[key] = val
          }
        }
      }
    }
  } catch {
    // ignore
  }
}

const SUPABASE_DB_URL =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_POSTGRES_URL ||
  'postgresql://postgres@localhost:5432/postgres'



const isLocalhost =
  SUPABASE_DB_URL.includes('localhost') || SUPABASE_DB_URL.includes('127.0.0.1')

const isTestEnv = process.env.NODE_ENV === 'test' && !process.env.TEST_WITH_LIVE_DB

// Initialize PostgreSQL connection pool with SSL for Supabase (disabled on localhost)
export const pool = new Pool({
  connectionString: SUPABASE_DB_URL,
  ssl: isLocalhost ? false : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: isTestEnv ? 250 : 5000,
})

// Cryptographic Password Hashing (PBKDF2-SHA256 with 100,000 iterations)
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex')
  return { hash, salt }
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const candidateHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex')
  return crypto.timingSafeEqual(Buffer.from(candidateHash, 'hex'), Buffer.from(hash, 'hex'))
}

// -----------------------------------------------------------------------------
// 1. Google OAuth Cloud Authentication (5NF) with Auto-Linking
// -----------------------------------------------------------------------------
export async function authenticateGoogleUser(params: {
  googleSub: string
  email: string
  name?: string
  avatarUrl?: string
  rawProfile?: any
  currentIdentityId?: string
}) {
  const client = await pool.connect()
  try {
    const res = await client.query(
      `SELECT * FROM public.cloud_authenticate_google($1, $2, $3, $4, $5, $6);`,
      [
        params.googleSub,
        params.email.toLowerCase().trim(),
        params.name || '',
        params.avatarUrl || null,
        JSON.stringify(params.rawProfile || {}),
        params.currentIdentityId || null,
      ]
    )

    const row = res.rows[0]
    return {
      identityId: row.identity_id,
      displayName: row.display_name,
      email: row.email,
      avatarUrl: row.avatar_url,
      isNewUser: row.is_new_user,
      isLinked: row.is_linked,
    }
  } finally {
    client.release()
  }
}

// -----------------------------------------------------------------------------
// 1b. Phone Identity Attachment & Anti-Collision Engine (5NF)
// -----------------------------------------------------------------------------
export async function checkPhoneAttachmentStatus(params: {
  phone: string
  currentIdentityId?: string
}): Promise<{
  allowed: boolean
  error?: string
  isAttached: boolean
  isBoundToPrimaryAccount?: boolean
  primaryEmail?: string
  primaryProvider?: 'google' | 'email'
  attachedIdentityId?: string
  existingUserPhone?: string
}> {
  const cleanPhone = params.phone.replace(/[^0-9+]/g, '')
  const client = await pool.connect()
  try {
    // 1. If user is logged in, check if their current account already has a phone attached
    if (params.currentIdentityId) {
      const userPhoneRes = await client.query(
        `SELECT e164_phone FROM public.phone_whatsapp_identities WHERE identity_id = $1 LIMIT 1;`,
        [params.currentIdentityId]
      )
      if (userPhoneRes.rows.length > 0) {
        const existing = userPhoneRes.rows[0].e164_phone
        if (existing && existing !== cleanPhone) {
          return {
            allowed: false,
            isAttached: true,
            existingUserPhone: existing,
            error: `Your account already has phone number ${existing} attached. You must remove it in Settings before connecting a different number.`,
          }
        }
      }
    }

    // 2. Check if the candidate phone number is already attached to any identity
    const phoneRes = await client.query(
      `SELECT 
         p.identity_id,
         p.e164_phone,
         lc.email as local_email,
         lc.username as local_username,
         g.email as google_email
       FROM public.phone_whatsapp_identities p
       JOIN public.app_identities i ON i.id = p.identity_id
       LEFT JOIN public.local_credentials lc ON lc.identity_id = i.id
       LEFT JOIN public.google_oauth_accounts g ON g.identity_id = i.id
       WHERE p.e164_phone = $1
       LIMIT 1;`,
      [cleanPhone]
    )

    if (phoneRes.rows.length > 0) {
      const row = phoneRes.rows[0]
      const ownerIdentityId = row.identity_id

      // Case A: User is logged in, but this phone is already attached to a different account
      if (params.currentIdentityId && ownerIdentityId !== params.currentIdentityId) {
        return {
          allowed: false,
          isAttached: true,
          attachedIdentityId: ownerIdentityId,
          error: `This phone number (${cleanPhone}) is already attached to another account. You cannot link it until it is removed from that account's Settings.`,
        }
      }

      // Case B: User is NOT logged in and trying to log in with phone, but this phone is bound to a primary Google/Email account
      if (!params.currentIdentityId) {
        const primaryEmail = row.google_email || row.local_email
        if (primaryEmail) {
          const provider = row.google_email ? 'Google' : 'Email'
          return {
            allowed: false,
            isAttached: true,
            isBoundToPrimaryAccount: true,
            primaryEmail,
            primaryProvider: provider.toLowerCase() as 'google' | 'email',
            error: `This phone number (${cleanPhone}) is attached to your ${provider} account (${primaryEmail}). Please sign in with ${provider}. To use phone login, remove this number from Settings first.`,
          }
        }
      }
    }

    return { allowed: true, isAttached: false }
  } finally {
    client.release()
  }
}

export async function unlinkPhoneIdentity(identityId: string) {
  const client = await pool.connect()
  try {
    const res = await client.query(
      `DELETE FROM public.phone_whatsapp_identities 
       WHERE identity_id = $1 
       RETURNING e164_phone;`,
      [identityId]
    )

    await client.query(
      `DELETE FROM public.identity_auth_methods 
       WHERE identity_id = $1 AND provider_code = 'whatsapp_phone';`,
      [identityId]
    )

    const unlinkedPhone = res.rows[0]?.e164_phone || null
    return {
      success: true,
      unlinkedPhone,
    }
  } finally {
    client.release()
  }
}

export async function linkPhoneIdentity(params: {
  phone: string
  targetIdentityId?: string
}) {
  const check = await checkPhoneAttachmentStatus({
    phone: params.phone,
    currentIdentityId: params.targetIdentityId,
  })

  if (!check.allowed) {
    throw new Error(check.error || 'Phone attachment check failed')
  }

  const client = await pool.connect()
  try {
    const res = await client.query(
      `SELECT * FROM public.cloud_link_phone_identity($1, $2);`,
      [params.phone.trim(), params.targetIdentityId || null]
    )
    const row = res.rows[0]
    return {
      identityId: row?.identity_id,
      phoneNumber: row?.phone_number,
      isLinked: row?.is_linked,
      isMerged: row?.is_merged,
    }
  } finally {
    client.release()
  }
}

// -----------------------------------------------------------------------------
// 1c. Get 5NF Unified Identity (Safe Profile - No Hashes or Secrets Exposed)
// -----------------------------------------------------------------------------
export async function getUnifiedIdentity(identityId: string) {
  const client = await pool.connect()
  try {
    const res = await client.query(
      `SELECT public.cloud_get_unified_identity($1) AS unified;`,
      [identityId]
    )
    return res.rows[0]?.unified || null
  } finally {
    client.release()
  }
}

// -----------------------------------------------------------------------------
// 2. Local Registration (Username/Password) in 5NF
// -----------------------------------------------------------------------------
export async function registerLocalUser(params: {
  username: string
  email: string
  password: string
  displayName?: string
  targetIdentityId?: string
}) {
  const client = await pool.connect()
  try {
    const { hash, salt } = hashPassword(params.password)
    const res = await client.query(
      `SELECT * FROM public.cloud_register_local($1, $2, $3, $4, $5, $6);`,
      [
        params.username.toLowerCase().trim(),
        params.email.toLowerCase().trim(),
        params.displayName || params.username,
        hash,
        salt,
        params.targetIdentityId || null,
      ]
    )

    const row = res.rows[0]
    return {
      identityId: row?.identity_id,
      username: row?.username,
      email: row?.email,
      displayName: row?.display_name,
      isNewUser: row?.is_new_user,
      isLinked: row?.is_linked,
    }
  } finally {
    client.release()
  }
}

// -----------------------------------------------------------------------------
// 3. Local Login (Username or Email) in 5NF
// -----------------------------------------------------------------------------
export async function loginLocalUser(identifier: string, candidatePass: string) {
  const client = await pool.connect()
  try {
    const cleanId = identifier.toLowerCase().trim()
    const res = await client.query(
      `SELECT 
        c.identity_id,
        c.username,
        c.email,
        c.password_hash,
        c.password_salt,
        c.failed_login_attempts,
        c.locked_until,
        p.display_name,
        p.avatar_url
       FROM public.local_credentials c
       JOIN public.identity_profiles p ON p.identity_id = c.identity_id
       WHERE c.username = $1 OR c.email = $1;`,
      [cleanId]
    )

    if (res.rows.length === 0) {
      return { success: false, error: 'User not found' }
    }

    const row = res.rows[0]

    // Check account lockout
    if (row.locked_until && new Date(row.locked_until) > new Date()) {
      return { success: false, error: 'Account is temporarily locked. Please try again later.' }
    }

    const isValid = verifyPassword(candidatePass, row.password_hash, row.password_salt)
    if (!isValid) {
      const attempts = row.failed_login_attempts + 1
      const lockUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null
      await client.query(
        `UPDATE public.local_credentials 
         SET failed_login_attempts = $1, locked_until = $2 
         WHERE identity_id = $3`,
        [attempts, lockUntil, row.identity_id]
      )

      await client.query(
        `INSERT INTO public.cloud_audit_events (identity_id, event_type, metadata)
         VALUES ($1, 'LOGIN_FAILED_BAD_PASSWORD', $2)`,
        [row.identity_id, JSON.stringify({ attempts })]
      )

      return { success: false, error: 'Incorrect password' }
    }

    // Reset failed attempts on success
    await client.query(
      `UPDATE public.local_credentials 
       SET failed_login_attempts = 0, locked_until = NULL, updated_at = clock_timestamp() 
       WHERE identity_id = $1`,
      [row.identity_id]
    )

    await client.query(
      `INSERT INTO public.cloud_audit_events (identity_id, event_type, metadata)
       VALUES ($1, 'LOGIN_SUCCESS_LOCAL', '{}'::jsonb)`,
      [row.identity_id]
    )

    return {
      success: true,
      identity: {
        id: row.identity_id,
        username: row.username,
        email: row.email,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
      },
    }
  } finally {
    client.release()
  }
}

// -----------------------------------------------------------------------------
// 4. Cloud Authoritative Sessions (5NF)
// -----------------------------------------------------------------------------
export async function createCloudSession(identityId: string, clientIp?: string, userAgent?: string) {
  const client = await pool.connect()
  try {
    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    await client.query(
      `INSERT INTO public.auth_sessions (identity_id, session_token_hash, client_ip, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [identityId, tokenHash, clientIp || null, userAgent || null, expiresAt]
    )

    return { sessionToken: rawToken, expiresAt: expiresAt.toISOString() }
  } finally {
    client.release()
  }
}

export async function verifyCloudSession(rawToken: string) {
  const client = await pool.connect()
  try {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const res = await client.query(
      `SELECT 
        s.id AS session_id,
        s.expires_at,
        i.id AS identity_id,
        i.is_active,
        p.display_name,
        p.avatar_url,
        c.username,
        c.email AS local_email,
        g.email AS google_email
       FROM public.auth_sessions s
       JOIN public.app_identities i ON i.id = s.identity_id
       LEFT JOIN public.identity_profiles p ON p.identity_id = i.id
       LEFT JOIN public.local_credentials c ON c.identity_id = i.id
       LEFT JOIN public.google_oauth_accounts g ON g.identity_id = i.id
       WHERE s.session_token_hash = $1 
         AND s.revoked_at IS NULL 
         AND s.expires_at > clock_timestamp()
         AND i.is_active = true`,
      [tokenHash]
    )

    if (res.rows.length === 0) {
      return null
    }

    const row = res.rows[0]
    return {
      sessionId: row.session_id,
      identityId: row.identity_id,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      username: row.username,
      email: row.local_email || row.google_email,
    }
  } finally {
    client.release()
  }
}

export async function revokeCloudSession(rawToken: string) {
  const client = await pool.connect()
  try {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    await client.query(
      `UPDATE public.auth_sessions 
       SET revoked_at = clock_timestamp() 
       WHERE session_token_hash = $1`,
      [tokenHash]
    )
    return true
  } finally {
    client.release()
  }
}

// -----------------------------------------------------------------------------
// 5. Phone & Telegram / WhatsApp Verification Comparison Engine (5NF Audit)
// -----------------------------------------------------------------------------
// 6. Zero-Trust Inbound Phone Verification & Comparison Engine
// -----------------------------------------------------------------------------
export async function createPhoneVerificationChallenge(params: {
  challengeId: string
  tokenHash: string
  claimedPhone: string
  claimedE164: string
  channel: 'whatsapp' | 'telegram' | 'sms'
  expiresAt: Date
  clientIp?: string
  userAgent?: string
  identityId?: string
}) {
  const client = await pool.connect()
  try {
    const res = await client.query(
      `INSERT INTO public.phone_verification_challenges (
        challenge_id, token_hash, claimed_phone_number, claimed_phone_e164,
        channel, expires_at, ip_address, user_agent, identity_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;`,
      [
        params.challengeId,
        params.tokenHash,
        params.claimedPhone,
        params.claimedE164,
        params.channel,
        params.expiresAt,
        params.clientIp || null,
        params.userAgent || null,
        params.identityId || null,
      ]
    )
    return res.rows[0]
  } finally {
    client.release()
  }
}

export async function getPhoneVerificationChallenge(challengeId: string) {
  const client = await pool.connect()
  try {
    const res = await client.query(
      `SELECT * FROM public.phone_verification_challenges WHERE challenge_id = $1 LIMIT 1;`,
      [challengeId]
    )
    return res.rows[0] || null
  } finally {
    client.release()
  }
}

export async function getLatestPendingChallengeByTelegramUser(telegramUserId: number) {
  const client = await pool.connect()
  try {
    const res = await client.query(
      `SELECT * FROM public.phone_verification_challenges 
       WHERE telegram_user_id = $1 
         AND verification_status IN ('PENDING', 'MISMATCH_REJECTED')
         AND attempts_count < 3
         AND expires_at > NOW() 
       ORDER BY created_at DESC 
       LIMIT 1;`,
      [telegramUserId]
    )
    return res.rows[0] || null
  } finally {
    client.release()
  }
}

export async function associateTelegramUserWithChallenge(params: {
  challengeId: string
  telegramUserId: number
  telegramUsername?: string
}) {
  const client = await pool.connect()
  try {
    const res = await client.query(
      `UPDATE public.phone_verification_challenges
       SET telegram_user_id = $1,
           telegram_username = COALESCE($2, telegram_username)
       WHERE challenge_id = $3
       RETURNING *;`,
      [params.telegramUserId, params.telegramUsername || null, params.challengeId]
    )
    return res.rows[0] || null
  } finally {
    client.release()
  }
}

export async function cancelPhoneVerificationChallenge(challengeId: string) {
  const client = await pool.connect()
  try {
    await client.query(
      `UPDATE public.phone_verification_challenges
       SET verification_status = 'CANCELLED'
       WHERE challenge_id = $1 AND verification_status = 'PENDING';`,
      [challengeId]
    )
    return true
  } finally {
    client.release()
  }
}

export async function processPhoneVerificationComparison(params: {
  challengeId: string
  actualSenderPhone: string
  actualSenderE164: string
  channel: 'whatsapp' | 'telegram' | 'sms'
  telegramUserId?: number
  telegramUsername?: string
}) {
  const client = await pool.connect()
  try {
    const checkRes = await client.query(
      `SELECT * FROM public.phone_verification_challenges WHERE challenge_id = $1;`,
      [params.challengeId]
    )

    if (checkRes.rows.length === 0) {
      return { success: false, reason: 'CHALLENGE_NOT_FOUND' }
    }

    const challenge = checkRes.rows[0]

    if (challenge.verification_status !== 'PENDING' && challenge.verification_status !== 'MISMATCH_REJECTED') {
      return { success: false, reason: `ALREADY_${challenge.verification_status}` }
    }

    if (new Date() > new Date(challenge.expires_at)) {
      await client.query(
        `UPDATE public.phone_verification_challenges SET verification_status = 'EXPIRED' WHERE id = $1;`,
        [challenge.id]
      )
      return { success: false, reason: 'CHALLENGE_EXPIRED' }
    }

    const matches = challenge.claimed_phone_e164 === params.actualSenderE164
    const newAttempts = (challenge.attempts_count || 0) + 1
    const isBurned = !matches && newAttempts >= 3

    let newStatus: string
    if (matches) {
      newStatus = 'VERIFIED'
    } else if (isBurned) {
      newStatus = 'MAX_ATTEMPTS_EXCEEDED'
    } else {
      newStatus = 'MISMATCH_REJECTED'
    }

    // Auto-link or create 5NF phone identity when numbers match
    let finalIdentityId = challenge.identity_id || null
    if (matches) {
      try {
        const linkRes = await client.query(
          `SELECT * FROM public.cloud_link_phone_identity($1, $2);`,
          [params.actualSenderE164.replace(/[^0-9+]/g, ''), challenge.identity_id || null]
        )
        if (linkRes.rows[0]?.identity_id) {
          finalIdentityId = linkRes.rows[0].identity_id
        }
      } catch (linkErr) {
        console.error('5NF link phone identity error (non-fatal):', linkErr)
      }
    }

    await client.query(
      `UPDATE public.phone_verification_challenges 
       SET actual_sender_number = $1,
           actual_sender_e164 = $2,
           numbers_match = $3,
           attempts_count = $4,
           telegram_user_id = COALESCE($5, telegram_user_id),
           telegram_username = COALESCE($6, telegram_username),
           verification_status = $7,
           verified_at = CASE WHEN $3 = true THEN clock_timestamp() ELSE verified_at END,
           identity_id = COALESCE($8, identity_id)
       WHERE id = $9;`,
      [
        params.actualSenderPhone,
        params.actualSenderE164,
        matches,
        newAttempts,
        params.telegramUserId || null,
        params.telegramUsername || null,
        newStatus,
        finalIdentityId,
        challenge.id,
      ]
    )

    return {
      success: matches,
      matches,
      status: newStatus,
      attempts: newAttempts,
      claimedE164: challenge.claimed_phone_e164,
      actualE164: params.actualSenderE164,
      identityId: finalIdentityId,
    }
  } finally {
    client.release()
  }
}

