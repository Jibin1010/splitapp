export interface AuthUser {
  id: string
  name: string
  email: string
  photo?: string | null
  phone?: string | null
  token?: string | null
  createdAt: string
}

const AUTH_USER_KEY = 'splitledger.auth_user.v1'
const REGISTERED_USERS_KEY = 'splitledger.registered_users.v1'

const DEFAULT_USERS: Array<AuthUser & { passwordHash: string }> = [
  {
    id: 'user-maya',
    name: 'Maya Sharma',
    email: 'maya@splitledger.app',
    photo: '/images/production/avatars/maya.jpg',
    passwordHash: 'password123',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-alex',
    name: 'Alex Chen',
    email: 'alex@splitledger.app',
    photo: '/images/production/avatars/alex.jpg',
    passwordHash: 'password123',
    createdAt: new Date().toISOString(),
  },
]

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function getStoredUser(): AuthUser | null {
  if (!isBrowser()) return null
  try {
    const raw = window.localStorage.getItem(AUTH_USER_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function saveStoredUser(user: AuthUser | null): void {
  if (!isBrowser()) return
  try {
    if (user) {
      window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
    } else {
      window.localStorage.removeItem(AUTH_USER_KEY)
    }
  } catch {
    // ignore
  }
}

function getRegisteredUsers(): Array<AuthUser & { passwordHash: string }> {
  if (!isBrowser()) return DEFAULT_USERS
  try {
    const raw = window.localStorage.getItem(REGISTERED_USERS_KEY)
    if (!raw) return DEFAULT_USERS
    const stored = JSON.parse(raw)
    return [...DEFAULT_USERS, ...stored]
  } catch {
    return DEFAULT_USERS
  }
}

/**
 * Authenticates user via Supabase 5NF cloud authentication endpoint.
 * Falls back to offline demo credentials if offline.
 */
export async function loginWithCredentials(
  identifier: string,
  password: string
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    const res = await fetch('/api/cloud-auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    })

    const data = await res.json()
    if (res.ok && data.success && data.user) {
      const authUser: AuthUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        photo: data.user.avatarUrl || null,
        phone: data.unified?.whatsappPhone || data.user.phone || null,
        token: data.sessionToken || null,
        createdAt: new Date().toISOString(),
      }
      saveStoredUser(authUser)
      return { success: true, user: authUser }
    } else if (res.status === 401 || res.status === 400) {
      return { success: false, error: data.error || 'Invalid credentials' }
    }
  } catch {
    // network fallback to local demo users
  }

  // Local fallback check (e.g. Maya demo account)
  const cleanId = identifier.trim().toLowerCase()
  const users = getRegisteredUsers()
  const match = users.find((u) => u.email.toLowerCase() === cleanId || u.name.toLowerCase() === cleanId)

  if (!match) {
    return {
      success: false,
      error: 'No account found with this email/username.',
    }
  }

  if (match.passwordHash !== password) {
    return {
      success: false,
      error: 'Incorrect password. Please try again.',
    }
  }

  const authUser: AuthUser = {
    id: match.id,
    name: match.name,
    email: match.email,
    photo: match.photo,
    createdAt: match.createdAt,
  }

  saveStoredUser(authUser)
  return { success: true, user: authUser }
}

/**
 * Registers user in Supabase 5NF cloud database.
 */
export async function registerWithCredentials(
  name: string,
  email: string,
  password: string
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  const cleanName = name.trim()
  const cleanEmail = email.trim().toLowerCase()

  if (!cleanName || cleanName.length < 2) {
    return { success: false, error: 'Please enter your full name (at least 2 characters).' }
  }

  if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    return { success: false, error: 'Please enter a valid email address.' }
  }

  if (!password || password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' }
  }

  try {
    const res = await fetch('/api/cloud-auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: cleanEmail.split('@')[0],
        email: cleanEmail,
        password,
        displayName: cleanName,
      }),
    })

    const data = await res.json()
    if (res.ok && data.success && data.user) {
      const authUser: AuthUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        photo: null,
        phone: data.unified?.whatsappPhone || null,
        token: data.sessionToken || null,
        createdAt: new Date().toISOString(),
      }
      saveStoredUser(authUser)
      return { success: true, user: authUser }
    } else {
      return { success: false, error: data.error || 'Registration failed' }
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error occurred during registration.' }
  }
}

/**
 * Syncs Google OAuth user into Supabase 5NF cloud database.
 */
export async function syncGoogleUserToCloud(params: {
  accessToken?: string
  idToken?: string
  profile?: any
}): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    const res = await fetch('/api/cloud-auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })

    const data = await res.json()
    if (res.ok && data.success && data.user) {
      const authUser: AuthUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        photo: data.user.avatarUrl || null,
        phone: data.unified?.whatsappPhone || data.user.phone || null,
        token: data.sessionToken || null,
        createdAt: new Date().toISOString(),
      }
      saveStoredUser(authUser)
      return { success: true, user: authUser }
    }
    return { success: false, error: data.error || 'Failed to authenticate with cloud.' }
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error connecting to cloud.' }
  }
}

export async function logout(): Promise<void> {
  saveStoredUser(null)
  try {
    await fetch('/api/cloud-auth/session', { method: 'POST' })
  } catch {
    // ignore
  }
}

/**
 * Explicitly links a verified phone number to the current user's 5NF cloud identity.
 */
export async function linkPhoneToCloud(
  phone: string
): Promise<{ success: boolean; linked?: any; unified?: any; error?: string }> {
  try {
    const res = await fetch('/api/cloud-auth/link-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    })
    const data = await res.json()
    return data
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to link phone' }
  }
}

/**
 * Retrieves the comprehensive 5NF unified profile for the currently logged in user.
 */
export async function getUnifiedProfile(): Promise<{
  authenticated: boolean
  user?: any
  unified?: any
  error?: string
}> {
  try {
    const res = await fetch('/api/cloud-auth/me')
    const data = await res.json()
    return data
  } catch (err: any) {
    return { authenticated: false, error: err.message }
  }
}

/**
 * Removes the attached phone number from the active user's account.
 */
export async function unlinkPhoneFromAccount(): Promise<{
  success: boolean
  error?: string
  unlinkedPhone?: string
}> {
  try {
    const res = await fetch('/api/cloud-auth/link-phone', {
      method: 'DELETE',
    })
    const data = await res.json()
    if (res.ok && data.success) {
      const current = getStoredUser()
      if (current) {
        current.phone = null
        saveStoredUser(current)
      }
      return { success: true, unlinkedPhone: data.unlinkedPhone }
    }
    return { success: false, error: data.error || 'Failed to remove phone number' }
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' }
  }
}
