import type { Bill, CalculationResult, CurrencyCode, HistoryEntry, Settings } from '@/types/split'

/**
 * Local persistence for SplitLedger — draft autosave, named history and
 * settings, all in this browser's localStorage. There is no server-side
 * storage in v1, so nothing here syncs across devices.
 *
 * Every access is guarded so the app also works with storage unavailable
 * (private mode, SSR, corrupted data).
 */

const DRAFT_KEY = 'splitledger.draft.v1'
const HISTORY_KEY = 'splitledger.history.v1'
const SETTINGS_KEY = 'splitledger.settings.v1'
const MAX_HISTORY_ENTRIES = 50

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function safeGetJson<T>(key: string): T | null {
  if (!isBrowser()) return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function safeSetJson(key: string, value: unknown): boolean {
  if (!isBrowser()) return false
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function loadDraft(): Bill | null {
  const draft = safeGetJson<Bill>(DRAFT_KEY)
  if (!draft) return null
  // Only purge legacy mock seed data if it exclusively contains old dummy test accounts
  const isLegacyMockData =
    Array.isArray(draft.people) &&
    draft.people.length > 0 &&
    draft.people.every((p) =>
      ['Maya Sharma', 'Arjun Patel', 'Neha Rao', 'Ravi Kumar', 'Priya Nair'].includes(p.name)
    )
  if (isLegacyMockData) {
    clearDraft()
    return null
  }
  return draft
}

export function saveDraft(bill: Bill): boolean {
  return safeSetJson(DRAFT_KEY, bill)
}

export function clearDraft(): void {
  if (!isBrowser()) return
  try {
    window.localStorage.removeItem(DRAFT_KEY)
  } catch {
    // ignore
  }
}

export function loadHistory(): HistoryEntry[] {
  const entries = safeGetJson<HistoryEntry[]>(HISTORY_KEY)
  if (!Array.isArray(entries)) return []
  return entries.filter((e) => {
    if (!e || typeof e.id !== 'string' || !e.bill || typeof e.bill !== 'object') return false
    const bill = e.bill as unknown as Record<string, unknown>
    return Array.isArray(bill.items) && Array.isArray(bill.people) && Array.isArray(bill.adjustments)
  })
}

export function addToHistory(bill: Bill, result: CalculationResult | null): HistoryEntry[] {
  const entries = loadHistory()
  const entry: HistoryEntry = {
    id: bill.id,
    savedAt: new Date().toISOString(),
    bill,
    result,
  }
  const withoutCurrent = entries.filter((e) => e.id !== bill.id)
  const updated = [entry, ...withoutCurrent].slice(0, MAX_HISTORY_ENTRIES)
  safeSetJson(HISTORY_KEY, updated)
  return updated
}

export function removeFromHistory(entryId: string): HistoryEntry[] {
  const updated = loadHistory().filter((e) => e.id !== entryId)
  safeSetJson(HISTORY_KEY, updated)
  return updated
}

export function loadSettings(defaultCurrency: CurrencyCode): Settings {
  const stored = safeGetJson<Settings>(SETTINGS_KEY)
  if (stored && (stored.currency === 'INR' || stored.currency === 'USD' || stored.currency === 'EUR' || stored.currency === 'GBP')) {
    return { currency: stored.currency }
  }
  return { currency: defaultCurrency }
}

export function saveSettings(settings: Settings): boolean {
  return safeSetJson(SETTINGS_KEY, settings)
}

const ACTIVE_PERSON_KEY = 'splitledger.active_person.v1'

export function loadActivePersonId(): string | null {
  if (!isBrowser()) return null
  try {
    return window.localStorage.getItem(ACTIVE_PERSON_KEY)
  } catch {
    return null
  }
}

export function saveActivePersonId(personId: string): boolean {
  if (!isBrowser()) return false
  try {
    window.localStorage.setItem(ACTIVE_PERSON_KEY, personId)
    return true
  } catch {
    return false
  }
}

/** Wipe everything SplitLedger stored in this browser. */
export function clearAllData(): void {
  if (!isBrowser()) return
  try {
    window.localStorage.removeItem(DRAFT_KEY)
    window.localStorage.removeItem(HISTORY_KEY)
    window.localStorage.removeItem(SETTINGS_KEY)
    window.localStorage.removeItem(ACTIVE_PERSON_KEY)
  } catch {
    // ignore
  }
}
