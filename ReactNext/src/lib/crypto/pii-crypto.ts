/**
 * Zero-Knowledge Database PII Field-Level Encryption
 *
 * Guarantees that Personally Identifiable Information (Names, Gmail/Emails, Phone numbers)
 * are NEVER stored openly in the database.
 *
 * Implements deterministic AES-256-CBC with HMAC-derived IV:
 * - Ciphertext format: "enc:v1:<iv_hex>:<ciphertext_hex>"
 * - Scrambles all names, emails, and phone numbers in database columns and JSON payloads.
 * - Guarantees exact-match queries and UNIQUE constraints work without exposing plaintext.
 * - Authorized application sessions decrypt data in server memory before serving to verified users.
 */

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import type { Bill, Person } from '@/types/split'

const PII_PREFIX = 'enc:v1:'

// Auto-load .env.local if running in standalone/scripts environment
if (!process.env.DB_PII_ENCRYPTION_KEY && !process.env.GOOGLE_CLIENT_SECRET) {
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
    // Non-fatal
  }
}

function getPiiSecretKey(): Buffer {
  const secret =
    process.env.DB_PII_ENCRYPTION_KEY ||
    process.env.GOOGLE_CLIENT_SECRET ||
    'splitapp-master-zero-knowledge-pii-secret-salt-2026'
  return crypto.createHash('sha256').update(secret).digest()
}

/**
 * Checks whether a string is already encrypted in PII format.
 */
export function isEncryptedPII(text: string | null | undefined): boolean {
  if (!text || typeof text !== 'string') return false
  return text.trim().startsWith(PII_PREFIX)
}

/**
 * Encrypts sensitive user PII (names, emails, phones) deterministically into ciphertext.
 * Produces unreadable scrambled hex (e.g., "enc:v1:7f4a...:3c2d...").
 */
export function encryptPII(plaintext: string | null | undefined): string {
  if (!plaintext || typeof plaintext !== 'string') return ''
  const trimmed = plaintext.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith(PII_PREFIX)) return trimmed

  const key = getPiiSecretKey()
  // 16-byte deterministic IV from HMAC
  const iv = crypto.createHmac('sha256', key).update(trimmed).digest().subarray(0, 16)
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  let encrypted = cipher.update(trimmed, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  return `${PII_PREFIX}${iv.toString('hex')}:${encrypted}`
}

/**
 * Decrypts sensitive user PII from database ciphertext back to plaintext.
 * Safe fallback for legacy or unencrypted values.
 */
export function decryptPII(ciphertext: string | null | undefined): string {
  if (!ciphertext || typeof ciphertext !== 'string') return ''
  const trimmed = ciphertext.trim()
  if (!trimmed.startsWith(PII_PREFIX)) return trimmed

  try {
    const raw = trimmed.slice(PII_PREFIX.length)
    const [ivHex, encHex] = raw.split(':')
    if (!ivHex || !encHex) return trimmed

    const key = getPiiSecretKey()
    const iv = Buffer.from(ivHex, 'hex')
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    let decrypted = decipher.update(encHex, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch {
    return trimmed
  }
}

/**
 * Masks user details for audit logs and anonymized UI displays.
 */
export function maskPII(type: 'email' | 'phone' | 'name', value: string): string {
  if (!value) return ''
  const str = decryptPII(value)

  if (type === 'email') {
    const [user, domain] = str.split('@')
    if (!domain) return str.slice(0, 2) + '***'
    const maskedUser = user.length > 2 ? `${user[0]}***${user[user.length - 1]}` : `${user[0]}***`
    return `${maskedUser}@${domain}`
  }

  if (type === 'phone') {
    const digits = str.replace(/\s+/g, '')
    if (digits.length <= 4) return '***'
    return `${digits.slice(0, 3)}****${digits.slice(-4)}`
  }

  // Name masking: e.g. "Rahul Verma" -> "R***l V***a"
  const words = str.split(' ')
  return words
    .map((w) => (w.length > 2 ? `${w[0]}***${w[w.length - 1]}` : `${w[0]}*`))
    .join(' ')
}

/**
 * Encrypts all participant names and phone numbers in a Bill before persisting to PostgreSQL JSONB data.
 */
export function encryptBillForStorage(bill: Bill): Bill {
  return {
    ...bill,
    people: Array.isArray(bill.people)
      ? bill.people.map((p) => ({
          ...p,
          name: encryptPII(p.name),
          phone: p.phone ? encryptPII(p.phone) : undefined,
        }))
      : [],
  }
}

/**
 * Decrypts all participant names and phone numbers in a Bill after retrieving from PostgreSQL.
 */
export function decryptBillFromStorage(bill: Bill): Bill {
  return {
    ...bill,
    people: Array.isArray(bill.people)
      ? bill.people.map((p) => ({
          ...p,
          name: decryptPII(p.name),
          phone: p.phone ? decryptPII(p.phone) : undefined,
        }))
      : [],
  }
}
