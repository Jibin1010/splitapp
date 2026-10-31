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
import { createEmptyBill, createSampleBill } from '@/lib/seed'
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

  // Hydrate from local storage (or first-visit sample data) once.
  React.useEffect(() => {
    if (hydratedRef.current) return
    hydratedRef.current = true
    let savedActivePersonId = loadActivePersonId()
    const draft = loadDraft()
    if (typeof window !== 'undefined') {
      try {
        const authUser = getStoredUser()
        if (authUser) {
          const sample = createSampleBill()
          const matched = (draft && isBillLike(draft) ? draft.people : sample.people).find(
            (p) => p.name.toLowerCase().includes(authUser.name.toLowerCase()) ||
                   authUser.name.toLowerCase().includes(p.name.toLowerCase()) ||
                   p.id === authUser.id
          )
          if (matched) {
            savedActivePersonId = matched.id
          }
        }
        const params = new URLSearchParams(window.location.search)
        const userQuery = params.get('user') || params.get('person')
        if (userQuery) {
          const sample = createSampleBill()
          const matched = (draft && isBillLike(draft) ? draft.people : sample.people).find(
            (p) => p.id === userQuery || p.name.toLowerCase() === userQuery.toLowerCase()
          )
          if (matched) {
            savedActivePersonId = matched.id
          }
        }
      } catch {}
    }
    if (draft && isBillLike(draft)) {
      // If the draft is the old Chicken Biriyani bill or has 0 people, replace with 50 dummy people!
      const shouldLoad50 =
        draft.people.length === 0 ||
        draft.items.some((i) => i.name.toLowerCase().includes('biriyani'))
      if (shouldLoad50) {
        dispatch({ type: 'LOAD_50_DUMMY_PEOPLE' })
      } else {
        dispatch({ type: 'HYDRATE', bill: draft, activePersonId: savedActivePersonId })
      }
    } else {
      const settings = loadSettings(DEFAULT_CURRENCY)
      dispatch({ type: 'HYDRATE', bill: createSampleBill(), activePersonId: savedActivePersonId })
      if (settings.currency !== DEFAULT_CURRENCY) {
        dispatch({ type: 'SET_CURRENCY', currency: settings.currency })
      }
    }
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

  // Autosave: persist the active bill shortly after any meaningful edit.
  React.useEffect(() => {
    if (!state.hydrated) return
    const timer = setTimeout(() => {
      if (persistDraft(state.bill)) {
        setDraftSavedAt(new Date().toISOString())
      }
    }, 600)
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
    dispatch({ type: 'NEW_BILL', currency: stateRef.current.bill.currency })
  }, [])

  const load50DummyPeople = React.useCallback(() => {
    dispatch({ type: 'LOAD_50_DUMMY_PEOPLE' })
  }, [])

  const clearItemsAndAdjustments = React.useCallback(() => {
    dispatch({ type: 'CLEAR_ITEMS_AND_ADJUSTMENTS' })
  }, [])

  const resetAllData = React.useCallback(() => {
    clearAllData()
    dispatch({ type: 'HYDRATE', bill: createSampleBill() })
    setDraftSavedAt(null)
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
