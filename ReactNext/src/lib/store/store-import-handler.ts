import type { Bill, Person } from '@/types/split'
import { getRandomAvatarForName } from '@/lib/dummy-people'
import { newId } from '@/lib/id'
import type { StoreAction, StoreState } from './store-types'

export function touch(bill: Bill): Bill {
  return { ...bill, updatedAt: new Date().toISOString() }
}

export function handleImportAnalysisResult(
  state: StoreState,
  action: Extract<StoreAction, { type: 'IMPORT_ANALYSIS_RESULT' }>
): StoreState {
  const bill = state.bill
  const itemsTotal = action.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const adjustmentsTotal = (action.adjustments || []).reduce((sum, adj) => {
    if (adj.method === 'fixed') {
      return sum + (adj.kind === 'discount' ? -adj.value : adj.value)
    }
    const pct = Math.round((itemsTotal * adj.value) / 100)
    return sum + (adj.kind === 'discount' ? -pct : pct)
  }, 0)
  const billTotal = Math.max(0, itemsTotal + adjustmentsTotal)

  let newPeople: Person[] = bill.people
  if (action.replaceExistingPeople && action.people && action.people.length > 0) {
    newPeople = action.people.map((p, idx) => {
      let paid = p.paidAmount || 0
      if (action.headPayers && action.headPayers.length > 0) {
        const hp = action.headPayers.find((h) => h.personId === p.id)
        paid = hp ? hp.amount : 0
      } else if (action.payerPersonId === 'split_equal') {
        paid = Math.round(billTotal / action.people!.length)
      } else if (action.payerPersonId) {
        paid = p.id === action.payerPersonId ? billTotal : 0
      } else if (idx === 0 && (!p.paidAmount || p.paidAmount === 0)) {
        // Default first person paid so bill can calculate immediately
        paid = billTotal
      }
      return {
        id: p.id || newId('person'),
        name: p.name.trim(),
        paidAmount: paid,
        photo: p.photo || getRandomAvatarForName(p.name),
      }
    })
  } else if (action.people && action.people.length > 0) {
    const currentPersonNames = new Set(bill.people.map((p) => p.name.trim().toLowerCase()))
    const currentPersonIds = new Set(bill.people.map((p) => p.id))
    const addedPeople = action.people
      .filter((p) => !currentPersonIds.has(p.id || '') && !currentPersonNames.has(p.name.trim().toLowerCase()))
      .map((p) => ({
        id: p.id || newId('person'),
        name: p.name.trim(),
        paidAmount: p.paidAmount || 0,
        photo: p.photo || getRandomAvatarForName(p.name),
      }))
    newPeople = [...bill.people, ...addedPeople]
  }

  const newItems = action.replaceExistingItems ? action.items : [...bill.items, ...action.items]
  const newAdjustments = action.replaceExistingItems
    ? (action.adjustments || [])
    : (action.adjustments?.length ? [...bill.adjustments, ...action.adjustments] : bill.adjustments)

  const finalName = action.billName?.trim() ||
    (action.vendor ? `${action.vendor}${action.invoiceNumber ? ` #${action.invoiceNumber}` : ''}` : bill.name)

  return {
    ...state,
    bill: touch({
      ...bill,
      name: finalName,
      vendor: action.vendor,
      date: action.date,
      invoiceNumber: action.invoiceNumber,
      people: newPeople,
      items: newItems,
      adjustments: newAdjustments,
      headTailPreferences: action.headTailPreferences || bill.headTailPreferences,
    }),
    result: null,
    error: null,
  }
}
