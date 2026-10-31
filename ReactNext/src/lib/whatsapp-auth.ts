export interface WhatsAppSession {
  sessionId: string
  code: string
  phone?: string
  verifiedPhone?: string
  status: 'PENDING' | 'VERIFIED' | 'EXPIRED'
  createdAt: number
  expiresAt: number
}

// In-memory store (persists across hot reloads in dev via globalThis)
const globalStore = globalThis as unknown as {
  __whatsappSessions?: Map<string, WhatsAppSession>
}

if (!globalStore.__whatsappSessions) {
  globalStore.__whatsappSessions = new Map<string, WhatsAppSession>()
}

const sessions = globalStore.__whatsappSessions

function generateCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000)
  return `SPLIT-${num}`
}

export function createWhatsAppSession(phone?: string): WhatsAppSession {
  const sessionId = `wa-sess-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const code = generateCode()
  const now = Date.now()
  const expiresAt = now + 10 * 60 * 1000 // 10 minutes

  const session: WhatsAppSession = {
    sessionId,
    code,
    phone: phone?.trim(),
    status: 'PENDING',
    createdAt: now,
    expiresAt,
  }

  sessions.set(sessionId, session)
  return session
}

export function getWhatsAppSession(sessionId: string): WhatsAppSession | null {
  const session = sessions.get(sessionId)
  if (!session) return null

  if (Date.now() > session.expiresAt && session.status === 'PENDING') {
    session.status = 'EXPIRED'
  }

  return session
}

export function verifySessionByCode(rawCode: string, fromPhone?: string): WhatsAppSession | null {
  const cleanCode = rawCode.trim().toUpperCase()

  for (const session of sessions.values()) {
    if (session.code.toUpperCase() === cleanCode && session.status === 'PENDING') {
      if (Date.now() > session.expiresAt) {
        session.status = 'EXPIRED'
        return null
      }

      session.status = 'VERIFIED'
      session.verifiedPhone = fromPhone || session.phone || 'Verified WhatsApp User'
      return session
    }
  }

  return null
}

export function confirmSession(sessionId: string, phone?: string): boolean {
  const session = sessions.get(sessionId)
  if (!session) return false

  session.status = 'VERIFIED'
  session.verifiedPhone = phone || session.phone || 'Verified WhatsApp User'
  return true
}

