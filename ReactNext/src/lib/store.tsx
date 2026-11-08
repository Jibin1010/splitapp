'use client'

import * as React from 'react'
import type {
  Bill,
  CalculationResult,
  CurrencyCode,
  Person,
  ValidationIssue,
} from '@/types/split'
import { calculateBill } from '@/lib/calculations'
import {
  addToHistory,
  clearAllData,
  loadActivePersonId,
  loadDraft,
  loadSettings,
  saveActivePersonId,
  saveDraft as persistDraft,
  saveSettings,
} from '@/lib/storage'
import { getStoredUser } from '@/lib/auth'
import { calculateBillViaApi } from '@/lib/api-client'
import { createEmptyBill, createCleanBill, createSampleBill } from '@/lib/seed'
import { isCurrencyCode } from '@/lib/validation'
import type { StoreAction, StoreContextValue, StoreState } from './store/store-types'
import { reducer } from './store/store-reducer'

export type { StoreAction, StoreContextValue, StoreState } from './store/store-types'

const DEFAULT_CURRENCY: CurrencyCode = isCurrencyCode(process.env.NEXT_PUBLIC_DEFAULT_CURRENCY)
  ? process.env.NEXT_PUBLIC_DEFAULT_CURRENCY
  : 'INR'

function isBillLike(value: unknown): value is Bill {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    Array.isArray(candidate.items) &&
    Array.isArray(candidate.people) &&
    Array.isArray(candidate.adjustments)
  )
}

const StoreContext = React.createContext<StoreContextValue | null>(null)

export function BillStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reducer, {
    bill: createEmptyBill(DEFAULT_CURRENCY),
    result: null,
    calculating: false,
    error: null,
    savedAt: null,
    calculatedFromUpdatedAt: null,
    hydrated: false,
    activePersonId: null,
  })
  const [draftSavedAt, setDraftSavedAt] = React.useState<string | null>(null)
  const hydratedRef = React.useRef(false)

  // Hydrate from backend server (or clean private bill) once.
  React.useEffect(() => {
    if (hydratedRef.current) return
    hydratedRef.current = true

    async function initializeStore() {
      let savedActivePersonId = loadActivePersonId()
      const authUser = getStoredUser()

      // 1. If user is logged in, fetch their isolated bill directly from the backend server!
      if (authUser) {
        try {
          const headers: Record<string, string> = {}
          if (authUser.token) headers['Authorization'] = `Bearer ${authUser.token}`
          if (authUser.id) headers['x-identity-id'] = authUser.id

          const res = await fetch('/api/cloud-bill', { headers })
          if (res.ok) {
            const data = await res.json()
            if (data.ok && data.bill && Array.isArray(data.bill.people) && data.bill.people.length > 0) {
              persistDraft(data.bill)
              const userPerson = data.bill.people.find(
                (p: Person) =>
                  p.id === authUser.id ||
                  (authUser.phone && p.phone && p.phone.replace(/\D/g, '').slice(-10) === authUser.phone.replace(/\D/g, '').slice(-10)) ||
                  p.name.trim().toLowerCase() === authUser.name.trim().toLowerCase() ||
                  p.id === savedActivePersonId
              )
              const activeId = userPerson ? userPerson.id : data.bill.people[0]?.id || null
              dispatch({ type: 'HYDRATE', bill: data.bill, activePersonId: activeId })
              return
            }
          }
        } catch (err) {
          console.warn('Could not fetch cloud bill, falling back to local storage:', err)
        }
      }

      // 2. Local fallback (if offline or not logged in)
      const draft = loadDraft()
      if (draft && isBillLike(draft) && draft.people.length > 0) {
        let matchedPersonId = savedActivePersonId
        if (authUser) {
          const matched = draft.people.find(
            (p) =>
              p.id === authUser.id ||
              (authUser.phone && p.phone && p.phone.replace(/\D/g, '').slice(-10) === authUser.phone.replace(/\D/g, '').slice(-10)) ||
              p.name.trim().toLowerCase() === authUser.name.trim().toLowerCase()
          )
          if (matched) matchedPersonId = matched.id
        }
        dispatch({ type: 'HYDRATE', bill: draft, activePersonId: matchedPersonId })
      } else {
        const settings = loadSettings(DEFAULT_CURRENCY)
        const cleanBill = createCleanBill(
          settings.currency || DEFAULT_CURRENCY,
          authUser?.name || 'You',
          authUser?.photo
        )
        dispatch({
          type: 'HYDRATE',
          bill: cleanBill,
          activePersonId: cleanBill.people[0]?.id || null,
        })
      }
    }

    initializeStore()
  }, [])

  // URL Query Sync: Allows deep-linking or viewing as a specific user via ?user=Name
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const params = new URLSearchParams(window.location.search)
      const userQuery = params.get('user') || params.get('person')
      if (userQuery && state.bill.people.length > 0) {
        const found = state.bill.people.find(
          (p) => p.id === userQuery || p.name.toLowerCase() === userQuery.toLowerCase()
        )
        if (found && state.activePersonId !== found.id) {
          dispatch({ type: 'SET_ACTIVE_PERSON', personId: found.id })
        }
      }
    } catch {}
  }, [state.bill.people, state.activePersonId])

  // Autosave: persist the active bill locally & sync to backend server if logged in.
  React.useEffect(() => {
    if (!state.hydrated) return

    // 1. Synchronous instantaneous local draft save — zero data loss on instant reload!
    if (persistDraft(state.bill)) {
      setDraftSavedAt(new Date().toISOString())
    }

    // 2. Debounced multi-tenant cloud backend sync
    const timer = setTimeout(() => {
      const authUser = getStoredUser()
      if (authUser) {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (authUser.token) headers['Authorization'] = `Bearer ${authUser.token}`
        if (authUser.id) headers['x-identity-id'] = authUser.id

        fetch('/api/cloud-bill', {
          method: 'POST',
          headers,
          body: JSON.stringify({ bill: state.bill }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.ok && data.result) {
              dispatch({
                type: 'CALCULATE_SUCCESS',
                result: data.result,
                calculatedFromUpdatedAt: state.bill.updatedAt,
              })
            }
          })
          .catch((err) => {
            console.warn('Backend bill sync warning:', err)
          })
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [state.bill, state.hydrated])

  const stateRef = React.useRef(state)
  stateRef.current = state

  const preview = React.useMemo(() => calculateBill(state.bill), [state.bill])
  const resultIsStale =
    state.result !== null && state.calculatedFromUpdatedAt !== null && state.bill.updatedAt !== state.calculatedFromUpdatedAt

  const calculate = React.useCallback(async () => {
    const current = stateRef.current
    if (current.calculating) return
    dispatch({ type: 'CALCULATE_START' })
    try {
      const result = await calculateBillViaApi(current.bill)
      dispatch({ type: 'CALCULATE_SUCCESS', result, calculatedFromUpdatedAt: current.bill.updatedAt })
    } catch (error) {
      const issues = error instanceof Error && 'issues' in error && Array.isArray((error as { issues: unknown }).issues)
        ? ((error as { issues: ValidationIssue[] }).issues)
        : []
      const message = error instanceof Error ? error.message : 'Something went wrong while calculating.'
      dispatch({ type: 'CALCULATE_ERROR', error: { message, issues } })
    }
  }, [])

  const saveNamedDraft = React.useCallback(() => {
    const current = stateRef.current
    addToHistory(current.bill, current.result)
    dispatch({ type: 'MARK_SAVED', savedAt: new Date().toISOString() })
  }, [])

  const startNewBill = React.useCallback(() => {
    const authUser = getStoredUser()
    const clean = createCleanBill(stateRef.current.bill.currency, authUser?.name || 'You', authUser?.photo)
    dispatch({ type: 'HYDRATE', bill: clean, activePersonId: clean.people[0]?.id || null })
  }, [])

  const load50DummyPeople = React.useCallback(() => {
    // Deprecated: Prevent loading dummy mock people into real bills
  }, [])

  const load1000VerifiedPeople = React.useCallback(() => {
    dispatch({ type: 'LOAD_1000_VERIFIED_PEOPLE' })
  }, [])

  const clearItemsAndAdjustments = React.useCallback(() => {
    dispatch({ type: 'CLEAR_ITEMS_AND_ADJUSTMENTS' })
  }, [])

  const resetAllData = React.useCallback(() => {
    clearAllData()
    const authUser = getStoredUser()
    const clean = createCleanBill(DEFAULT_CURRENCY, authUser?.name || 'You', authUser?.photo)
    dispatch({ type: 'HYDRATE', bill: clean, activePersonId: clean.people[0]?.id || null })
    setDraftSavedAt(null)

    if (authUser) {
      fetch('/api/cloud-bill', { method: 'DELETE' }).catch(() => {})
    }
  }, [])

  const setCurrency = React.useCallback((currency: CurrencyCode) => {
    dispatch({ type: 'SET_CURRENCY', currency })
    saveSettings({ currency })
  }, [])

  const activePerson = React.useMemo(() => {
    if (state.bill.people.length === 0) return null
    if (state.activePersonId) {
      const match = state.bill.people.find((p) => p.id === state.activePersonId)
      if (match) return match
    }
    const authUser = getStoredUser()
    if (authUser) {
      const match = state.bill.people.find(
        (p) => p.name.toLowerCase() === authUser.name.toLowerCase() || p.id === authUser.id
      )
      if (match) return match
      return {
        id: authUser.id,
        name: authUser.name,
        photo: authUser.photo ?? undefined,
        paidAmount: 0,
      }
    }
    const payer = state.bill.people.find((p) => (p.paidAmount || 0) > 0)
    return payer ?? state.bill.people[0] ?? null
  }, [state.bill.people, state.activePersonId])

  const activePersonResult = React.useMemo(() => {
    if (!activePerson) return null
    return preview.people[activePerson.id] ?? null
  }, [activePerson, preview.people])

  const setActivePerson = React.useCallback((personId: string) => {
    dispatch({ type: 'SET_ACTIVE_PERSON', personId })
    saveActivePersonId(personId)
  }, [])

  const getItemShareForActivePerson = React.useCallback(
    (itemId: string): number => {
      if (!activePerson) return 0
      return preview.itemAllocations[itemId]?.[activePerson.id] ?? 0
    },
    [activePerson, preview.itemAllocations]
  )

  const isItemAssignedToActivePerson = React.useCallback(
    (itemId: string): boolean => {
      if (!activePerson) return false
      const share = preview.itemAllocations[itemId]?.[activePerson.id] ?? 0
      return share > 0
    },
    [activePerson, preview.itemAllocations]
  )

  const value = React.useMemo<StoreContextValue>(
    () => ({
      state,
      dispatch,
      preview,
      resultIsStale,
      activePerson,
      activePersonResult,
      setActivePerson,
      getItemShareForActivePerson,
      isItemAssignedToActivePerson,
      calculate,
      saveNamedDraft,
      startNewBill,
      load50DummyPeople,
      load1000VerifiedPeople,
      clearItemsAndAdjustments,
      resetAllData,
      setCurrency,
      draftSavedAt,
    }),
    [
      state,
      preview,
      resultIsStale,
      activePerson,
      activePersonResult,
      setActivePerson,
      getItemShareForActivePerson,
      isItemAssignedToActivePerson,
      calculate,
      saveNamedDraft,
      startNewBill,
      load50DummyPeople,
      load1000VerifiedPeople,
      clearItemsAndAdjustments,
      resetAllData,
      setCurrency,
      draftSavedAt,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useBillStore(): StoreContextValue {
  const context = React.useContext(StoreContext)
  if (!context) {
    throw new Error('useBillStore must be used within a BillStoreProvider.')
  }
  return context
}
