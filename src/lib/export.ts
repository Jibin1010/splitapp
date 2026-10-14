import type { Bill, CalculationResult, Paise } from '@/types/split'
import { formatMoney } from '@/lib/money'
import { lineTotalOf } from '@/lib/calculations'

/** CSV cell escaping per RFC 4180. */
function csvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function csvRow(cells: Array<string | number>): string {
  return cells.map((c) => csvCell(String(c))).join(',')
}

/**
 * Build a human-readable CSV summary of a calculated bill:
 * bill overview, products, per-person results and settlement transfers.
 */
export function buildCsv(bill: Bill, result: CalculationResult): string {
  const fmt = (p: Paise) => formatMoney(p, bill.currency)
  const rows: string[] = []

  rows.push(csvRow(['SplitLedger bill summary']))
  rows.push(csvRow(['Bill name', bill.name || 'Shared Bill']))
  rows.push(csvRow(['Currency', bill.currency]))
  rows.push(csvRow(['Items total', fmt(result.itemsTotal)]))
  rows.push(csvRow(['Adjustments total', fmt(result.adjustmentsTotal)]))
  rows.push(csvRow(['Bill total', fmt(result.billTotal)]))
  rows.push(csvRow(['Generated at', new Date().toISOString()]))
  rows.push('')

  rows.push(csvRow(['Products']))
  rows.push(csvRow(['Product', 'Quantity', 'Unit price', 'Line total', 'Split mode', 'Assigned to']))
  for (const item of bill.items) {
    const people = bill.people.filter((p) => (result.itemAllocations[item.id]?.[p.id] ?? 0) > 0)
    rows.push(
      csvRow([
        item.name || 'Untitled product',
        item.quantity,
        fmt(item.unitPrice),
        fmt(lineTotalOf(item)),
        item.allocation.mode,
        people.map((p) => p.name).join('; '),
      ]),
    )
  }
  rows.push('')

  rows.push(csvRow(['People']))
  rows.push(csvRow(['Name', 'Total share', 'Paid', 'Net balance']))
  for (const person of bill.people) {
    const r = result.people[person.id]
    if (!r) continue
    rows.push(csvRow([person.name, fmt(r.share), fmt(r.paid), fmt(r.net)]))
  }
  rows.push('')

  rows.push(csvRow(['Settlement instructions']))
  rows.push(csvRow(['From', 'To', 'Amount']))
  for (const s of result.settlements) {
    const from = bill.people.find((p) => p.id === s.fromPersonId)?.name ?? s.fromPersonId
    const to = bill.people.find((p) => p.id === s.toPersonId)?.name ?? s.toPersonId
    rows.push(csvRow([from, to, fmt(s.amount)]))
  }

  return rows.join('\r\n')
}

/** Trigger a CSV file download in the browser. */
export function downloadCsv(filename: string, content: string): void {
  if (typeof document === 'undefined') return
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** Open the browser print dialog (printable results page). */
export function printResults(): void {
  if (typeof window !== 'undefined') {
    window.print()
  }
}
