import type { Allocation, ProductItem } from '@/types/split'
import { allocationWithoutPerson, billTotalsOf } from '@/lib/calculations'
import { createEmptyBill } from '@/lib/seed'
import { get50DummyPeople, getRandomAvatarForName } from '@/lib/dummy-people'
import { newId } from '@/lib/id'
import type { StoreAction, StoreState } from './store-types'
import { handleImportAnalysisResult, touch } from './store-import-handler'

export function reducer(state: StoreState, action: StoreAction): StoreState {
  const bill = state.bill
  switch (action.type) {
    case 'HYDRATE':
      return {
        ...state,
        bill: action.bill,
        hydrated: true,
        error: null,
        activePersonId: action.activePersonId !== undefined ? action.activePersonId : state.activePersonId,
      }
    case 'SET_ACTIVE_PERSON':
      return {
        ...state,
        activePersonId: action.personId,
      }
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
    case 'ADD_PERSON': {
      const trimmed = action.name.trim()
      if (!trimmed) return state
      const personId = newId('person')
      const photo = action.photo || getRandomAvatarForName(trimmed)
      return {
        ...state,
        bill: touch({
          ...bill,
          people: [...bill.people, { id: personId, name: trimmed, paidAmount: 0, photo }],
        }),
        activePersonId: action.switchTo ? personId : state.activePersonId,
      }
    }
    case 'RENAME_PERSON':
    case 'UPDATE_PERSON':
      return {
        ...state,
        bill: touch({
          ...bill,
          people: bill.people.map((p) => (p.id === action.personId ? { ...p, name: action.name } : p)),
        }),
      }
    case 'SET_PERSON_PHOTO':
      return {
        ...state,
        bill: touch({
          ...bill,
          people: bill.people.map((p) => (p.id === action.personId ? { ...p, photo: action.photo } : p)),
        }),
      }
    case 'LOAD_50_DUMMY_PEOPLE':
      return {
        ...state,
        bill: touch({
          ...bill,
          name: bill.name || 'Group Split',
          items: [],
          adjustments: [],
          people: get50DummyPeople(),
        }),
        result: null,
        error: null,
        savedAt: null,
        calculatedFromUpdatedAt: null,
      }
    case 'CLEAR_ITEMS_AND_ADJUSTMENTS':
      return {
        ...state,
        bill: touch({
          ...bill,
          items: [],
          adjustments: [],
        }),
        result: null,
        error: null,
      }
    case 'CLEAR_ALL_ITEMS':
      return {
        ...state,
        bill: touch({
          ...bill,
          items: [],
        }),
        result: null,
        error: null,
      }
    case 'IMPORT_ANALYSIS_RESULT':
      return handleImportAnalysisResult(state, action)
    case 'REMOVE_PERSON': {
      const remainingPeople = bill.people.filter((p) => p.id !== action.personId)
      return {
        ...state,
        bill: touch({
          ...bill,
          people: remainingPeople,
          items: bill.items.map((item) => ({ ...item, allocation: allocationWithoutPerson(item.allocation, action.personId) })),
        }),
        activePersonId: state.activePersonId === action.personId ? (remainingPeople[0]?.id ?? null) : state.activePersonId,
      }
    }
    case 'SET_PAID_AMOUNT':
      return {
        ...state,
        bill: touch({
          ...bill,
          people: bill.people.map((p) => (p.id === action.personId ? { ...p, paidAmount: Math.max(0, Math.round(action.amount)) } : p)),
        }),
      }
    case 'SET_SOLE_PAYER': {
      const { billTotal } = billTotalsOf(bill)
      return {
        ...state,
        bill: touch({
          ...bill,
          people: bill.people.map((p) => ({
            ...p,
            paidAmount: p.id === action.personId ? billTotal : 0,
          })),
        }),
      }
    }
    case 'SET_HEAD_PAYERS': {
      const headMap = new Map(action.headPayers.map((h) => [h.personId, h.amount]))
      return {
        ...state,
        bill: touch({
          ...bill,
          people: bill.people.map((p) => ({
            ...p,
            paidAmount: headMap.has(p.id) ? headMap.get(p.id)! : 0,
          })),
          headTailPreferences: action.tailPreferences !== undefined ? action.tailPreferences : bill.headTailPreferences,
        }),
      }
    }
    case 'SET_HEAD_TAIL_PREFERENCE': {
      return {
        ...state,
        bill: touch({
          ...bill,
          headTailPreferences: {
            ...(bill.headTailPreferences || {}),
            [action.tailPersonId]: action.headPersonId,
          },
        }),
      }
    }
    case 'CLEAR_HEAD_TAIL_PREFERENCES': {
      return {
        ...state,
        bill: touch({
          ...bill,
          headTailPreferences: undefined,
        }),
      }
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
