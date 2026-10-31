import type { SplitMode } from '@/types/split'
import { amountToInputString, formatMoney, parseAmount } from '@/lib/money'

export function parseUnits(raw: string): number | null {
  const trimmed = raw.trim()
  if (trimmed === '') return null
  const value = Math.round(Number(trimmed))
  if (!Number.isFinite(value) || value < 0 || value > 1_000_000) return null
  return value
}

export function parsePercent(raw: string): number | null {
  const trimmed = raw.trim()
  if (trimmed === '') return null
  const value = Number(trimmed)
  if (!Number.isFinite(value) || value < 0 || value > 100) return null
  return Math.round(value * 100) / 100
}

export function computeDraftStatus(
  mode: SplitMode,
  selectedIds: string[],
  entries: Record<string, string>,
  lineTotal: number,
  itemQuantity: number,
  currency: any
): { ok: boolean; text: string } {
  if (selectedIds.length === 0) {
    return { ok: false, text: 'No one is assigned yet — this product will count as unassigned.' }
  }
  switch (mode) {
    case 'equal':
      return {
        ok: true,
        text: `${formatMoney(Math.floor(lineTotal / selectedIds.length), currency)} each, split equally between ${selectedIds.length} ${selectedIds.length === 1 ? 'person' : 'people'} (remainder paise go to the first people).`,
      }
    case 'quantity': {
      const sum = selectedIds.reduce((s, id) => s + (parseUnits(entries[id] ?? '') ?? 0), 0)
      if (sum === itemQuantity) return { ok: true, text: `All ${itemQuantity} ${itemQuantity === 1 ? 'unit is' : 'units are'} assigned.` }
      return { ok: false, text: `${sum} of ${itemQuantity} units assigned — units consumed must add up to the quantity purchased.` }
    }
    case 'custom': {
      const sum = selectedIds.reduce((s, id) => s + (parseAmount(entries[id] ?? '') ?? 0), 0)
      if (sum === lineTotal) return { ok: true, text: `Amounts add up to the line total (${formatMoney(lineTotal, currency)}) exactly.` }
      const diff = Math.abs(sum - lineTotal)
      return {
        ok: false,
        text: sum < lineTotal
          ? `${formatMoney(diff, currency)} still unassigned (entered ${formatMoney(sum, currency)} of ${formatMoney(lineTotal, currency)}).`
          : `${formatMoney(diff, currency)} too much (entered ${formatMoney(sum, currency)} of ${formatMoney(lineTotal, currency)}).`,
      }
    }
    case 'percentage': {
      const sum = Math.round(selectedIds.reduce((s, id) => s + (parsePercent(entries[id] ?? '') ?? 0), 0) * 100) / 100
      if (sum === 100) return { ok: true, text: 'Percentages add up to exactly 100%.' }
      return { ok: false, text: `Percentages add up to ${sum}% — they must total exactly 100%.` }
    }
  }
}
