import { describe, expect, it } from 'vitest'
import type { Bill, HistoryEntry } from '@/types/split'
import { createSampleBill } from '@/lib/seed'
import {
  addToHistory,
  clearAllData,
  clearDraft,
  loadDraft,
  loadHistory,
  loadSettings,
  removeFromHistory,
  saveDraft,
  saveSettings,
} from '@/lib/storage'

describe('local storage persistence', () => {
  it('round-trips an autosaved draft (refresh restores the bill)', () => {
    const bill = createSampleBill()
    saveDraft(bill)
    const loaded = loadDraft()
    expect(loaded).toEqual(bill)
    clearDraft()
    expect(loadDraft()).toBeNull()
  })

  it('returns null for corrupted drafts instead of crashing', () => {
    window.localStorage.setItem('splitledger.draft.v1', '{broken json')
    expect(loadDraft()).toBeNull()
  })

  it('saves named versions to history and reopens them', () => {
    const bill = createSampleBill()
    bill.name = 'Team dinner'

    const entries: HistoryEntry[] = addToHistory(bill, null)
    expect(entries).toHaveLength(1)
    expect(loadHistory()[0].bill.name).toBe('Team dinner')

    // Saving again with the same bill id replaces the entry instead of duplicating.
    addToHistory({ ...bill, name: 'Team dinner v2' }, null)
    const current = loadHistory()
    expect(current).toHaveLength(1)
    expect(current[0].bill.name).toBe('Team dinner v2')

    const afterRemove = removeFromHistory(bill.id)
    expect(afterRemove).toHaveLength(0)
    expect(loadHistory()).toHaveLength(0)
  })

  it('ignores malformed history entries', () => {
    window.localStorage.setItem('splitledger.history.v1', JSON.stringify([{ id: 5 }, { id: 'x', bill: {} }]))
    expect(loadHistory()).toEqual([])
  })

  it('persists currency settings with a safe default', () => {
    expect(loadSettings('INR').currency).toBe('INR')
    saveSettings({ currency: 'USD' })
    expect(loadSettings('INR').currency).toBe('USD')
  })

  it('clears everything with clearAllData', () => {
    const bill: Bill = createSampleBill()
    saveDraft(bill)
    addToHistory(bill, null)
    saveSettings({ currency: 'USD' })
    clearAllData()
    expect(loadDraft()).toBeNull()
    expect(loadHistory()).toEqual([])
    expect(loadSettings('INR').currency).toBe('INR')
  })
})
