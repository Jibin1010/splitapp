import type {
  Adjustment,
  Bill,
  Paise,
  ProductItem,
  ValidationIssue,
} from '@/types/split'
import { allocateProportionally, distributeEvenly, formatMoney } from '@/lib/money'

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

export function personOrderedIds(bill: Bill, ids: Iterable<string>): string[] {
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
      const shares = ids.map((id) => allocation.shares[id] ?? 0)
      const sumQty = shares.reduce((acc, q) => acc + q, 0)
      if (sumQty === 0) {
        issues.push({
          code: 'ITEM_UNASSIGNED',
          message: `“${itemName}” has no quantities assigned.`,
          itemId: item.id,
        })
        break
      }
      if (shares.some((q) => !Number.isInteger(q) || q < 0)) {
        issues.push({
          code: 'INVALID_ITEM',
          message: `“${itemName}”: quantities must be non-negative whole numbers.`,
          itemId: item.id,
        })
        break
      }
      if (sumQty !== item.quantity) {
        issues.push({
          code: 'QUANTITY_MISMATCH',
          message: `“${itemName}”: assigned ${sumQty} of ${item.quantity} units (${item.quantity - sumQty > 0 ? `${item.quantity - sumQty} unassigned` : `${sumQty - item.quantity} over-assigned`}).`,
          itemId: item.id,
        })
      }
      // Allocation proceeds based on actual unit price, capping at lineTotal.
      // Any remainder/over-assigned paise is represented accurately so the UI
      // can show the discrepancy.
      for (let i = 0; i < ids.length; i++) {
        const qty = shares[i]
        if (qty > 0) perPerson[ids[i]] = qty * item.unitPrice
      }
      assigned = Object.values(perPerson).reduce((acc, p) => acc + p, 0)
      break
    }
    case 'custom': {
      const ids = personOrderedIds(bill, Object.keys(allocation.shares))
      let sumCustom = 0
      for (const id of ids) {
        const amount = allocation.shares[id] ?? 0
        if (amount < 0) {
          issues.push({
            code: 'INVALID_ITEM',
            message: `“${itemName}”: custom amounts cannot be negative.`,
            itemId: item.id,
          })
          break
        }
        if (amount > 0) {
          perPerson[id] = amount
          sumCustom += amount
        }
      }
      assigned = sumCustom
      if (sumCustom === 0) {
        issues.push({
          code: 'ITEM_UNASSIGNED',
          message: `“${itemName}” has no amounts assigned.`,
          itemId: item.id,
        })
      } else if (sumCustom !== lineTotal) {
        const diff = lineTotal - sumCustom
        issues.push({
          code: 'CUSTOM_SUM_MISMATCH',
          message: `“${itemName}”: custom shares total ${formatMoney(sumCustom, bill.currency)} instead of ${formatMoney(lineTotal, bill.currency)} (${diff > 0 ? `${formatMoney(diff, bill.currency)} unassigned` : `${formatMoney(-diff, bill.currency)} over-assigned`}).`,
          itemId: item.id,
        })
      }
      break
    }
    case 'percentage': {
      const ids = personOrderedIds(bill, Object.keys(allocation.shares))
      const basisPoints = ids.map((id) => Math.round((allocation.shares[id] ?? 0) * 100))
      const sumBp = basisPoints.reduce((acc, bp) => acc + bp, 0)
      if (sumBp === 0) {
        issues.push({
          code: 'ITEM_UNASSIGNED',
          message: `“${itemName}” has 0% assigned.`,
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
