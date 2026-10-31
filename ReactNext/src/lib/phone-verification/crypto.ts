import crypto from 'node:crypto'

const DEFAULT_SECRET = process.env.CHALLENGE_SECRET || 'splitledger_challenge_secret_32_bytes_min_length_key'

/**
 * Generates a 256-bit cryptographically secure random token (64 hex characters).
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Generates a unique, collision-resistant challenge identifier.
 * Format: 8-byte hex string (e.g. "8f3a2c91a0b4d6e8")
 */
export function generateChallengeId(): string {
  return crypto.randomBytes(8).toString('hex')
}

/**
 * Computes an HMAC-SHA256 digest of the token using the server's private secret.
 * The raw token is NEVER saved in the database; only this hash is stored.
 */
export function hashToken(token: string, secret = DEFAULT_SECRET): string {
  return crypto.createHmac('sha256', secret).update(token).digest('hex')
}

/**
 * Compares a candidate token against the stored HMAC digest using constant-time comparison
 * to eliminate timing side-channel attacks.
 */
export function verifyToken(candidateToken: string, storedHash: string, secret = DEFAULT_SECRET): boolean {
  try {
    const candidateHash = hashToken(candidateToken, secret)
    const bufA = Buffer.from(candidateHash, 'hex')
    const bufB = Buffer.from(storedHash, 'hex')

    if (bufA.length !== bufB.length) return false
    return crypto.timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

/**
 * Validates Meta WhatsApp Cloud API incoming webhook signature (X-Hub-Signature-256).
 * Computes HMAC-SHA256 of the raw body using META_APP_SECRET and compares with signature header.
 *
 * @param rawBody The unparsed raw UTF-8 string or Buffer of the request body
 * @param signatureHeader The X-Hub-Signature-256 header (format: "sha256=<hex>")
 * @param appSecret The Meta App Secret from Meta Developer Dashboard
 */
export function verifyMetaWebhookSignature(
  rawBody: string | Buffer,
  signatureHeader: string | null | undefined,
  appSecret: string
): boolean {
  if (!signatureHeader || !appSecret) return false

  const parts = signatureHeader.split('=')
  if (parts.length !== 2 || parts[0] !== 'sha256') {
    return false
  }

  const expectedSignatureHex = parts[1]

  try {
    const computedSignatureHex = crypto
      .createHmac('sha256', appSecret)
      .update(rawBody)
      .digest('hex')

    const bufExpected = Buffer.from(expectedSignatureHex, 'hex')
    const bufComputed = Buffer.from(computedSignatureHex, 'hex')

    if (bufExpected.length !== bufComputed.length) return false
    return crypto.timingSafeEqual(bufExpected, bufComputed)
  } catch {
    return false
  }
}

