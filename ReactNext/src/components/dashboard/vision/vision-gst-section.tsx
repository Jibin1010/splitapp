'use client'

import * as React from 'react'
import {
  Package,
  Receipt,
  Calendar,
  CheckCircle2,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { PersonAvatar } from '@/components/ui/person-avatar'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'
import type { DialogPerson, EditableDetectedItem } from './vision-types'

interface VisionGstSectionProps {
  itemsList: EditableDetectedItem[]
  dialogPeople: DialogPerson[]
  computedTotalPaise: number
  customGstRupees: number
  setCustomGstRupees: (val: number) => void
  applyTax: boolean
  setApplyTax: (apply: boolean) => void
  gstSplitMode: 'equal' | 'proportional' | 'custom'
  setGstSplitMode: (mode: 'equal' | 'proportional' | 'custom') => void
  personGstShares: Record<string, number>
  setPersonGstShares: React.Dispatch<React.SetStateAction<Record<string, number>>>
}

export function computeProportionalGstShares(
  items: EditableDetectedItem[],
  people: DialogPerson[]
): Record<string, number> {
  const count = people.length
  if (count === 0) return {}

  const personTotals: Record<string, number> = {}
  people.forEach((p) => {
    personTotals[p.id] = 0
  })

  let totalAssignedSpend = 0
  items.forEach((item) => {
    const assigned = item.assignedParticipantIds || []
    if (assigned.length > 0) {
      const share = item.totalPaise / assigned.length
      assigned.forEach((pid) => {
        if (personTotals[pid] !== undefined) {
          personTotals[pid] += share
          totalAssignedSpend += share
        }
      })
    }
  })

  const shares: Record<string, number> = {}

  if (totalAssignedSpend > 0) {
    let sumPercent = 0
    people.forEach((p, idx) => {
      if (idx === count - 1) {
        shares[p.id] = Math.max(0, Math.round((100 - sumPercent) * 10) / 10)
      } else {
        const pct = Math.round((personTotals[p.id] / totalAssignedSpend) * 1000) / 10
        shares[p.id] = pct
        sumPercent += pct
      }
    })
  } else {
    const equalShare = Math.round((100 / count) * 10) / 10
    let running = 0
    people.forEach((p, idx) => {
      if (idx === count - 1) {
        shares[p.id] = Math.max(0, Math.round((100 - running) * 10) / 10)
      } else {
        shares[p.id] = equalShare
        running += equalShare
      }
    })
  }

  return shares
}

export function computeEqualGstShares(people: DialogPerson[]): Record<string, number> {
  const count = people.length
  if (count === 0) return {}
  const shares: Record<string, number> = {}
  const equalShare = Math.round((100 / count) * 10) / 10
  let running = 0
  people.forEach((p, idx) => {
    if (idx === count - 1) {
      shares[p.id] = Math.max(0, Math.round((100 - running) * 10) / 10)
    } else {
      shares[p.id] = equalShare
      running += equalShare
    }
  })
  return shares
}

export function VisionGstSection({
  itemsList,
  dialogPeople,
  computedTotalPaise,
  customGstRupees,
  setCustomGstRupees,
  applyTax,
  setApplyTax,
  gstSplitMode,
  setGstSplitMode,
  personGstShares,
  setPersonGstShares,
}: VisionGstSectionProps) {
  // Automatically calculate default proportional shares even before pressing any button,
  // and whenever items, quantities, prices, or participant assignments change!
  React.useEffect(() => {
    if (dialogPeople.length === 0) return

    if (gstSplitMode === 'proportional') {
      const propShares = computeProportionalGstShares(itemsList, dialogPeople)
      setPersonGstShares(propShares)
    } else if (gstSplitMode === 'equal') {
      const eqShares = computeEqualGstShares(dialogPeople)
      setPersonGstShares(eqShares)
    }
  }, [itemsList, dialogPeople, gstSplitMode])

  const handleProportionalGstSplit = () => {
    setGstSplitMode('proportional')
    const propShares = computeProportionalGstShares(itemsList, dialogPeople)
    setPersonGstShares(propShares)
  }

  const handleEqualGstSplit = () => {
    setGstSplitMode('equal')
    const eqShares = computeEqualGstShares(dialogPeople)
    setPersonGstShares(eqShares)
  }

  const handleCustomGstSplit = () => {
    setGstSplitMode('custom')
    const zeroShares: Record<string, number> = {}
    dialogPeople.forEach((p) => {
      zeroShares[p.id] = 0
    })
    setPersonGstShares(zeroShares)
  }

  const totalGstPercent = Object.values(personGstShares).reduce(
    (sum, val) => sum + (Number(val) || 0),
    0
  )

  return (
    <div className="space-y-3">
      {/* 3 Summary Metric Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/70 p-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600">
              <Package className="size-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-900">Products Subtotal</p>
              <p className="text-[10px] text-slate-500 font-normal">
                {itemsList.reduce((acc, i) => acc + (i.quantity || 0), 0)} items
              </p>
            </div>
          </div>
          <p className="text-base font-extrabold text-slate-900 font-mono">
            {formatMoney(computedTotalPaise, 'INR')}
          </p>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-600">
              <Receipt className="size-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-900">GST (5.0%)</p>
            </div>
          </div>
          <p className="text-base font-extrabold text-emerald-600 font-mono">
            ₹{customGstRupees.toFixed(2)}
          </p>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-purple-100 bg-purple-50/70 p-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-purple-600/10 text-purple-600">
              <Calendar className="size-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-900">Total (Incl. GST)</p>
            </div>
          </div>
          <p className="text-base font-extrabold text-purple-600 font-mono">
            {formatMoney(computedTotalPaise + Math.round(customGstRupees * 100), 'INR')}
          </p>
        </div>
      </div>

      {/* STEP 3: GST / TAX PERCENTAGE ALLOCATION */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 space-y-3 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-blue-600 text-white font-extrabold text-xs shadow-2xs">
              %
            </span>
            <div>
              <h4 className="text-xs font-bold text-slate-900">
                GST / Tax Split by Percentage
              </h4>
              <p className="text-[11px] text-slate-500 font-normal">
                Assign how GST should be split among participants.
              </p>
            </div>
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-800">
            <Checkbox
              checked={applyTax}
              onCheckedChange={(checked) => setApplyTax(!!checked)}
            />
            <span>Apply GST to Bill</span>
          </label>
        </div>

        {applyTax ? (
          <div className="space-y-3">
            {/* Total GST Input & Split Mode Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50/80 border border-slate-200/70 p-2.5">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                  Total GST Amount:
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-2.5 text-xs font-bold text-slate-500">₹</span>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={customGstRupees.toFixed(2)}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setCustomGstRupees(parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0)}
                    className="h-8 w-24 pl-6 text-right font-mono text-xs font-bold text-slate-900 bg-white border-slate-200"
                  />
                </div>
              </div>

              {dialogPeople.length > 0 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleProportionalGstSplit}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer',
                      gstSplitMode === 'proportional'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    Proportional to Spend (Default)
                  </button>
                  <button
                    type="button"
                    onClick={handleEqualGstSplit}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer',
                      gstSplitMode === 'equal'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    Equal %
                  </button>
                  <button
                    type="button"
                    onClick={handleCustomGstSplit}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer',
                      gstSplitMode === 'custom'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    Custom %
                  </button>
                </div>
              )}
            </div>

            {/* Per-person GST percentage distribution */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {dialogPeople.map((person) => {
                const percent = personGstShares[person.id] ?? 0
                const personGstRupees = (customGstRupees * percent) / 100

                return (
                  <div
                    key={person.id}
                    className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <PersonAvatar name={person.name} photo={person.photo} size="xs" />
                      <span className="truncate font-bold text-xs text-slate-900">{person.name}</span>
                    </div>

                    <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
                      <div className="relative flex items-center">
                        <Input
                          type="number"
                          step="0.1"
                          min={0}
                          max={100}
                          value={percent}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const raw = e.target.value
                            const val = raw === '' ? 0 : Math.max(0, Math.min(100, parseFloat(raw) || 0))
                            setPersonGstShares((prev) => ({ ...prev, [person.id]: val }))
                            setGstSplitMode('custom')
                          }}
                          className="h-7 w-14 pr-3.5 text-right text-xs font-mono font-bold bg-white border-slate-200"
                        />
                        <span className="absolute right-1 text-[10px] text-slate-400 pointer-events-none">%</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold tabular-nums text-slate-900 font-mono text-xs block">
                          ₹{personGstRupees.toFixed(2)}
                        </span>
                        <span className="text-[9px] text-slate-400 block font-normal">
                          GST Share
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Validation & Balance Info */}
            <div className="flex items-center justify-end gap-1.5 pt-1 text-xs">
              <span className={cn('font-bold flex items-center gap-1', Math.round(totalGstPercent * 10) === 1000 ? 'text-emerald-600' : 'text-rose-600')}>
                <CheckCircle2 className="size-3.5" />
                {totalGstPercent.toFixed(1)}% · {Math.round(totalGstPercent * 10) === 1000 ? 'Balanced' : 'Unbalanced'}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
