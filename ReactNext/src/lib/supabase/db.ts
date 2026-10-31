import { Pool } from 'pg'
import crypto from 'crypto'

const SUPABASE_DB_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:Jibin%40supabase.com10@db.waqyadioyacpuwqjnmui.supabase.co:5432/postgres'

// Initialize PostgreSQL connection pool with SSL for Supabase
export const pool = new Pool({
  connectionString: SUPABASE_DB_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
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
// 1. Google OAuth Cloud Authentication (5NF)
// -----------------------------------------------------------------------------
export async function authenticateGoogleUser(params: {
  googleSub: string
  email: string
  name?: string
  avatarUrl?: string
  rawProfile?: any
}) {
  const client = await pool.connect()
  try {
    const res = await client.query(
      `SELECT * FROM public.cloud_authenticate_google($1, $2, $3, $4, $5);`,
      [
        params.googleSub,
        params.email.toLowerCase().trim(),
        params.name || '',
        params.avatarUrl || null,
        JSON.stringify(params.rawProfile || {}),
      ]
    )

    const row = res.rows[0]
    return {
      identityId: row.identity_id,
      displayName: row.display_name,
      email: row.email,
      avatarUrl: row.avatar_url,
      isNewUser: row.is_new_user,
    }
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
}) {
  const client = await pool.connect()
  try {
    const { hash, salt } = hashPassword(params.password)
    const res = await client.query(
      `SELECT * FROM public.cloud_register_local($1, $2, $3, $4, $5);`,
      [
        params.username.toLowerCase().trim(),
        params.email.toLowerCase().trim(),
        params.displayName || params.username,
        hash,
        salt,
      ]
    )

    const row = res.rows[0]
    return {
      identityId: row.identity_id,
      username: row.username,
      email: row.email,
      displayName: row.display_name,
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
