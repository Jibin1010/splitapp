'use client'

import * as React from 'react'
import { Crown, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PersonAvatar } from '@/components/ui/person-avatar'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'
import type { DialogPerson } from './vision-types'

interface VisionHeadsTailsProps {
  dialogPeople: DialogPerson[]
  headPersonIds: string[]
  setHeadPersonIds: React.Dispatch<React.SetStateAction<string[]>>
  headPaidAmounts: Record<string, number>
  setHeadPaidAmounts: React.Dispatch<React.SetStateAction<Record<string, number>>>
  tailHeadPreferences: Record<string, string>
  setTailHeadPreferences: React.Dispatch<React.SetStateAction<Record<string, string>>>
  totalBillRupees: number
  tailPeople: DialogPerson[]
}

export function VisionHeadsTails({
  dialogPeople,
  headPersonIds,
  setHeadPersonIds,
  headPaidAmounts,
  setHeadPaidAmounts,
  tailHeadPreferences,
  setTailHeadPreferences,
  totalBillRupees,
  tailPeople,
}: VisionHeadsTailsProps) {
  const totalPaidByHeadsRupees = headPersonIds.reduce((sum, hid) => {
    return sum + (Number(headPaidAmounts[hid]) || 0)
  }, 0)

  const headPaidDiff = totalPaidByHeadsRupees - totalBillRupees

  const handleToggleHeadPerson = (personId: string) => {
    setHeadPersonIds((prev) => {
      if (prev.includes(personId)) {
        if (prev.length === 1) return prev
        return prev.filter((id) => id !== personId)
      }
      if (prev.length >= 4) return prev
      return [...prev, personId]
    })
  }

  const handleHeadAmountChange = (personId: string, amountRupees: number) => {
    setHeadPaidAmounts((prev) => ({
      ...prev,
      [personId]: amountRupees,
    }))
  }

  const handleTailHeadChange = (tailId: string, headId: string) => {
    setTailHeadPreferences((prev) => ({
      ...prev,
      [tailId]: headId,
    }))
  }

  if (dialogPeople.length === 0) return null

  return (
    <div className="rounded-2xl border border-amber-200/90 bg-amber-50/30 p-4 space-y-4 shadow-2xs">
      {/* Section header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500 text-white shadow-2xs">
            <Crown className="size-4" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
              Heads &amp; Tails Payment Setup
              <Badge variant="outline" className="text-[10px] bg-amber-100 text-amber-900 border-amber-300 font-bold px-2 py-0">
                Up to 4 heads
              </Badge>
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Select who paid upfront (Heads) and which participant (Tail) pays back to which head.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Bill Total:</span>
          <strong className="text-slate-900">{formatMoney(Math.round(totalBillRupees * 100), 'INR')}</strong>
          <span className="text-slate-300">·</span>
          <span className="text-slate-500">Heads Paid:</span>
          <strong className="text-slate-900 font-bold font-mono">
            ₹{totalPaidByHeadsRupees.toFixed(2)}
          </strong>
          {Math.abs(headPaidDiff) < 0.05 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold">
              <CheckCircle2 className="size-3 text-emerald-600" /> Balanced
            </span>
          ) : null}
        </div>
      </div>

      {/* 3 Columns side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-[0.88fr_0.88fr_1.24fr] gap-3">
        {/* Column 1: Select Head Payers */}
        <div className="rounded-xl border border-amber-200/70 bg-white p-3 space-y-2 shadow-2xs">
          <div className="flex items-center gap-1.5">
            <span className="flex size-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
              1
            </span>
            <span className="text-xs font-bold text-amber-950">
              Select Head Payers ({headPersonIds.length}/4 selected)
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            {dialogPeople.map((person) => {
              const isHead = headPersonIds.includes(person.id)
              return (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => handleToggleHeadPerson(person.id)}
                  className={cn(
                    'w-full flex items-center justify-between rounded-xl p-2 text-xs font-semibold transition-all cursor-pointer',
                    isHead
                      ? 'border border-amber-300 bg-amber-100/80 text-amber-950 shadow-2xs'
                      : 'border border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <PersonAvatar name={person.name} photo={person.photo} size="xs" />
                    <span>{person.name}</span>
                  </div>
                  {isHead && <CheckCircle2 className="size-4 text-amber-600" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Column 2: Enter Amount Paid by Each Head */}
        <div className="rounded-xl border border-amber-200/70 bg-white p-3 space-y-2 shadow-2xs">
          <div className="flex items-center gap-1.5">
            <span className="flex size-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
              2
            </span>
            <span className="text-xs font-bold text-amber-950">
              Enter Amount Paid by Each Head
            </span>
          </div>

          <div className="space-y-2 pt-1">
            {headPersonIds.map((hid, idx) => {
              const person = dialogPeople.find((p) => p.id === hid)
              if (!person) return null
              const paidVal = headPaidAmounts[hid] ?? 0

              return (
                <div key={hid} className="rounded-xl border border-amber-200 bg-amber-50/40 p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PersonAvatar name={person.name} photo={person.photo} size="xs" />
                      <span className="font-bold text-xs text-slate-900">{person.name}</span>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                      👑 Head {idx + 1}
                    </span>
                  </div>

                  <div className="relative flex items-center">
                    <span className="absolute left-2.5 text-xs font-bold text-slate-500">₹</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={paidVal === 0 ? '' : paidVal.toFixed(2)}
                      onChange={(e) => {
                        const num = parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0
                        handleHeadAmountChange(hid, num)
                      }}
                      className="w-full h-8 pl-6 pr-3 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-900 font-mono shadow-2xs"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Column 3: Connect Tails to Heads */}
        <div className="rounded-xl border border-amber-200/70 bg-white p-3 space-y-2 shadow-2xs">
          <div className="flex items-center gap-1.5">
            <span className="flex size-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
              3
            </span>
            <div>
              <span className="text-xs font-bold text-amber-950 block">
                Connect Tails to Heads
              </span>
              <span className="text-[10px] text-slate-500 block font-normal">
                Which participant pays to which head.
              </span>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            {tailPeople.map((tail) => {
              const currentHeadId = tailHeadPreferences[tail.id] || headPersonIds[0]

              return (
                <div
                  key={tail.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <PersonAvatar name={tail.name} photo={tail.photo} size="xs" />
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-slate-900 whitespace-nowrap">{tail.name}</p>
                      <p className="text-[9px] text-slate-400 whitespace-nowrap">Tail participant</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">pays →</span>
                    <select
                      value={currentHeadId}
                      onChange={(e) => handleTailHeadChange(tail.id, e.target.value)}
                      aria-label={`Head payer for ${tail.name}`}
                      className="h-7 rounded-lg border border-amber-300 bg-amber-50/80 px-2 text-[11px] font-bold text-amber-950 focus:outline-none cursor-pointer"
                    >
                      {headPersonIds.map((hid) => {
                        const headP = dialogPeople.find((p) => p.id === hid)
                        return (
                          <option key={hid} value={hid}>
                            👑 {headP?.name || 'Head'}
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
      </div>
    </div>
  )
}
