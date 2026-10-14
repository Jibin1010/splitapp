import type {
  Adjustment,
  Allocation,
  Bill,
  CalculationResult,
  Paise,
  PersonResult,
  ProductItem,
  Settlement,
  ValidationIssue,
} from '@/types/split'
import { allocateProportionally, distributeEvenly, formatMoney } from '@/lib/money'

/**
 * SplitLedger calculation engine.
 *
 * This module is the single source of truth for every financial rule in the
 * app. The API route and the browser UI both import it, so displayed totals
 * can never drift from the official backend result.
 *
 * Accuracy rules enforced here:
 *  1. All arithmetic uses integer paise — no floating point money.
 *  2. Remainder paise are distributed deterministically — sums never drift.
 *  3. Incomplete or mismatched allocations block finalization.
 *  4. Paid totals must match the bill total before settlements are produced.
 */

/** Trim, lowercase and collapse internal whitespace so names compare consistently. */
export function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Line total for a product row: quantity x unit price (integer paise). */
export function lineTotalOf(item: ProductItem): Paise {
  return item.quantity * item.unitPrice
}

/** Signed effect of an adjustment on the bill (discounts are negative). */
export function computeAdjustmentAmount(adj: Adjustment, itemsTotal: Paise): Paise {
  const raw = adj.method === 'percent' ? Math.round((itemsTotal * adj.value) / 100) : adj.value
  return adj.kind === 'discount' ? -raw : raw
}

/** Person ids referenced by an allocation, in bill.people order. */
export function assignedIdsOf(item: ProductItem): string[] {
  const a = item.allocation
  switch (a.mode) {
    case 'equal':
      return a.participantIds.filter((id) => id !== '')
    case 'quantity':
    case 'percentage':
      return Object.keys(a.shares).filter((id) => a.shares[id] > 0)
    case 'custom':
      return Object.keys(a.shares).filter((id) => a.shares[id] !== 0)
  }
}

function personOrderedIds(bill: Bill, ids: Iterable<string>): string[] {
  const set = new Set(ids)
  return bill.people.filter((p) => set.has(p.id)).map((p) => p.id)
}

export interface ItemComputation {
  lineTotal: Paise
  /** personId -> paise owed for this item. */
  perPerson: Record<string, Paise>
  assigned: Paise
  issues: ValidationIssue[]
}

/**
 * Compute one product row's allocation. Also usable standalone by the UI to
 * preview an item assignment before saving it (pass a minimal bill-like object
 * containing the current people).
 */
export function computeItemAllocation(bill: Bill, item: ProductItem): ItemComputation {
  const lineTotal = lineTotalOf(item)
  const allocation = item.allocation
  const perPerson: Record<string, Paise> = {}
  const issues: ValidationIssue[] = []
  let assigned = 0

  const addAll = (entries: Array<[string, Paise]>) => {
    for (const [id, amount] of entries) {
      if (amount === 0) continue
      perPerson[id] = amount
      assigned += amount
    }
  }

  const itemName = item.name.trim() || 'Untitled product'

  switch (allocation.mode) {
    case 'equal': {
      const ids = personOrderedIds(bill, allocation.participantIds)
      if (ids.length === 0) {
        issues.push({
          code: 'ITEM_UNASSIGNED',
          message: `“${itemName}” is not assigned to anyone yet.`,
          itemId: item.id,
        })
        break
      }
      const parts = distributeEvenly(lineTotal, ids.length)
      addAll(ids.map((id, i) => [id, parts[i]] as [string, Paise]))
      break
    }
    case 'quantity': {
      const ids = personOrderedIds(bill, Object.keys(allocation.shares))
      const units = ids.map((id) => allocation.shares[id])
      const totalUnits = units.reduce((a, b) => a + b, 0)
      if (ids.length === 0 || totalUnits === 0) {
        issues.push({
          code: 'ITEM_UNASSIGNED',
          message: `“${itemName}” is not assigned to anyone yet.`,
          itemId: item.id,
        })
        break
      }
      if (units.some((u) => !Number.isInteger(u) || u < 0)) {
        issues.push({
          code: 'INVALID_ITEM',
          message: `“${itemName}”: units consumed must be whole numbers.`,
          itemId: item.id,
        })
        break
      }
      if (totalUnits !== item.quantity) {
        issues.push({
          code: 'QUANTITY_MISMATCH',
          message: `“${itemName}”: ${totalUnits} of ${item.quantity} units are assigned to people. Units consumed must add up to the quantity purchased.`,
          itemId: item.id,
        })
      }
      addAll(ids.filter((id) => allocation.shares[id] > 0).map((id) => [id, allocation.shares[id] * item.unitPrice] as [string, Paise]))
      break
    }
    case 'custom': {
      const ids = personOrderedIds(bill, Object.keys(allocation.shares))
      const entries = ids.map((id) => [id, allocation.shares[id]] as [string, Paise])
      const sum = entries.reduce((s, [, v]) => s + v, 0)
      if (entries.length === 0 || sum === 0) {
        issues.push({
          code: 'ITEM_UNASSIGNED',
          message: `“${itemName}” is not assigned to anyone yet.`,
          itemId: item.id,
        })
        break
      }
      if (entries.some(([, v]) => v < 0)) {
        issues.push({
          code: 'INVALID_ITEM',
          message: `“${itemName}”: custom amounts cannot be negative.`,
          itemId: item.id,
        })
        break
      }
      if (sum !== lineTotal) {
        const diff = Math.abs(sum - lineTotal)
        issues.push({
          code: 'CUSTOM_SUM_MISMATCH',
          message: `“${itemName}”: custom amounts add up to ${formatMoney(sum)}, but the line total is ${formatMoney(lineTotal)} (off by ${formatMoney(diff)}).`,
          itemId: item.id,
        })
      }
      addAll(entries)
      break
    }
    case 'percentage': {
      const ids = personOrderedIds(bill, Object.keys(allocation.shares))
      const basisPoints = ids.map((id) => Math.round(allocation.shares[id] * 100))
      const sumBp = basisPoints.reduce((a, b) => a + b, 0)
      if (ids.length === 0 || sumBp === 0) {
        issues.push({
          code: 'ITEM_UNASSIGNED',
          message: `“${itemName}” is not assigned to anyone yet.`,
          itemId: item.id,
        })
        break
      }
      if (basisPoints.some((bp) => bp < 0)) {
        issues.push({
          code: 'INVALID_ITEM',
          message: `“${itemName}”: percentages cannot be negative.`,
          itemId: item.id,
        })
        break
      }
      if (sumBp !== 10000) {
        issues.push({
          code: 'PERCENT_SUM_MISMATCH',
          message: `“${itemName}”: percentages add up to ${sumBp / 100}% — they must total exactly 100%.`,
          itemId: item.id,
        })
      }
      // Best-effort proportional preview even while invalid, so the UI stays informative.
      // At this point sumBp > 0 (zero/negative sums break above), so this never throws.
      const parts = allocateProportionally(lineTotal, basisPoints)
      addAll(ids.map((id, i) => [id, parts[i]] as [string, Paise]))
      break
    }
  }

  return { lineTotal, perPerson, assigned, issues }
}

/**
 * Deterministic settlement algorithm: match the largest debtor with the
 * largest creditor until every net balance reaches zero. Sorting is by
 * amount descending then name ascending, so identical inputs always
 * produce identical transfers.
 */
export function computeSettlements(people: Record<string, PersonResult>, orderedPeople: Array<{ id: string; name: string }>): Settlement[] {
  const nameOf = (id: string) => orderedPeople.find((p) => p.id === id)?.name ?? id
  const debtors = Object.values(people)
    .filter((r) => r.net < 0)
    .map((r) => ({ id: r.personId, amount: -r.net }))
    .sort((a, b) => b.amount - a.amount || nameOf(a.id).localeCompare(nameOf(b.id)))
  const creditors = Object.values(people)
    .filter((r) => r.net > 0)
    .map((r) => ({ id: r.personId, amount: r.net }))
    .sort((a, b) => b.amount - a.amount || nameOf(a.id).localeCompare(nameOf(b.id)))

  const settlements: Settlement[] = []
  let i = 0
  let j = 0
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]
    const creditor = creditors[j]
    const amount = Math.min(debtor.amount, creditor.amount)
    if (amount > 0) {
      settlements.push({ fromPersonId: debtor.id, toPersonId: creditor.id, amount })
    }
    debtor.amount -= amount
    creditor.amount -= amount
    if (debtor.amount === 0) i++
    if (creditor.amount === 0) j++
  }
  return settlements
}

/**
 * Validate the bill and compute all shares, totals and settlements.
 * Always returns a full result object — `valid` is true only when
 * `issues` is empty; settlements are produced exclusively for valid bills.
 */
export function calculateBill(bill: Bill): CalculationResult {
  const issues: ValidationIssue[] = []
  const currency = bill.currency
  const fmt = (p: Paise) => formatMoney(p, currency)

  const itemAllocations: Record<string, Record<string, Paise>> = {}
  let itemsTotal = 0
  let unassignedValue = 0

  if (bill.items.length === 0) {
    issues.push({ code: 'EMPTY_BILL', message: 'Add at least one product before calculating.' })
  }
  if (bill.people.length === 0) {
    issues.push({ code: 'NO_PEOPLE', message: 'Add at least one person before calculating.' })
  }

  // Duplicate / empty person names.
  const nameCounts = new Map<string, { count: number; firstId: string }>()
  for (const person of bill.people) {
    const name = person.name.trim()
    if (!name) {
      issues.push({
        code: 'INVALID_PERSON',
        message: 'Every person needs a name.',
        personId: person.id,
      })
      continue
    }
    const key = normalizeName(name)
    const entry = nameCounts.get(key)
    if (entry) {
      issues.push({
        code: 'DUPLICATE_NAME',
        message: `“${name}” is already a participant. Names must be unique (differences in spacing or capitalization don’t count).`,
        personId: person.id,
      })
    } else {
      nameCounts.set(key, { count: 1, firstId: person.id })
    }
  }

  // Items: structural validation + per-item allocation.
  for (const item of bill.items) {
    const lineTotal = lineTotalOf(item)
    if (!item.name.trim()) {
      issues.push({
        code: 'INVALID_ITEM',
        message: 'Every product needs a name.',
        itemId: item.id,
      })
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 1_000_000) {
      issues.push({
        code: 'INVALID_ITEM',
        message: `“${item.name.trim() || 'Untitled product'}” has an invalid quantity.`,
        itemId: item.id,
      })
    }
    if (!Number.isInteger(item.unitPrice) || item.unitPrice < 0 || item.unitPrice > 1_000_000_000) {
      issues.push({
        code: 'INVALID_ITEM',
        message: `“${item.name.trim() || 'Untitled product'}” has an invalid unit price.`,
        itemId: item.id,
      })
    }
    itemsTotal += Number.isFinite(lineTotal) ? lineTotal : 0

    const computed = computeItemAllocation(bill, item)
    itemAllocations[item.id] = computed.perPerson
    issues.push(...computed.issues)
    const missing = computed.lineTotal - computed.assigned
    if (missing > 0) unassignedValue += missing
  }

  // Item share totals per person (used as weights for adjustments).
  const shareTotals: Record<string, Paise> = {}
  for (const person of bill.people) {
    let share = 0
    for (const item of bill.items) {
      const amount = itemAllocations[item.id]?.[person.id]
      if (amount) share += amount
    }
    shareTotals[person.id] = share
  }
  const shareSum = bill.people.reduce((s, p) => s + shareTotals[p.id], 0)

  // Bill-level adjustments, allocated proportionally to each person's item share.
  const adjustmentAllocations: Record<string, Record<string, Paise>> = {}
  let adjustmentsTotal = 0
  for (const adj of bill.adjustments) {
    const label = adj.label.trim() || 'Adjustment'
    if (adj.method === 'percent' && (!Number.isFinite(adj.value) || adj.value <= 0 || adj.value > 100)) {
      issues.push({
        code: 'INVALID_ADJUSTMENT',
        message: `“${label}”: percentage adjustments must be between 0 and 100.`,
        adjustmentId: adj.id,
      })
      continue
    }
    if (adj.method === 'fixed' && (!Number.isInteger(adj.value) || adj.value < 0)) {
      issues.push({
        code: 'INVALID_ADJUSTMENT',
        message: `“${label}”: fixed amounts must be zero or more.`,
        adjustmentId: adj.id,
      })
      continue
    }
    const amount = computeAdjustmentAmount(adj, itemsTotal)
    adjustmentsTotal += amount

    const allocation: Record<string, Paise> = {}
    if (shareSum > 0) {
      const weights = bill.people.map((p) => shareTotals[p.id])
      const parts = allocateProportionally(Math.abs(amount), weights)
      bill.people.forEach((p, i) => {
        allocation[p.id] = amount < 0 ? -parts[i] : parts[i]
      })
    } else {
      // No item shares to proportionally weight against (bill is invalid anyway).
      bill.people.forEach((p) => {
        allocation[p.id] = 0
      })
    }
    adjustmentAllocations[adj.id] = allocation
  }

  const billTotal = itemsTotal + adjustmentsTotal
  if (billTotal < 0) {
    issues.push({
      code: 'NEGATIVE_TOTAL',
      message: 'Discounts exceed the bill subtotal.',
    })
  }

  // Per-person results.
  const people: Record<string, PersonResult> = {}
  let paidTotal = 0
  for (const person of bill.people) {
    const itemContributions: Record<string, Paise> = {}
    let share = 0
    for (const item of bill.items) {
      const amount = itemAllocations[item.id]?.[person.id]
      if (amount) {
        itemContributions[item.id] = amount
        share += amount
      }
    }
    for (const adj of bill.adjustments) {
      const amount = adjustmentAllocations[adj.id]?.[person.id]
      if (amount) share += amount
    }
    if (!Number.isInteger(person.paidAmount) || person.paidAmount < 0) {
      issues.push({
        code: 'INVALID_PERSON',
        message: `“${person.name.trim() || 'Unnamed person'}” has an invalid paid amount.`,
        personId: person.id,
      })
    }
    const paid = Number.isInteger(person.paidAmount) && person.paidAmount >= 0 ? person.paidAmount : 0
    paidTotal += paid
    people[person.id] = {
      personId: person.id,
      share,
      paid,
      net: paid - share,
      itemContributions,
    }
  }

  // Payer reconciliation: total paid must equal the bill total.
  if (bill.items.length > 0 && bill.people.length > 0 && paidTotal !== billTotal) {
    const diff = Math.abs(billTotal - paidTotal)
    issues.push({
      code: 'PAID_TOTAL_MISMATCH',
      message:
        paidTotal === 0
          ? `Record who paid the bill — nothing has been marked as paid yet (bill total ${fmt(billTotal)}).`
          : `The amount marked as paid (${fmt(paidTotal)}) doesn’t match the bill total (${fmt(billTotal)}). Difference: ${fmt(diff)}.`,
    })
  }

  const valid = issues.length === 0
  const settlements = valid ? computeSettlements(people, bill.people) : []

  return {
    valid,
    issues,
    itemsTotal,
    adjustmentsTotal,
    billTotal,
    unassignedValue,
    itemAllocations,
    adjustmentAllocations,
    people,
    settlements,
  }
}

/** Convenience for the summary cards: quick totals without a full result object. */
export function billTotalsOf(bill: Bill): { itemsTotal: Paise; adjustmentsTotal: Paise; billTotal: Paise } {
  let itemsTotal = 0
  for (const item of bill.items) {
    const lt = lineTotalOf(item)
    if (Number.isFinite(lt)) itemsTotal += lt
  }
  let adjustmentsTotal = 0
  for (const adj of bill.adjustments) {
    adjustmentsTotal += computeAdjustmentAmount(adj, itemsTotal)
  }
  return { itemsTotal, adjustmentsTotal, billTotal: itemsTotal + adjustmentsTotal }
}

/** Remove a person from every allocation (used when deleting a participant). */
export function allocationWithoutPerson(allocation: Allocation, personId: string): Allocation {
  switch (allocation.mode) {
    case 'equal':
      return { mode: 'equal', participantIds: allocation.participantIds.filter((id) => id !== personId) }
    case 'quantity': {
      const shares = { ...allocation.shares }
      delete shares[personId]
      return { mode: 'quantity', shares }
    }
    case 'custom': {
      const shares = { ...allocation.shares }
      delete shares[personId]
      return { mode: 'custom', shares }
    }
    case 'percentage': {
      const shares = { ...allocation.shares }
      delete shares[personId]
      return { mode: 'percentage', shares }
    }
  }
}
