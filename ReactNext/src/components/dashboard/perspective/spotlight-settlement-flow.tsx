'use client'

import * as React from 'react'
import { ChevronRight, User, CheckCircle2 } from 'lucide-react'
import { formatMoney } from '@/lib/money'
import type { Person, Settlement } from '@/types/split'

interface SpotlightSettlementFlowProps {
  outgoing: Settlement[]
  incoming: Settlement[]
  people: Person[]
  currency: any
}

export function SpotlightSettlementFlow({
  outgoing,
  incoming,
  people,
  currency,
}: SpotlightSettlementFlowProps) {
  if (outgoing.length === 0 && incoming.length === 0) {
    return (
      <div className="flex items-center justify-between rounded-[22px] border border-[#EDE9FE] bg-[#F6F4FF] px-6 py-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-[16px] bg-[#EDE9FE] text-[#7C3AED] shadow-2xs">
            <CheckCircle2 className="size-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#64748B]">
              Your Personal Settlement Flow
            </span>
            <span className="font-bold text-slate-800 text-[15px]">
              All settled · No payments due
            </span>
          </div>
        </div>
        <span className="rounded-xl bg-[#D1FAE5] px-4 py-1.5 text-xs font-black text-[#059669]">
          Settled ✓
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      {outgoing.map((s) => {
        const toPerson = people.find((p) => p.id === s.toPersonId)
        return (
          <div
            key={`out-${s.fromPersonId}-${s.toPersonId}`}
            className="rounded-[22px] border border-[#EDE9FE] bg-[#F6F4FF] px-5 sm:px-6 py-3.5 flex items-center justify-between gap-4 shadow-2xs"
          >
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex size-11 items-center justify-center rounded-[16px] bg-[#EDE9FE] text-[#7C3AED] shadow-2xs">
                <User className="size-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#64748B]">
                  Your Personal Settlement Flow
                </span>
                <span className="text-[15px] font-bold text-slate-800">
                  You pay <span className="font-black text-[#7C3AED]">{toPerson?.name || 'Someone'}</span>
                </span>
              </div>
            </div>

            <div className="relative flex-1 mx-4 hidden sm:flex items-center">
              <div className="w-full border-b-2 border-dotted border-[#C4B5FD]" />
              <ChevronRight className="size-4 text-[#A78BFA] -ml-1 stroke-[2.5]" />
            </div>

            <div className="shrink-0 rounded-2xl bg-[#EDE9FE] px-7 py-2.5 shadow-2xs flex items-center justify-center">
              <span className="font-black tabular-nums text-[#6D28D9] text-base sm:text-lg tracking-tight">
                {formatMoney(s.amount, currency)}
              </span>
            </div>
          </div>
        )
      })}

      {incoming.map((s) => {
        const fromPerson = people.find((p) => p.id === s.fromPersonId)
        return (
          <div
            key={`in-${s.fromPersonId}-${s.toPersonId}`}
            className="rounded-[22px] border border-[#A7F3D0]/60 bg-[#F0FDF4] px-5 sm:px-6 py-3.5 flex items-center justify-between gap-4 shadow-2xs"
          >
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex size-11 items-center justify-center rounded-[16px] bg-[#D1FAE5] text-[#059669] shadow-2xs">
                <User className="size-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#64748B]">
                  Your Personal Settlement Flow
                </span>
                <span className="text-[15px] font-bold text-slate-800">
                  <span className="font-black text-[#059669]">{fromPerson?.name || 'Someone'}</span> will pay you
                </span>
              </div>
            </div>

            <div className="relative flex-1 mx-4 hidden sm:flex items-center">
              <div className="w-full border-b-2 border-dotted border-[#A7F3D0]" />
              <ChevronRight className="size-4 text-[#34D399] -ml-1 stroke-[2.5]" />
            </div>

            <div className="shrink-0 rounded-2xl bg-[#D1FAE5] px-7 py-2.5 shadow-2xs flex items-center justify-center">
              <span className="font-black tabular-nums text-[#059669] text-base sm:text-lg tracking-tight">
                +{formatMoney(s.amount, currency)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
