'use client'

import * as React from 'react'
import { ArrowRight } from 'lucide-react'
import { formatMoney } from '@/lib/money'
import { PersonAvatar } from '@/components/ui/person-avatar'
import type { Bill, Settlement } from '@/types/split'

interface BreakdownSettlementsStripProps {
  bill: Bill
  settlements: Settlement[]
}

export function BreakdownSettlementsStrip({ bill, settlements }: BreakdownSettlementsStripProps) {
  if (settlements.length === 0) return null

  return (
    <div className="rounded-2xl bg-zinc-50 border border-zinc-100 p-3.5 space-y-2">
      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
        Who Pays Whom to Settle Up ({settlements.length}{' '}
        {settlements.length === 1 ? 'transfer' : 'transfers'}):
      </span>
      <div className="flex flex-wrap gap-2">
        {settlements.map((s, idx) => {
          const fromPerson = bill.people.find((p) => p.id === s.fromPersonId)
          const toPerson = bill.people.find((p) => p.id === s.toPersonId)
          return (
            <div
              key={idx}
              className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs shadow-2xs"
            >
              <PersonAvatar name={fromPerson?.name || 'Someone'} photo={fromPerson?.photo} size="xs" />
              <span className="font-semibold text-foreground">{fromPerson?.name}</span>
              <ArrowRight className="size-3 text-muted-foreground" />
              <PersonAvatar name={toPerson?.name || 'Someone'} photo={toPerson?.photo} size="xs" />
              <span className="font-semibold text-foreground">{toPerson?.name}</span>
              <span className="font-extrabold text-zinc-950 ml-1">
                {formatMoney(s.amount, bill.currency)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
