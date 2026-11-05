import type * as React from 'react'
import type {
  Adjustment,
  Allocation,
  Bill,
  BillVaultFile,
  CalculationResult,
  CurrencyCode,
  Paise,
  Person,
  ProductItem,
  ValidationIssue,
} from '@/types/split'

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
  /** Active person ID for multi-login perspective & personalized share highlighting */
  activePersonId: string | null
}

export type StoreAction =
  | { type: 'HYDRATE'; bill: Bill; activePersonId?: string | null }
  | { type: 'SET_ACTIVE_PERSON'; personId: string }
  | { type: 'SET_BILL_NAME'; name: string }
  | { type: 'ADD_ITEM'; item: ProductItem }
  | { type: 'UPDATE_ITEM'; itemId: string; patch: Partial<Pick<ProductItem, 'name' | 'quantity' | 'unitPrice'>> }
  | { type: 'REMOVE_ITEM'; itemId: string }
  | { type: 'DUPLICATE_ITEM'; itemId: string }
  | { type: 'SET_ALLOCATION'; itemId: string; allocation: Allocation }
  | { type: 'ADD_PERSON'; name: string; photo?: string; phone?: string; isPhoneVerified?: boolean; switchTo?: boolean }
  | { type: 'RENAME_PERSON'; personId: string; name: string }
  | { type: 'UPDATE_PERSON'; personId: string; name: string }
  | { type: 'SET_PERSON_PHOTO'; personId: string; photo: string }
  | { type: 'LOAD_50_DUMMY_PEOPLE' }
  | { type: 'LOAD_1000_VERIFIED_PEOPLE' }
  | { type: 'CLEAR_ITEMS_AND_ADJUSTMENTS' }
  | { type: 'CLEAR_ALL_ITEMS' }
  | {
      type: 'IMPORT_ANALYSIS_RESULT'
      items: ProductItem[]
      people?: Array<{ id?: string; name: string; photo?: string; paidAmount?: number }>
      adjustments?: Adjustment[]
      billName?: string
      vendor?: string
      date?: string
      invoiceNumber?: string
      payerPersonId?: string
      headPayers?: Array<{ personId: string; amount: number }>
      headTailPreferences?: Record<string, string>
      replaceExistingItems?: boolean
      replaceExistingPeople?: boolean
    }
  | { type: 'REMOVE_PERSON'; personId: string }
  | { type: 'SET_PAID_AMOUNT'; personId: string; amount: Paise }
  | { type: 'SET_SOLE_PAYER'; personId: string }
  | { type: 'SET_HEAD_PAYERS'; headPayers: Array<{ personId: string; amount: Paise }>; tailPreferences?: Record<string, string> }
  | { type: 'SET_HEAD_TAIL_PREFERENCE'; tailPersonId: string; headPersonId: string }
  | { type: 'CLEAR_HEAD_TAIL_PREFERENCES' }
  | { type: 'PAY_REMAINING'; personId: string }
  | { type: 'ADD_ADJUSTMENT'; adjustment: Adjustment }
  | { type: 'UPDATE_ADJUSTMENT'; adjustmentId: string; patch: Partial<Omit<Adjustment, 'id'>> }
  | { type: 'REMOVE_ADJUSTMENT'; adjustmentId: string }
  | { type: 'SET_CURRENCY'; currency: CurrencyCode }
  | { type: 'SET_VAULT_FILE'; vaultFile?: BillVaultFile }
  | { type: 'NEW_BILL'; currency: CurrencyCode }
  | { type: 'LOAD_BILL'; bill: Bill }
  | { type: 'CALCULATE_START' }
  | { type: 'CALCULATE_SUCCESS'; result: CalculationResult; calculatedFromUpdatedAt: string }
  | { type: 'CALCULATE_ERROR'; error: { message: string; issues: ValidationIssue[] } }
  | { type: 'MARK_SAVED'; savedAt: string }

export interface StoreContextValue {
  state: StoreState
  dispatch: React.Dispatch<StoreAction>
  /** Live, client-side preview computed by the same shared engine as the backend. */
  preview: CalculationResult
  /** True when the bill changed since the last successful calculation. */
  resultIsStale: boolean
  /** Active person profile for multi-login and highlighting */
  activePerson: Person | null
  /** Calculation result for the active person */
  activePersonResult: CalculationResult['people'][string] | null
  /** Switch perspective to another person */
  setActivePerson: (personId: string) => void
  /** Calculate exact line item share for active person in paise/cents */
  getItemShareForActivePerson: (itemId: string) => number
  /** Check if active person is included in a line item */
  isItemAssignedToActivePerson: (itemId: string) => boolean
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
  load50DummyPeople: () => void
  load1000VerifiedPeople: () => void
  clearItemsAndAdjustments: () => void
  draftSavedAt: string | null
}
