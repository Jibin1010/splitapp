import type {
  PersonResult,
  Settlement,
} from '@/types/split'

/**
 * Deterministic settlement algorithm: match the largest debtor with the
 * largest creditor until every net balance reaches zero. Sorting is by
 * amount descending then name ascending, so identical inputs always
 * produce identical transfers.
 */
export function computeSettlements(
  people: Record<string, PersonResult>,
  orderedPeople: Array<{ id: string; name: string }>,
  preferredHeadMapping?: Record<string, string>,
): Settlement[] {
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

  // Apply user-defined Head & Tail preferences first (which tail pays which head)
  if (preferredHeadMapping && Object.keys(preferredHeadMapping).length > 0) {
    for (const debtor of debtors) {
      const preferredHeadId = preferredHeadMapping[debtor.id]
      if (preferredHeadId) {
        const creditor = creditors.find((c) => c.id === preferredHeadId)
        if (creditor && creditor.amount > 0 && debtor.amount > 0) {
          const amount = Math.min(debtor.amount, creditor.amount)
          if (amount > 0) {
            settlements.push({ fromPersonId: debtor.id, toPersonId: creditor.id, amount })
            debtor.amount -= amount
            creditor.amount -= amount
          }
        }
      }
    }
  }

  // Then settle remaining amounts with greedy matching
  let i = 0
  let j = 0
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]
    const creditor = creditors[j]
    if (debtor.amount === 0) {
      i++
      continue
    }
    if (creditor.amount === 0) {
      j++
      continue
    }
    const amount = Math.min(debtor.amount, creditor.amount)
    if (amount > 0) {
      settlements.push({ fromPersonId: debtor.id, toPersonId: creditor.id, amount })
    }
    debtor.amount -= amount
    creditor.amount -= amount
    if (debtor.amount === 0) i++
    if (creditor.amount === 0) j++
  }

  // Post-process: If one person has to pay multiple people (e.g. 2 persons),
  // make both transfers full whole amounts (round to full rupees / multiples of 100 paise),
  // eliminating fractional decimals like .27 / .98 / .99
  const transfersByDebtor = new Map<string, Settlement[]>()
  for (const s of settlements) {
    const list = transfersByDebtor.get(s.fromPersonId) || []
    list.push(s)
    transfersByDebtor.set(s.fromPersonId, list)
  }

  for (const [, transfers] of transfersByDebtor.entries()) {
    if (transfers.length > 1) {
      // One person has to pay 2 or more people: make full amounts for both/all
      const totalRawPaise = transfers.reduce((sum, t) => sum + t.amount, 0)
      const targetTotalPaise = Math.round(totalRawPaise / 100) * 100

      let running = 0
      transfers.forEach((t, idx) => {
        if (idx === transfers.length - 1) {
          t.amount = Math.max(0, targetTotalPaise - running)
        } else {
          const roundedAmount = Math.max(100, Math.round(t.amount / 100) * 100)
          t.amount = roundedAmount
          running += roundedAmount
        }
      })
    }
  }

  return settlements.filter((s) => s.amount > 0)
}
