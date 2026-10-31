import type {
  Allocation,
  Bill,
  CalculationResult,
  Paise,
  PersonResult,
  ValidationIssue,
} from '@/types/split'
import { allocateProportionally, formatMoney } from '@/lib/money'
import {
  normalizeName,
  lineTotalOf,
  computeAdjustmentAmount,
  assignedIdsOf,
  computeItemAllocation,
  type ItemComputation,
} from './calculations/item-allocation'
import { computeSettlements } from './calculations/settlement-engine'

export {
  normalizeName,
  lineTotalOf,
  computeAdjustmentAmount,
  assignedIdsOf,
  computeItemAllocation,
  type ItemComputation,
  computeSettlements,
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
    const hasCustomShares = adj.shares && Object.keys(adj.shares).length > 0
    if (hasCustomShares) {
      const activeShares = adj.shares!
      const participants = bill.people.filter((p) => (activeShares[p.id] ?? 0) > 0)
      const totalPercent = Object.values(activeShares).reduce((a, b) => a + b, 0)
      if (Math.round(totalPercent) !== 100) {
        issues.push({
          code: 'PERCENT_SUM_MISMATCH',
          message: `“${label}”: percentage shares add up to ${totalPercent.toFixed(1)}% — they must total 100%.`,
          adjustmentId: adj.id,
        })
      }
      if (participants.length > 0) {
        const basisPoints = participants.map((p) => Math.round((activeShares[p.id] || 0) * 100))
        const parts = allocateProportionally(Math.abs(amount), basisPoints)
        bill.people.forEach((p) => {
          const idx = participants.findIndex((sp) => sp.id === p.id)
          allocation[p.id] = idx >= 0 ? (amount < 0 ? -parts[idx] : parts[idx]) : 0
        })
      } else {
        bill.people.forEach((p) => {
          allocation[p.id] = 0
        })
      }
    } else if (shareSum > 0) {
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
  const settlements = valid ? computeSettlements(people, bill.people, bill.headTailPreferences) : []

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
