'use client'

import * as React from 'react'
import { ArrowRight } from 'lucide-react'
import { formatMoney, formatTransferMoney } from '@/lib/money'
import { Badge } from '@/components/ui/badge'
import { PersonAvatar } from '@/components/ui/person-avatar'
import { cn } from '@/lib/utils'
import type { Bill, CalculationResult, Person } from '@/types/split'

interface SettlementTableViewProps {
  bill: Bill
  activeResult: CalculationResult
  activePerson: Person | null
}

export function SettlementTableView({
  bill,
  activeResult,
  activePerson,
}: SettlementTableViewProps) {
  const personOf = (id: string) => bill.people.find((p) => p.id === id)

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {activeResult.settlements.map((settlement, index) => {
          const fromPerson = personOf(settlement.fromPersonId)
          const toPerson = personOf(settlement.toPersonId)
          const isFromUser = activePerson?.id === settlement.fromPersonId
          const isToUser = activePerson?.id === settlement.toPersonId
          const isUserInvolved = isFromUser || isToUser

          return (
            <li
              key={index}
              className={cn(
                'flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3 shadow-2xs transition-all',
                isUserInvolved
                  ? 'border-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/30 ring-1 ring-indigo-400/50'
                  : 'border-zinc-200 bg-zinc-50/60'
              )}
            >
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <div className="flex items-center gap-1.5">
                  <PersonAvatar
                    name={fromPerson?.name || 'Unknown'}
                    photo={fromPerson?.photo}
                    size="sm"
                    className={isFromUser ? 'ring-2 ring-rose-500' : ''}
                  />
                  <span className="font-bold text-zinc-900">{fromPerson?.name || 'Unknown'}</span>
                  {isFromUser && (
                    <Badge variant="danger" className="text-[9px] px-1.5 py-0 bg-rose-600 text-white">
                      YOU PAY
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">pays</span>
                <div className="flex items-center gap-1.5">
                  <PersonAvatar
                    name={toPerson?.name || 'Unknown'}
                    photo={toPerson?.photo}
                    size="sm"
                    className={isToUser ? 'ring-2 ring-emerald-500' : ''}
                  />
                  <span className="font-bold text-zinc-900">{toPerson?.name || 'Unknown'}</span>
                  {isToUser && (
                    <Badge variant="default" className="text-[9px] px-1.5 py-0 bg-emerald-600 text-white">
                      YOU RECEIVE
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <ArrowRight className="size-4 shrink-0 text-zinc-900" aria-hidden />
                <span className="text-sm font-extrabold tabular-nums text-zinc-900">
                  {formatTransferMoney(settlement.amount, bill.currency)}
                </span>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[480px] text-sm">
          <caption className="p-3 text-left text-xs text-muted-foreground border-b border-zinc-100">
            “Owed” is each person’s share of the products; “to transfer” also accounts for what they already paid.
          </caption>
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th scope="col" className="py-2.5 px-3 font-semibold">Person</th>
              <th scope="col" className="py-2.5 px-3 text-right font-semibold">Amount owed (share)</th>
              <th scope="col" className="py-2.5 px-3 text-right font-semibold">Already paid</th>
              <th scope="col" className="py-2.5 px-3 text-right font-semibold">To transfer (net)</th>
            </tr>
          </thead>
          <tbody>
            {bill.people.map((person) => {
              const personResult = activeResult.people[person.id]
              if (!personResult) return null
              return (
                <tr key={person.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50">
                  <td className="py-2.5 px-3 font-semibold text-zinc-900">
                    <div className="flex items-center gap-2">
                      <PersonAvatar name={person.name} photo={person.photo} size="xs" />
                      <span>{person.name}</span>
                      {person.paidAmount > 0 && (
                        <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-800 border-amber-200 py-0 px-1.5">
                          Head Payer 👑
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">{formatMoney(personResult.share, bill.currency)}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-muted-foreground">
                    {formatMoney(personResult.paid, bill.currency)}
                  </td>
                  <td
                    className={cn(
                      'py-2.5 px-3 text-right font-bold tabular-nums',
                      personResult.net > 0 ? 'text-emerald-600' : personResult.net < 0 ? 'text-red-600' : 'text-muted-foreground',
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
    </div>
  )
}
