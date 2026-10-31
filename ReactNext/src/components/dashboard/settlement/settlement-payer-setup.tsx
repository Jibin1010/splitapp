'use client'

import * as React from 'react'
import { Crown } from 'lucide-react'
import { formatMoney } from '@/lib/money'
import { Button } from '@/components/ui/button'
import { PersonAvatar } from '@/components/ui/person-avatar'
import { cn } from '@/lib/utils'
import type { Bill, CalculationResult, Person } from '@/types/split'
import type { StoreAction } from '@/lib/store/store-types'
import { SettlementPayerProgress } from './settlement-payer-progress'

interface SettlementPayerSetupProps {
  bill: Bill
  dispatch: React.Dispatch<StoreAction>
  billTotal: number
  totalPaid: number
  paidDiff: number
  isPaidBalanced: boolean
  headPayers: Person[]
  debtors: Person[]
  activeResult?: CalculationResult | null
  onAutoBalance?: () => void
}

/**
 * Head Payers Setup Section:
 * Allows selecting upfront payers (sole payer or multi-head splits with custom paise amounts)
 * and configuring which tails pay which heads.
 */
export function SettlementPayerSetup({
  bill,
  dispatch,
  billTotal,
  totalPaid,
  paidDiff,
  isPaidBalanced,
  headPayers,
  debtors,
  activeResult,
  onAutoBalance,
}: SettlementPayerSetupProps) {
  return (
    <div className="rounded-[28px] border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs space-y-6">
      {/* Header: Amber Crown Icon Badge, Title & Subtitle */}
      <div className="flex items-start gap-3.5">
        <div className="flex size-11 sm:size-12 items-center justify-center rounded-2xl bg-[#FFF9EC] text-amber-500 border border-amber-200/60 shadow-2xs shrink-0 mt-0.5">
          <Crown className="size-6 stroke-[2.2] text-amber-500" />
        </div>
        <div>
          <h3 className="text-lg sm:text-xl font-extrabold text-[#0F172A] tracking-tight">
            Who paid the bill? (Head payers)
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Select who paid the bill upfront. Supports multiple people paying portions (e.g. one ₹750 and another ₹250).
          </p>
        </div>
      </div>

      {/* Financial Status Progress Card */}
      <SettlementPayerProgress
        billTotal={billTotal}
        totalPaid={totalPaid}
        currency={bill.currency}
        isPaidBalanced={isPaidBalanced}
        paidDiff={paidDiff}
      />

      {/* Quick 1-click sole payer chips */}
      <div>
        <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
          QUICK 1–CLICK: WHO PAID THE WHOLE BILL?
        </span>
        <div className="flex flex-wrap items-center gap-2.5">
          {bill.people.map((person) => {
            const isSole = person.paidAmount === billTotal && billTotal > 0
            const hasPaid = (person.paidAmount || 0) > 0
            return (
              <button
                key={person.id}
                type="button"
                onClick={() => dispatch({ type: 'SET_SOLE_PAYER', personId: person.id })}
                className={cn(
                  'flex items-center gap-2.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer shadow-2xs',
                  hasPaid || isSole
                    ? 'border-2 border-amber-300 bg-[#FFFDF5] text-slate-900 ring-2 ring-amber-200/50 shadow-xs'
                    : 'border border-slate-200/90 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
                )}
              >
                <PersonAvatar name={person.name} photo={person.photo} size="xs" />
                <span className="font-semibold text-sm">{person.name}</span>
                {(person.paidAmount || 0) > 0 && (
                  <span className="rounded-full bg-[#FEF3C7] text-[#92400E] border border-amber-200/60 px-2.5 py-0.5 text-xs font-bold font-sans tabular-nums">
                    {formatMoney(person.paidAmount, bill.currency)}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Multi-payer custom amounts inputs */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            OR ENTER CUSTOM AMOUNTS PAID BY MULTIPLE PEOPLE (UP TO 4 HEADS):
          </span>
          {headPayers.length > 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (headPayers.length === 0) return
                const equalPaise = Math.round(billTotal / headPayers.length)
                let running = 0
                headPayers.forEach((p, idx) => {
                  const amount = idx === headPayers.length - 1 ? Math.max(0, billTotal - running) : equalPaise
                  running += amount
                  dispatch({ type: 'SET_PAID_AMOUNT', personId: p.id, amount })
                })
              }}
              className="h-7 text-xs px-2.5 bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Split Evenly Across Heads
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-3">
          {bill.people.slice(0, 4).map((person) => {
            const isPaid = (person.paidAmount || 0) > 0
            return (
              <div
                key={person.id}
                className={cn(
                  'flex items-center justify-between gap-1.5 rounded-2xl p-2.5 sm:px-3 sm:py-2.5 transition-all shadow-2xs min-w-0',
                  isPaid
                    ? 'border-2 border-amber-400 bg-white'
                    : 'border border-slate-200/90 bg-white hover:border-slate-300',
                )}
              >
                <div className="flex items-center gap-2 min-w-0 shrink">
                  <PersonAvatar name={person.name} photo={person.photo} size="xs" className="size-7 sm:size-8 shrink-0" />
                  <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">{person.name}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50/50 sm:bg-white px-2 py-1 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/20 shadow-2xs">
                    <span className="text-xs text-slate-400 font-sans select-none mr-1">₹</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={person.paidAmount ? person.paidAmount / 100 : ''}
                      placeholder="0"
                      onChange={(e) => {
                        const val = Math.max(0, parseFloat(e.target.value) || 0)
                        const newAmountPaise = Math.round(val * 100)
                        if (headPayers.length > 1 && headPayers[0] && person.id !== headPayers[0].id) {
                          const head1 = headPayers[0]
                          const otherHeadsPaise = bill.people
                            .filter((p) => p.id !== head1.id)
                            .reduce((sum, p) => sum + (p.id === person.id ? newAmountPaise : (p.paidAmount || 0)), 0)
                          const newHead1Paise = Math.max(0, billTotal - otherHeadsPaise)
                          dispatch({
                            type: 'SET_HEAD_PAYERS',
                            headPayers: [
                              { personId: head1.id, amount: newHead1Paise },
                              { personId: person.id, amount: newAmountPaise },
                              ...bill.people
                                .filter((p) => p.id !== head1.id && p.id !== person.id && (p.paidAmount || 0) > 0)
                                .map((p) => ({ personId: p.id, amount: p.paidAmount })),
                            ],
                          })
                        } else {
                          dispatch({
                            type: 'SET_PAID_AMOUNT',
                            personId: person.id,
                            amount: newAmountPaise,
                          })
                        }
                      }}
                      className="w-9 sm:w-12 border-0 bg-transparent p-0 text-right text-xs sm:text-sm font-bold tabular-nums text-slate-800 focus:outline-none"
                    />
                  </div>

                  {/* +Rest button: shown on participants who have 0 paid */}
                  {(person.paidAmount || 0) === 0 && (
                    <button
                      type="button"
                      title="Assign remaining balance to this person"
                      onClick={() => {
                        const current = person.paidAmount || 0
                        if (paidDiff > 0) {
                          dispatch({ type: 'SET_PAID_AMOUNT', personId: person.id, amount: current + paidDiff })
                        } else {
                          dispatch({ type: 'SET_SOLE_PAYER', personId: person.id })
                        }
                      }}
                      className="rounded-lg bg-[#EBF2FF] hover:bg-[#DEE8FF] text-[#2563EB] px-2 py-1 text-xs font-bold transition-colors cursor-pointer shrink-0"
                    >
                      +Rest
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tail to Head Preferences in Setup Panel */}
      {debtors.length > 0 && headPayers.length > 1 && (
        <div className="border-t border-zinc-200/60 pt-3 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase block">
                Connect Tails to Heads (Who pays whom):
              </span>
              <span className="text-[10px] text-slate-400">
                Tails can only route payments to heads who have a net positive collection.
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!isPaidBalanced && onAutoBalance && (
                <button
                  type="button"
                  onClick={onAutoBalance}
                  className="inline-flex items-center gap-1 h-6 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold px-2.5 transition-colors cursor-pointer"
                >
                  ⚡ Auto-Balance
                </button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const eligibleHeads = headPayers.filter(
                    (h) => (activeResult?.people[h.id]?.net ?? 0) > 0,
                  )
                  const targets = eligibleHeads.length > 0 ? eligibleHeads : headPayers
                  debtors.forEach((d, idx) => {
                    const targetHead = targets[idx % targets.length]
                    dispatch({
                      type: 'SET_HEAD_TAIL_PREFERENCE',
                      tailPersonId: d.id,
                      headPersonId: targetHead.id,
                    })
                  })
                }}
                className="h-6 text-[11px] px-2.5 py-0 bg-white"
              >
                Auto-Distribute Tails
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {debtors.map((debtor) => {
              const currentHeadId = bill.headTailPreferences?.[debtor.id] || headPayers[0]?.id
              return (
                <div key={debtor.id} className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white p-2 text-xs">
                  <span className="font-semibold text-zinc-900 truncate">{debtor.name}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">pays</span>
                    <select
                      value={currentHeadId}
                      onChange={(e) =>
                        dispatch({
                          type: 'SET_HEAD_TAIL_PREFERENCE',
                          tailPersonId: debtor.id,
                          headPersonId: e.target.value,
                        })
                      }
                      aria-label={`Head for ${debtor.name}`}
                      className="h-7 rounded-md border border-amber-300 bg-amber-50/50 px-2 text-[11px] font-bold text-amber-950 cursor-pointer"
                    >
                      {headPayers.map((h) => {
                        const net = activeResult?.people[h.id]?.net ?? 0
                        const isCreditor = net > 0
                        return (
                          <option key={h.id} value={h.id} disabled={!isCreditor}>
                            👑 {h.name} {isCreditor ? `(collects ${formatMoney(net, bill.currency)})` : `(owes money · can’t collect)`}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
