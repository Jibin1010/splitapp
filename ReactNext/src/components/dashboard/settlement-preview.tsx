'use client'

import * as React from 'react'
import {
  Calculator,
  ChevronDown,
  Clock,
  Crown,
  Download,
  GitFork,
  Printer,
  RefreshCw,
  SlidersHorizontal,
  Table as TableIcon,
  TriangleAlert,
  Wallet,
} from 'lucide-react'
import { buildCsv, downloadCsv, printResults } from '@/lib/export'
import { formatMoney } from '@/lib/money'
import { useBillStore } from '@/lib/store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SettlementPayerSetup } from './settlement/settlement-payer-setup'
import { SettlementGraphView } from './settlement/settlement-graph-view'
import { SettlementTableView } from './settlement/settlement-table-view'

export function SettlementPreview() {
  const { state, dispatch, calculate, resultIsStale, preview, activePerson } = useBillStore()
  const bill = state.bill
  const result = state.result
  const [viewMode, setViewMode] = React.useState<'graph' | 'table'>('graph')
  const [showPayerSetup, setShowPayerSetup] = React.useState(true)

  const activeResult = result || preview
  const transfersTotal = activeResult ? activeResult.settlements.reduce((sum, s) => sum + s.amount, 0) : 0

  // Financial reconciliation of who paid what
  const totalPaid = bill.people.reduce((sum, p) => sum + (p.paidAmount || 0), 0)
  const billTotal = preview.billTotal
  const paidDiff = billTotal - totalPaid
  const isPaidBalanced = totalPaid === billTotal && billTotal > 0

  // Identify Head Payers and Creditors
  const headPayers = bill.people.filter((p) => (p.paidAmount || 0) > 0)
  const creditors = bill.people.filter((p) => {
    const net = activeResult?.people[p.id]?.net ?? 0
    return net > 0
  })

  // Display Heads: Head payers or creditors who actually collect money (up to 4)
  const displayHeads = React.useMemo(() => {
    if (headPayers.length > 0) {
      return headPayers.slice(0, 4)
    }
    if (creditors.length > 0) {
      return creditors.slice(0, 4)
    }
    return bill.people.slice(0, 1)
  }, [headPayers, creditors, bill.people])

  // Debtors: people who owe money (net < 0)
  const debtors = bill.people.filter((p) => {
    const net = activeResult?.people[p.id]?.net ?? 0
    return net < 0
  })

  // Display Tails: must NOT duplicate anyone in displayHeads!
  const displayDebtors = React.useMemo(() => {
    const headIds = new Set(displayHeads.map((h) => h.id))
    const eligibleDebtors = debtors.filter((d) => !headIds.has(d.id))
    if (eligibleDebtors.length > 0) return eligibleDebtors
    return bill.people.filter((p) => !headIds.has(p.id))
  }, [debtors, bill.people, displayHeads])

  // Auto-balance head payers' amounts to match bill total exactly
  const handleAutoBalance = React.useCallback(() => {
    if (bill.people.length === 0) return
    const currentHeads = bill.people.filter((p) => (p.paidAmount || 0) > 0)
    if (currentHeads.length <= 1) {
      const target = currentHeads[0] || bill.people[0]
      dispatch({ type: 'SET_SOLE_PAYER', personId: target.id })
    } else {
      // Keep other head amounts, adjust the primary (largest) payer
      const sorted = [...currentHeads].sort((a, b) => (b.paidAmount || 0) - (a.paidAmount || 0))
      const primary = sorted[0]
      const otherPaid = currentHeads
        .filter((p) => p.id !== primary.id)
        .reduce((sum, p) => sum + (p.paidAmount || 0), 0)
      const adjustedPrimaryPaid = Math.max(0, billTotal - otherPaid)
      dispatch({ type: 'SET_PAID_AMOUNT', personId: primary.id, amount: adjustedPrimaryPaid })
    }
  }, [bill.people, billTotal, dispatch])

  // Fully settled people (net === 0)
  const settledPeople = bill.people.filter((p) => {
    const net = activeResult?.people[p.id]?.net ?? 0
    return net === 0 && (activeResult?.people[p.id]?.share ?? 0) > 0
  })

  const handleExportCsv = () => {
    if (!result) return
    const csv = buildCsv(bill, result)
    const filename =
      `${(bill.name || 'shared-bill').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}` ||
      'shared-bill'
    downloadCsv(`${filename}-split.csv`, csv)
  }

  return (
    <details open className="group rounded-3xl border border-zinc-200/90 bg-white p-5 sm:p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] space-y-5">
      <summary className="flex items-center justify-between gap-2 text-sm font-bold cursor-pointer select-none">
        <span className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-xs">
            <Wallet className="size-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-foreground flex items-center gap-2">
              Settlement preview
              {result ? (
                resultIsStale ? (
                  <Badge variant="warning" className="text-xs font-semibold gap-1">
                    <RefreshCw aria-hidden className="size-3" />
                    Recalculate
                  </Badge>
                ) : (
                  <Badge variant="success" className="text-xs font-semibold">
                    Calculated
                  </Badge>
                )
              ) : (
                <Badge variant="secondary" className="text-xs font-semibold gap-1">
                  <Clock aria-hidden className="size-3" />
                  Awaiting calculation
                </Badge>
              )}
              {headPayers.length > 0 && (
                <Badge variant="outline" className="text-xs font-semibold gap-1 bg-amber-50 text-amber-800 border-amber-200">
                  <Crown className="size-3 text-amber-600" />
                  {headPayers.length} {headPayers.length === 1 ? 'Head Payer' : 'Head Payers'}
                </Badge>
              )}
            </h2>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">
              Who pays whom to settle the bill with the fewest transfers.
            </p>
          </div>
        </span>
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
      </summary>

      <div className="space-y-5 border-t border-zinc-100 pt-5">
        {/* Top Control Bar: View Switcher, Payer Setup Toggle & Calculate Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center rounded-full border border-zinc-200 bg-zinc-50 p-1 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('graph')}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold transition-all cursor-pointer',
                  viewMode === 'graph' ? 'bg-zinc-900 text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-900',
                )}
              >
                <GitFork className="size-3.5 rotate-180" />
                Settlement Graph
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold transition-all cursor-pointer',
                  viewMode === 'table' ? 'bg-zinc-900 text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-900',
                )}
              >
                <TableIcon className="size-3.5" />
                Table Details
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPayerSetup((v) => !v)}
              className={cn(
                'gap-1.5 text-xs',
                !isPaidBalanced && bill.people.length > 0 && 'border-amber-300 bg-amber-50 text-amber-900',
              )}
            >
              <SlidersHorizontal className="size-3.5" />
              {showPayerSetup ? 'Hide Payer Setup' : 'Edit Who Paid Bill'}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={!result} className="gap-1.5 text-xs">
              <Download aria-hidden className="size-3.5" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={printResults} disabled={!result} className="gap-1.5 text-xs">
              <Printer aria-hidden className="size-3.5" />
              Print
            </Button>
            <Button onClick={() => void calculate()} disabled={state.calculating} className="gap-2 text-xs">
              {state.calculating ? (
                <>
                  <span className="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden />
                  Calculating…
                </>
              ) : (
                <>
                  <Calculator aria-hidden className="size-3.5" />
                  Calculate final split
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Head Payers Setup Section */}
        {(showPayerSetup || !isPaidBalanced) && bill.people.length > 0 && (
          <SettlementPayerSetup
            bill={bill}
            dispatch={dispatch}
            billTotal={billTotal}
            totalPaid={totalPaid}
            paidDiff={paidDiff}
            isPaidBalanced={isPaidBalanced}
            headPayers={headPayers}
            debtors={debtors}
            activeResult={activeResult}
            onAutoBalance={handleAutoBalance}
          />
        )}

        {/* Error / Alert banner */}
        {state.error && (
          <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4 text-sm text-red-700" role="alert">
            <p className="mb-1.5 flex items-center gap-1.5 font-bold">
              <TriangleAlert className="size-4 shrink-0 text-red-600" aria-hidden />
              The bill can’t be finalized yet
            </p>
            <p className="mb-1.5">{state.error.message}</p>
            <ul className="ml-5 list-disc space-y-1 text-xs">
              {state.error.issues.map((issue, index) => (
                <li key={`${issue.code}-${index}`}>{issue.message}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Transfers Summary Badges */}
        {activeResult && activeResult.settlements.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-bold">
              {activeResult.settlements.length} {activeResult.settlements.length === 1 ? 'transfer' : 'transfers'}
            </Badge>
            <Badge variant="secondary" className="font-bold">
              {formatMoney(transfersTotal, bill.currency)} in motion
            </Badge>
            {resultIsStale && (
              <Badge variant="warning" className="font-semibold">
                Inputs changed — recalculate for updated numbers
              </Badge>
            )}
          </div>
        )}

        {/* Graph View */}
        {viewMode === 'graph' && activeResult && (
          <SettlementGraphView
            bill={bill}
            activeResult={activeResult}
            activePerson={activePerson}
            displayHeads={displayHeads}
            displayDebtors={displayDebtors}
            settledPeople={settledPeople}
            totalPaid={totalPaid}
            billTotal={billTotal}
            paidDiff={paidDiff}
            isPaidBalanced={isPaidBalanced}
            onAutoBalance={handleAutoBalance}
          />
        )}

        {/* Table View */}
        {viewMode === 'table' && activeResult && (
          <SettlementTableView
            bill={bill}
            activeResult={activeResult}
            activePerson={activePerson}
          />
        )}
      </div>
    </details>
  )
}
