/**
 * Core domain types for SplitLedger.
 *
 * All monetary amounts are stored as integers in the smallest currency unit
 * ("paise" for INR — 1 rupee = 100 paise). Never use floating point for money.
 */

/** Integer amount in the smallest currency unit (paise for INR, cents for USD). */
export type Paise = number

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP'

export type SplitMode = 'equal' | 'quantity' | 'custom' | 'percentage'

/** A participant in a bill. Identified by a stable local id; names must be unique per bill. */
export interface Person {
  id: string
  name: string
  /** Amount this person paid toward the bill, in paise. */
  paidAmount: Paise
  /** Optional URL or data URI for the person's profile photo or avatar. */
  photo?: string
}

/**
 * Allocation rules for one product row.
 * - equal:      listed participants split the line total evenly.
 * - quantity:   units consumed per participant (must sum to the item quantity).
 * - custom:     exact paise amounts per participant (must sum to the line total).
 * - percentage: percent weights per participant (must sum to exactly 100).
 */
export type Allocation =
  | { mode: 'equal'; participantIds: string[] }
  | { mode: 'quantity'; shares: Record<string, number> }
  | { mode: 'custom'; shares: Record<string, Paise> }
  | { mode: 'percentage'; shares: Record<string, number> }

export interface ProductItem {
  id: string
  name: string
  /** Units purchased. Integer >= 1. */
  quantity: number
  /** Price of one unit, in paise. Integer >= 0. */
  unitPrice: Paise
  allocation: Allocation
  imageUrl?: string
}

export type AdjustmentKind = 'service_charge' | 'tax' | 'discount'

/** Optional bill-level adjustment (service charge, tax or discount). */
export interface Adjustment {
  id: string
  label: string
  kind: AdjustmentKind
  /** 'percent' works off the items subtotal; 'fixed' is a flat paise amount. */
  method: 'percent' | 'fixed'
  /** Percent value (10 = 10%) when method = 'percent', otherwise paise. */
  value: number
  /** Optional custom percentage shares per person (personId -> percentage 0..100) */
  shares?: Record<string, number>
}

export interface Bill {
  id: string
  /** Empty string means "Shared Bill" placeholder is shown. */
  name: string
  currency: CurrencyCode
  items: ProductItem[]
  people: Person[]
  adjustments: Adjustment[]
  vendor?: string
  date?: string
  invoiceNumber?: string
  /** Tail person ID -> Preferred Head person ID mapping */
  headTailPreferences?: Record<string, string>
  createdAt: string
  updatedAt: string
}

export interface Settlement {
  fromPersonId: string
  toPersonId: string
  amount: Paise
}

export type IssueCode =
  | 'EMPTY_BILL'
  | 'NO_PEOPLE'
  | 'DUPLICATE_NAME'
  | 'INVALID_ITEM'
  | 'INVALID_PERSON'
  | 'INVALID_ADJUSTMENT'
  | 'ITEM_UNASSIGNED'
  | 'CUSTOM_SUM_MISMATCH'
  | 'PERCENT_SUM_MISMATCH'
  | 'QUANTITY_MISMATCH'
  | 'PAID_TOTAL_MISMATCH'
  | 'NEGATIVE_TOTAL'

export interface ValidationIssue {
  code: IssueCode
  message: string
  itemId?: string
  personId?: string
  adjustmentId?: string
}

export interface PersonResult {
  personId: string
  /** Total share across all items and adjustments, in paise. */
  share: Paise
  paid: Paise
  /** paid - share. Positive: owed money. Negative: owes money. */
  net: Paise
  /** itemId -> paise contribution (items only, before adjustments). */
  itemContributions: Record<string, Paise>
}

export interface CalculationResult {
  valid: boolean
  issues: ValidationIssue[]
  itemsTotal: Paise
  /** Net effect of all adjustments (charges positive, discounts negative). */
  adjustmentsTotal: Paise
  billTotal: Paise
  /** Value in product rows not covered by any allocation, in paise. */
  unassignedValue: Paise
  /** itemId -> (personId -> paise). */
  itemAllocations: Record<string, Record<string, Paise>>
  /** adjustmentId -> (personId -> signed paise). */
  adjustmentAllocations: Record<string, Record<string, Paise>>
  /** personId -> result. */
  people: Record<string, PersonResult>
  /** Only produced when the bill is fully valid. */
  settlements: Settlement[]
}

export interface CalculateSuccess {
  ok: true
  result: CalculationResult
}

export interface CalculateFailure {
  ok: false
  error: {
    code: 'VALIDATION_ERROR' | 'INVALID_JSON' | 'INTERNAL_ERROR'
    message: string
    issues?: ValidationIssue[]
  }
}

export type CalculateResponse = CalculateSuccess | CalculateFailure

/** A named snapshot stored in the local history. */
export interface HistoryEntry {
  id: string
  savedAt: string
  bill: Bill
  result: CalculationResult | null
}

export interface Settings {
  currency: CurrencyCode
}
