'use client'

import * as React from 'react'
import type {
  Adjustment,
  Allocation,
  Bill,
  CalculationResult,
  CurrencyCode,
  Paise,
  ProductItem,
  ValidationIssue,
} from '@/types/split'
import { allocationWithoutPerson, billTotalsOf, calculateBill } from '@/lib/calculations'
import { addToHistory, clearAllData, loadDraft, loadSettings, saveDraft as persistDraft, saveSettings } from '@/lib/storage'
import { calculateBillViaApi } from '@/lib/api-client'
import { createEmptyBill, createSampleBill } from '@/lib/seed'
import { newId } from '@/lib/id'
import { isCurrencyCode } from '@/lib/validation'

const DEFAULT_CURRENCY: CurrencyCode = isCurrencyCode(process.env.NEXT_PUBLIC_DEFAULT_CURRENCY)
  ? process.env.NEXT_PUBLIC_DEFAULT_CURRENCY
  : 'INR'

export interface StoreState {
  bill: Bill
  /** Last official calculation result from the backend. */
  result: CalculationResult | null
  calculating: boolean
  error: { message: string; issues: ValidationIssue[] } | null
  /** ISO timestamp of the last explicit "Save Draft". */
  savedAt: string | null
  /** ISO timestamp of the last successful calculation, for staleness hints. */
  calculatedFromUpdatedAt: string | null
  hydrated: boolean
}

export type StoreAction =
  | { type: 'HYDRATE'; bill: Bill }
  | { type: 'SET_BILL_NAME'; name: string }
  | { type: 'ADD_ITEM'; item: ProductItem }
  | { type: 'UPDATE_ITEM'; itemId: string; patch: Partial<Pick<ProductItem, 'name' | 'quantity' | 'unitPrice'>> }
  | { type: 'REMOVE_ITEM'; itemId: string }
  | { type: 'DUPLICATE_ITEM'; itemId: string }
  | { type: 'SET_ALLOCATION'; itemId: string; allocation: Allocation }
  | { type: 'ADD_PERSON'; name: string }
  | { type: 'RENAME_PERSON'; personId: string; name: string }
  | { type: 'REMOVE_PERSON'; personId: string }
  | { type: 'SET_PAID_AMOUNT'; personId: string; amount: Paise }
  | { type: 'PAY_REMAINING'; personId: string }
  | { type: 'ADD_ADJUSTMENT'; adjustment: Adjustment }
  | { type: 'UPDATE_ADJUSTMENT'; adjustmentId: string; patch: Partial<Omit<Adjustment, 'id'>> }
  | { type: 'REMOVE_ADJUSTMENT'; adjustmentId: string }
  | { type: 'SET_CURRENCY'; currency: CurrencyCode }
  | { type: 'NEW_BILL'; currency: CurrencyCode }
  | { type: 'LOAD_BILL'; bill: Bill }
  | { type: 'CALCULATE_START' }
  | { type: 'CALCULATE_SUCCESS'; result: CalculationResult; calculatedFromUpdatedAt: string }
  | { type: 'CALCULATE_ERROR'; error: { message: string; issues: ValidationIssue[] } }
  | { type: 'MARK_SAVED'; savedAt: string }

function touch(bill: Bill): Bill {
  return { ...bill, updatedAt: new Date().toISOString() }
}

function reducer(state: StoreState, action: StoreAction): StoreState {
  const bill = state.bill
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, bill: action.bill, hydrated: true, error: null }
    case 'SET_BILL_NAME':
      return { ...state, bill: touch({ ...bill, name: action.name }) }
    case 'ADD_ITEM':
      return { ...state, bill: touch({ ...bill, items: [...bill.items, action.item] }) }
    case 'UPDATE_ITEM':
      return {
        ...state,
        bill: touch({
          ...bill,
          items: bill.items.map((item) => (item.id === action.itemId ? { ...item, ...action.patch } : item)),
        }),
      }
    case 'REMOVE_ITEM':
      return { ...state, bill: touch({ ...bill, items: bill.items.filter((item) => item.id !== action.itemId) }) }
    case 'DUPLICATE_ITEM': {
      const source = bill.items.find((item) => item.id === action.itemId)
      if (!source) return state
      const copy: ProductItem = {
        ...source,
        id: newId('item'),
        name: `${source.name || 'Untitled product'} (copy)`,
        allocation: JSON.parse(JSON.stringify(source.allocation)) as Allocation,
      }
      const index = bill.items.findIndex((item) => item.id === action.itemId)
      const items = [...bill.items]
      items.splice(index + 1, 0, copy)
      return { ...state, bill: touch({ ...bill, items }) }
    }
    case 'SET_ALLOCATION':
      return {
        ...state,
        bill: touch({
          ...bill,
          items: bill.items.map((item) => (item.id === action.itemId ? { ...item, allocation: action.allocation } : item)),
        }),
      }
    case 'ADD_PERSON':
      return {
        ...state,
        bill: touch({
          ...bill,
          people: [...bill.people, { id: newId('person'), name: action.name, paidAmount: 0 }],
        }),
      }
    case 'RENAME_PERSON':
      return {
        ...state,
        bill: touch({
          ...bill,
          people: bill.people.map((p) => (p.id === action.personId ? { ...p, name: action.name } : p)),
        }),
      }
    case 'REMOVE_PERSON':
      return {
        ...state,
        bill: touch({
          ...bill,
          people: bill.people.filter((p) => p.id !== action.personId),
          items: bill.items.map((item) => ({ ...item, allocation: allocationWithoutPerson(item.allocation, action.personId) })),
        }),
      }
    case 'SET_PAID_AMOUNT':
      return {
        ...state,
        bill: touch({
          ...bill,
          people: bill.people.map((p) => (p.id === action.personId ? { ...p, paidAmount: Math.max(0, Math.round(action.amount)) } : p)),
        }),
      }
    case 'PAY_REMAINING': {
      const { billTotal } = billTotalsOf(bill)
      const othersPaid = bill.people.filter((p) => p.id !== action.personId).reduce((s, p) => s + p.paidAmount, 0)
      const remaining = Math.max(0, billTotal - othersPaid)
      return {
        ...state,
        bill: touch({
          ...bill,
          people: bill.people.map((p) => (p.id === action.personId ? { ...p, paidAmount: remaining } : p)),
        }),
      }
    }
    case 'ADD_ADJUSTMENT':
      return { ...state, bill: touch({ ...bill, adjustments: [...bill.adjustments, action.adjustment] }) }
    case 'UPDATE_ADJUSTMENT':
      return {
        ...state,
        bill: touch({
          ...bill,
          adjustments: bill.adjustments.map((adj) => (adj.id === action.adjustmentId ? { ...adj, ...action.patch } : adj)),
        }),
      }
    case 'REMOVE_ADJUSTMENT':
      return { ...state, bill: touch({ ...bill, adjustments: bill.adjustments.filter((adj) => adj.id !== action.adjustmentId) }) }
    case 'SET_CURRENCY':
      return { ...state, bill: touch({ ...bill, currency: action.currency }) }
    case 'NEW_BILL':
      return {
        ...state,
        bill: createEmptyBill(action.currency),
        result: null,
        error: null,
        savedAt: null,
        calculatedFromUpdatedAt: null,
      }
    case 'LOAD_BILL':
      return {
        ...state,
        bill: action.bill,
        result: null,
        error: null,
        savedAt: null,
        calculatedFromUpdatedAt: null,
      }
    case 'CALCULATE_START':
      return { ...state, calculating: true, error: null }
    case 'CALCULATE_SUCCESS':
      return {
        ...state,
        calculating: false,
        result: action.result,
        calculatedFromUpdatedAt: action.calculatedFromUpdatedAt,
        error: null,
      }
    case 'CALCULATE_ERROR':
      return { ...state, calculating: false, error: action.error }
    case 'MARK_SAVED':
      return { ...state, savedAt: action.savedAt }
    default:
      return state
  }
}

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

interface StoreContextValue {
  state: StoreState
  dispatch: React.Dispatch<StoreAction>
  /** Live, client-side preview computed by the same shared engine as the backend. */
  preview: CalculationResult
  /** True when the bill changed since the last successful calculation. */
  resultIsStale: boolean
  /** Send the bill to /api/calculate and store the official result. */
  calculate: () => Promise<void>
  /** Explicitly save the current bill into local history. */
  saveNamedDraft: () => void
  /** Start a fresh bill (UI confirms first when there are unsaved changes). */
  startNewBill: () => void
  /** Wipe all local data and reset the workspace to the sample bill. */
  resetAllData: () => void
  /** Update the default currency preference for future bills. */
  setCurrency: (currency: CurrencyCode) => void
  draftSavedAt: string | null
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
  })
  const [draftSavedAt, setDraftSavedAt] = React.useState<string | null>(null)
  const hydratedRef = React.useRef(false)

  // Hydrate from local storage (or first-visit sample data) once.
  React.useEffect(() => {
    if (hydratedRef.current) return
    hydratedRef.current = true
    const draft = loadDraft()
    if (draft && isBillLike(draft)) {
      dispatch({ type: 'HYDRATE', bill: draft })
    } else {
      const settings = loadSettings(DEFAULT_CURRENCY)
      dispatch({ type: 'HYDRATE', bill: createSampleBill() })
      if (settings.currency !== DEFAULT_CURRENCY) {
        dispatch({ type: 'SET_CURRENCY', currency: settings.currency })
      }
    }
  }, [])

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

  const resetAllData = React.useCallback(() => {
    clearAllData()
    dispatch({ type: 'HYDRATE', bill: createSampleBill() })
    setDraftSavedAt(null)
  }, [])

  const setCurrency = React.useCallback((currency: CurrencyCode) => {
    dispatch({ type: 'SET_CURRENCY', currency })
    saveSettings({ currency })
  }, [])

  const value = React.useMemo<StoreContextValue>(
    () => ({
      state,
      dispatch,
      preview,
      resultIsStale,
      calculate,
      saveNamedDraft,
      startNewBill,
      resetAllData,
      setCurrency,
      draftSavedAt,
    }),
    [state, preview, resultIsStale, calculate, saveNamedDraft, startNewBill, resetAllData, setCurrency, draftSavedAt],
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
