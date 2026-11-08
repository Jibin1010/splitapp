'use client'

import * as React from 'react'
import { ArrowUp, Sparkles, TriangleAlert, Receipt, Eye } from 'lucide-react'
import { formatMoney, formatTransferMoney } from '@/lib/money'
import { PersonAvatar } from '@/components/ui/person-avatar'
import { cn } from '@/lib/utils'
import type { Bill, CalculationResult, Person } from '@/types/split'
import { useSettlementArrows } from './use-settlement-arrows'
import { BillPreviewDialog } from '../vault/bill-preview-dialog'

interface SettlementGraphViewProps {
  bill: Bill
  activeResult: CalculationResult
  activePerson: Person | null
  displayHeads: Person[]
  displayDebtors: Person[]
  settledPeople: Person[]
  totalPaid?: number
  billTotal?: number
  paidDiff?: number
  isPaidBalanced?: boolean
  onAutoBalance?: () => void
}

export function SettlementGraphView({
  bill,
  activeResult,
  activePerson,
  displayHeads,
  displayDebtors,
  settledPeople,
  totalPaid = 0,
  billTotal = 0,
  paidDiff = 0,
  isPaidBalanced = true,
  onAutoBalance,
}: SettlementGraphViewProps) {
  const displayNodesKey = `${displayHeads.map((h) => h.id).join(',')}_${displayDebtors.map((d) => d.id).join(',')}`
  const [previewOpen, setPreviewOpen] = React.useState(false)
  const { graphContainerRef, arrowPaths, personOf } = useSettlementArrows(
    bill,
    activeResult,
    displayNodesKey
  )

  return (
    <div
      ref={graphContainerRef}
      className="relative rounded-3xl border border-zinc-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6 overflow-visible"
    >
      {/* SVG overlay spanning the entire container for pixel-perfect curves */}
      <svg className="absolute inset-0 size-full pointer-events-none overflow-visible z-10" aria-hidden="true">
        <defs>
          <marker id="green-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#047857" />
          </marker>
        </defs>
        {arrowPaths.map((path) => (
          <path
            key={path.key}
            d={path.d}
            fill="none"
            stroke="#047857"
            strokeWidth="2.5"
            strokeLinecap="round"
            markerEnd="url(#green-arrow)"
          />
        ))}
      </svg>

      {/* Floating mint amount pill badges along the curved lines */}
      {arrowPaths.map((path) => (
        <div
          key={`badge-${path.key}`}
          style={{
            position: 'absolute',
            left: `${path.badgeX}px`,
            top: `${path.badgeY}px`,
            transform: 'translate(-50%, -50%)',
          }}
          className="z-20 flex items-center justify-center rounded-lg bg-[#e6f4ea] border border-[#a7f3d0] px-2.5 py-1 text-xs sm:text-sm font-extrabold text-[#065f46] shadow-xs select-none tabular-nums font-mono pointer-events-auto"
        >
          {formatTransferMoney(path.amount, bill.currency)}
        </div>
      ))}

      {/* Top Level: Head Payers */}
      <div className="relative z-20">
        <div
          className={cn(
            displayHeads.length === 1 && 'flex justify-center',
            displayHeads.length === 2 && 'grid grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto gap-6 justify-center',
            displayHeads.length === 3 && 'grid grid-cols-1 sm:grid-cols-3 max-w-4xl mx-auto gap-4 justify-center',
            displayHeads.length >= 4 && 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto gap-4 justify-center'
          )}
        >
          {displayHeads.map((payer) => {
            const pRes = activeResult.people[payer.id]
            const paid = payer.paidAmount || 0
            const share = pRes?.share ?? 0
            const net = pRes?.net ?? paid - share

            const incomingTransfers = activeResult.settlements.filter((s) => s.toPersonId === payer.id)
            const incomingTotal = incomingTransfers.reduce((sum, s) => sum + s.amount, 0)
            const isHeadActive = activePerson?.id === payer.id

            return (
              <div
                key={payer.id}
                id={`head-node-${payer.id}`}
                className={cn(
                  'relative flex flex-col justify-between items-center rounded-3xl border-2 p-6 sm:p-7 text-center shadow-xs min-w-[240px] max-w-sm hover:shadow-md transition-all group',
                  isHeadActive
                    ? 'border-indigo-500 bg-indigo-50/40 ring-4 ring-indigo-500/50 shadow-md'
                    : 'border-[#f59e0b] bg-[#fffef0]'
                )}
              >
                {isHeadActive && (
                  <div className="absolute top-3 right-3 rounded-full bg-indigo-600 text-white px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
                    YOU
                  </div>
                )}

                <div className="text-2xl sm:text-3xl mb-1 text-amber-500 select-none" aria-hidden>
                  👑
                </div>

                <h3 className="font-extrabold text-xl sm:text-2xl text-zinc-900 tracking-tight">
                  {payer.name}
                </h3>

                <div className="text-[11px] sm:text-xs font-bold tracking-wider uppercase text-[#92400e] mt-1">
                  HEAD PAYER — Paid {formatMoney(paid, bill.currency)}
                </div>

                {net > 0 ? (
                  <div className="mt-3.5 inline-flex items-center justify-center gap-1.5 rounded-full bg-[#d1fae5] border border-[#a7f3d0] px-5 py-2 text-xs sm:text-sm font-bold text-[#065f46] shadow-2xs">
                    <span className="font-medium text-xs sm:text-sm">Collects back</span>
                    <span className="font-black text-sm sm:text-base tabular-nums">
                      {formatMoney(net, bill.currency)}
                    </span>
                  </div>
                ) : net < 0 ? (
                  <div className="mt-3.5 inline-flex items-center justify-center gap-1.5 rounded-full bg-amber-50 border border-amber-300 px-5 py-2 text-xs sm:text-sm font-bold text-amber-800 shadow-2xs">
                    <span className="font-medium text-xs sm:text-sm">Still owes</span>
                    <span className="font-black text-sm sm:text-base tabular-nums">
                      {formatMoney(-net, bill.currency)}
                    </span>
                  </div>
                ) : (
                  <div className="mt-3.5 inline-flex items-center justify-center gap-1.5 rounded-full bg-zinc-100 border border-zinc-300 px-5 py-2 text-xs sm:text-sm font-bold text-zinc-700 shadow-2xs">
                    <span className="font-medium text-xs sm:text-sm">Fully settled</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Middle Section: Spacing between heads and tails */}
      <div className="min-h-[110px] sm:min-h-[140px] relative w-full flex items-center justify-center pointer-events-none">
        {!isPaidBalanced ? (
          <div className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl bg-amber-50/95 border border-amber-200/90 text-amber-950 text-center max-w-lg mx-auto shadow-xs space-y-2.5 pointer-events-auto">
            <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-amber-900">
              <TriangleAlert className="size-4 text-amber-600" />
              <span>Settlement Paused: Paid Amounts Unbalanced</span>
            </div>
            <p className="text-[11px] sm:text-xs text-amber-800 leading-relaxed">
              Head payers have marked <strong>{formatMoney(totalPaid, bill.currency)}</strong> as paid, but the bill total is <strong>{formatMoney(billTotal, bill.currency)}</strong> ({paidDiff > 0 ? `${formatMoney(paidDiff, bill.currency)} remaining` : `${formatMoney(-paidDiff, bill.currency)} overpaid`}).
              <br />
              All transfer arrows and connections will appear once payments balance the bill.
            </p>
            {onAutoBalance && (
              <button
                type="button"
                onClick={onAutoBalance}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Sparkles className="size-3.5" />
                <span>⚡ Auto-Balance Head Payers to {formatMoney(billTotal, bill.currency)}</span>
              </button>
            )}
          </div>
        ) : arrowPaths.length === 0 ? (
          <div className="flex flex-wrap justify-center items-center gap-3 py-6 pointer-events-auto">
            {activeResult.settlements.map((s, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 rounded-xl border border-[#a7f3d0] bg-[#f0fdf4] px-3.5 py-1.5 text-xs shadow-2xs"
              >
                <span className="font-bold text-zinc-900">{personOf(s.fromPersonId)?.name}</span>
                <ArrowUp className="size-3 text-[#047857]" />
                <span className="font-extrabold text-[#065f46] font-mono tabular-nums bg-[#d1fae5] px-2.5 py-0.5 rounded-md border border-[#a7f3d0]">
                  {formatTransferMoney(s.amount, bill.currency)}
                </span>
                <span className="text-muted-foreground text-[11px]">→ {personOf(s.toPersonId)?.name} 👑</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Bottom Row: Tails / Participants Settling Later */}
      <div className="relative z-20 flex flex-wrap justify-center items-center gap-4 sm:gap-6 pt-2">
        {displayDebtors.map((debtor) => {
          const pRes = activeResult.people[debtor.id]
          const share = pRes?.share ?? 0
          const paid = debtor.paidAmount || 0
          const net = pRes?.net ?? paid - share
          const isDebtorActive = activePerson?.id === debtor.id

          return (
            <div
              key={debtor.id}
              id={`tail-node-${debtor.id}`}
              className={cn(
                'rounded-2xl border-2 font-extrabold px-6 sm:px-8 py-3.5 sm:py-4 shadow-2xs text-center min-w-[140px] sm:min-w-[180px] transition-all flex flex-col items-center justify-center',
                isDebtorActive
                  ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-4 ring-indigo-500/50'
                  : 'border-[#047857] bg-[#f0fdf4] text-zinc-900 hover:border-emerald-700'
              )}
            >
              {isDebtorActive && (
                <span className="rounded-full bg-indigo-600 text-white px-2 py-0.5 text-[9px] font-black uppercase tracking-wider mb-1">
                  YOU
                </span>
              )}
              <span className="text-base sm:text-lg font-black tracking-tight text-zinc-900 block truncate">
                {debtor.name}
              </span>
              {net < 0 && (
                <span className="text-[11px] font-semibold text-emerald-800/80 block mt-0.5">
                  Owes {formatMoney(-net, bill.currency)}
                </span>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 mt-6">
        <p className="text-xs sm:text-sm font-medium text-zinc-500 tracking-wide">
          Settlement graph · bottom pays head payer
        </p>

        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100/90 text-indigo-700 px-3 py-1 text-xs font-bold transition-all shadow-2xs cursor-pointer group hover:border-indigo-300"
          title="View Bill Preview (Google Drive)"
        >
          <Receipt className="size-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
          <span>View Bill Preview</span>
          {bill.vaultFile && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-emerald-700 bg-emerald-100/90 px-1.5 py-0.2 rounded-full border border-emerald-200">
              Drive 🔒
            </span>
          )}
        </button>
      </div>

      {/* Bill Preview Modal (Google Drive Encrypted Vault & Digital Receipt) */}
      <BillPreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} />

      {/* Settled Participants */}
      {settledPeople.length > 0 && (
        <div className="border-t border-zinc-100 pt-3">
          <span className="block text-[11px] font-bold text-muted-foreground uppercase mb-1.5 text-center">
            Already Settled (No Transfers Needed):
          </span>
          <div className="flex flex-wrap justify-center gap-2">
            {settledPeople.map((person) => (
              <div
                key={person.id}
                className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/60 px-3 py-1 text-xs text-emerald-800"
              >
                <PersonAvatar name={person.name} photo={person.photo} size="xs" />
                <span className="font-semibold">{person.name}</span>
                <span>· Paid exact share {formatMoney(person.paidAmount, bill.currency)} ✓</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
