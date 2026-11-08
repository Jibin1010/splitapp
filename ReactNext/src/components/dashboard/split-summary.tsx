'use client'

import { ChevronDown, Clock, ListChecks, RefreshCw, TriangleAlert } from 'lucide-react'
import { formatMoney } from '@/lib/money'
import { useBillStore } from '@/lib/store'
import { Badge } from '@/components/ui/badge'
import { PersonAvatar } from '@/components/ui/person-avatar'
import { cn } from '@/lib/utils'

/**
 * Per-participant totals: precise share, amount paid, final net balance and
 * the items contributing to each total. Shows “Awaiting calculation” until
 * the backend returns an official result, plus live blockers produced by the
 * same shared engine.
 */
export function SplitSummary() {
  const { state, preview, resultIsStale } = useBillStore()
  const bill = state.bill
  const result = state.result
  const activeResult = result && !resultIsStale ? result : preview
  const liveIssues = preview.issues

  return (
    <details open className="group rounded-2xl border border-border/90 bg-card shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
      <summary className="flex items-center justify-between gap-2 p-4 text-sm font-bold">
        <span className="flex items-center gap-2">
          <ListChecks className="size-4 text-zinc-900" aria-hidden />
          Split summary
        </span>
        <span className="flex items-center gap-2">
          {result ? (
            resultIsStale ? (
              <Badge variant="warning">
                <RefreshCw aria-hidden />
                Recalculate
              </Badge>
            ) : (
              <Badge variant="success">Calculated</Badge>
            )
          ) : (
            <Badge variant="secondary">
              <Clock aria-hidden />
              Awaiting calculation
            </Badge>
          )}
          <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
        </span>
      </summary>

      <div className="space-y-3 border-t border-border p-4">
        <p className="text-xs text-muted-foreground">What each person owes for the products they shared.</p>

        {state.calculating && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
            <span className="size-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden />
            Calculating shares…
          </p>
        )}

        {state.error && (
          <div className="rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger" role="alert">
            <p className="mb-1 flex items-center gap-1.5 font-medium">
              <TriangleAlert className="size-4 shrink-0" aria-hidden />
              Calculation failed
            </p>
            <p className="mb-1">{state.error.message}</p>
            {state.error.issues.length > 0 && (
              <ul className="ml-5 list-disc space-y-0.5">
                {state.error.issues.map((issue, index) => (
                  <li key={`${issue.code}-${index}`}>{issue.message}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {!result && !state.calculating && liveIssues.length > 0 && (
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm text-warning">
            <p className="mb-1 font-medium">
              Before calculating, fix {liveIssues.length === 1 ? 'this issue' : `these ${liveIssues.length} issues`}:
            </p>
            <ul className="ml-5 list-disc space-y-0.5">
              {liveIssues.slice(0, 4).map((issue, index) => (
                <li key={`${issue.code}-${index}`}>{issue.message}</li>
              ))}
              {liveIssues.length > 4 && <li>…and {liveIssues.length - 4} more</li>}
            </ul>
          </div>
        )}

        {!result && !state.calculating && liveIssues.length === 0 && (
          <p className="rounded-lg border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">
            Awaiting calculation — press “Calculate final split” below once every product is assigned and the
            bill payment is recorded.
          </p>
        )}

        {activeResult && bill.people.length > 0 && (
          <ul className="divide-y divide-border">
            {bill.people.map((person) => {
              const personResult = activeResult.people[person.id]
              if (!personResult) return null
              const contributionEntries = Object.entries(personResult.itemContributions)
              return (
                <li key={person.id} className="py-2.5">
                  <details className="group nested">
                    <summary className="flex items-center gap-2.5 rounded-md py-0.5 pr-1 transition-colors hover:bg-muted/50">
                      <ChevronDown
                        className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                        aria-hidden
                      />
                      <PersonAvatar name={person.name} photo={person.photo} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{person.name}</span>
                        <span className="text-xs text-muted-foreground">
                          Paid {formatMoney(personResult.paid, bill.currency)}
                          {contributionEntries.length > 0 &&
                            ` · ${contributionEntries.length} ${contributionEntries.length === 1 ? 'item' : 'items'}`}
                        </span>
                      </span>
                      <span className="text-right">
                        <span className="block text-sm font-semibold tabular-nums">
                          {formatMoney(personResult.share, bill.currency)}
                        </span>
                        <span
                          className={cn(
                            'block text-xs font-medium tabular-nums',
                            personResult.net > 0
                              ? 'text-success'
                              : personResult.net < 0
                                ? 'text-danger'
                                : 'text-muted-foreground',
                          )}
                        >
                          {personResult.net > 0
                            ? `gets back ${formatMoney(personResult.net, bill.currency)}`
                            : personResult.net < 0
                              ? `owes ${formatMoney(-personResult.net, bill.currency)}`
                              : 'settled'}
                        </span>
                      </span>
                    </summary>
                    <div className="ml-6 mt-1.5 space-y-1 rounded-lg bg-muted/40 p-2.5 text-xs">
                      {contributionEntries.length === 0 && activeResult.adjustmentsTotal === 0 ? (
                        <p className="text-muted-foreground">No items assigned.</p>
                      ) : (
                        <ul className="space-y-0.5">
                          {contributionEntries.map(([itemId, amount]) => {
                            const item = bill.items.find((i) => i.id === itemId)
                            return (
                              <li key={itemId} className="flex justify-between gap-3">
                                <span className="truncate text-muted-foreground">{item?.name || 'Removed product'}</span>
                                <span className="shrink-0 font-medium tabular-nums">{formatMoney(amount, bill.currency)}</span>
                              </li>
                            )
                          })}
                          {bill.adjustments.map((adj) => {
                            const amount = activeResult.adjustmentAllocations?.[adj.id]?.[person.id] ?? 0
                            if (amount === 0) return null
                            return (
                              <li key={adj.id} className="flex justify-between gap-3">
                                <span className="truncate text-muted-foreground">{adj.label || adj.kind}</span>
                                <span className={cn('shrink-0 font-medium tabular-nums', amount < 0 && 'text-success')}>
                                  {formatMoney(amount, bill.currency)}
                                </span>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  </details>
                </li>
              )
            })}
          </ul>
        )}

        {result && (
          <p className="text-xs text-muted-foreground">
            Shares add up to {formatMoney(result.billTotal, bill.currency)} — exactly the bill total.
          </p>
        )}
      </div>
    </details>
  )
}
