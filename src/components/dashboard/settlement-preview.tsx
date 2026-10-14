'use client'

import * as React from 'react'
import { ArrowRight, Calculator, ChevronDown, Download, Printer, TriangleAlert, Wallet } from 'lucide-react'
import { buildCsv, downloadCsv, printResults } from '@/lib/export'
import { formatMoney } from '@/lib/money'
import { useBillStore } from '@/lib/store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Bottom section: the prominent Calculate action plus the settlement
 * instructions — who pays whom, how much, and how that differs from what
 * everyone “owes” based on what they already paid.
 */
export function SettlementPreview() {
  const { state, calculate, resultIsStale } = useBillStore()
  const bill = state.bill
  const result = state.result

  const transfersTotal = result ? result.settlements.reduce((sum, s) => sum + s.amount, 0) : 0
  const nameOf = (id: string) => bill.people.find((p) => p.id === id)?.name ?? 'Unknown'

  const handleExportCsv = () => {
    if (!result) return
    const csv = buildCsv(bill, result)
    const filename =
      `${(bill.name || 'shared-bill').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}` || 'shared-bill'
    downloadCsv(`${filename}-split.csv`, csv)
  }

  return (
    <details open className="group rounded-xl border border-border bg-card shadow-sm">
      <summary className="flex items-center justify-between gap-2 p-4 text-sm font-semibold">
        <span className="flex items-center gap-2">
          <Wallet className="size-4 text-primary" aria-hidden />
          Settlement preview
        </span>
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
      </summary>

      <div className="space-y-4 border-t border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">Who pays whom to settle the bill with the fewest transfers.</p>
          <div className="no-print flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={!result} className="gap-1.5">
              <Download aria-hidden />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={printResults} disabled={!result} className="gap-1.5">
              <Printer aria-hidden />
              Print
            </Button>
            <Button onClick={() => void calculate()} disabled={state.calculating} className="gap-2">
              {state.calculating ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" aria-hidden />
                  Calculating…
                </>
              ) : (
                <>
                  <Calculator aria-hidden />
                  Calculate final split
                </>
              )}
            </Button>
          </div>
        </div>

        {state.error && (
          <div className="rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm text-danger" role="alert">
            <p className="mb-1.5 flex items-center gap-1.5 font-semibold">
              <TriangleAlert className="size-4 shrink-0" aria-hidden />
              The bill can’t be finalized yet
            </p>
            <p className="mb-1.5">{state.error.message}</p>
            <ul className="ml-5 list-disc space-y-1">
              {state.error.issues.map((issue, index) => (
                <li key={`${issue.code}-${index}`}>{issue.message}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs opacity-80">
              Nothing was lost — your products and assignments are exactly as you left them.
            </p>
          </div>
        )}

        {!result && !state.calculating && !state.error && (
          <p className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            Settlement instructions appear here once the bill calculates successfully — for example “Arjun pays Maya
            ₹610.00”.
          </p>
        )}

        {result && result.settlements.length === 0 && (
          <p className="rounded-lg border border-success/30 bg-success/5 p-4 text-sm text-success">
            Everyone is settled — no transfers needed.
          </p>
        )}

        {result && result.settlements.length > 0 && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {result.settlements.length} {result.settlements.length === 1 ? 'transfer' : 'transfers'}
              </Badge>
              <Badge variant="secondary">{formatMoney(transfersTotal, bill.currency)} in motion</Badge>
              {resultIsStale && <Badge variant="warning">Inputs changed — recalculate for updated numbers</Badge>}
            </div>

            <ul className="space-y-2">
              {result.settlements.map((settlement, index) => (
                <li key={index} className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
                  <span className="flex-1 text-sm">
                    <span className="font-semibold">{nameOf(settlement.fromPersonId)}</span>
                    <span className="text-muted-foreground"> pays </span>
                    <span className="font-semibold">{nameOf(settlement.toPersonId)}</span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-primary" aria-hidden />
                  <span className="text-sm font-bold tabular-nums text-primary">
                    {formatMoney(settlement.amount, bill.currency)}
                  </span>
                </li>
              ))}
            </ul>

            {/* Amount owed vs amount to transfer — different when people paid different portions. */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <caption className="mb-1.5 text-left text-xs text-muted-foreground">
                  “Owed” is each person’s share of the products; “to transfer” also accounts for what they already
                  paid.
                </caption>
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th scope="col" className="py-2 pr-3 font-medium">Person</th>
                    <th scope="col" className="py-2 px-3 text-right font-medium">Amount owed (share)</th>
                    <th scope="col" className="py-2 px-3 text-right font-medium">Already paid</th>
                    <th scope="col" className="py-2 pl-3 text-right font-medium">To transfer (net)</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.people.map((person) => {
                    const personResult = result.people[person.id]
                    if (!personResult) return null
                    return (
                      <tr key={person.id} className="border-b border-border/60 last:border-0">
                        <td className="py-2 pr-3 font-medium">{person.name}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{formatMoney(personResult.share, bill.currency)}</td>
                        <td className="py-2 px-3 text-right tabular-nums text-muted-foreground">
                          {formatMoney(personResult.paid, bill.currency)}
                        </td>
                        <td
                          className={cn(
                            'py-2 pl-3 text-right font-semibold tabular-nums',
                            personResult.net > 0 ? 'text-success' : personResult.net < 0 ? 'text-danger' : 'text-muted-foreground',
                          )}
                        >
                          {personResult.net > 0
                            ? `receives ${formatMoney(personResult.net, bill.currency)}`
                            : personResult.net < 0
                              ? `pays ${formatMoney(-personResult.net, bill.currency)}`
                              : 'settled'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </details>
  )
}
