'use client'

import * as React from 'react'
import { formatMoney } from '@/lib/money'
import { PersonAvatar } from '@/components/ui/person-avatar'
import { cn } from '@/lib/utils'
import type { Bill, CalculationResult, Person } from '@/types/split'

interface BreakdownTableViewProps {
  bill: Bill
  preview: CalculationResult
  activePerson: Person | null
  setActivePerson: (id: string) => void
  hasAdjustments: boolean
}

export function BreakdownTableView({
  bill,
  preview,
  activePerson,
  setActivePerson,
  hasAdjustments,
}: BreakdownTableViewProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-2xs">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-zinc-200/80 bg-zinc-50/70 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Participant</th>
            <th className="px-4 py-3">Items Shared</th>
            <th className="px-4 py-3 text-right">Food Spend</th>
            {hasAdjustments && <th className="px-4 py-3 text-right">GST Share</th>}
            <th className="px-4 py-3 text-right">Total Share</th>
            <th className="px-4 py-3 text-right">Paid</th>
            <th className="px-4 py-3 text-center">Net Balance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {bill.people.map((person) => {
            const personResult = preview.people[person.id]
            const totalShare = personResult?.share ?? 0
            const itemsShare = (Object.values(personResult?.itemContributions || {}) as number[]).reduce((a, b) => a + b, 0)
            const contributions = Object.entries(personResult?.itemContributions || {}) as [string, number][]
            const gstShare = bill.adjustments.reduce((sum: number, adj) => {
              return sum + (preview.adjustmentAllocations[adj.id]?.[person.id] || 0)
            }, 0)
            const paid = person.paidAmount || 0
            const net = personResult?.net ?? (paid - totalShare)
            const isActive = activePerson?.id === person.id

            return (
              <tr
                key={person.id}
                onClick={() => setActivePerson(person.id)}
                className={cn(
                  'hover:bg-zinc-50/80 cursor-pointer transition-colors',
                  isActive && 'bg-purple-50/40 font-semibold',
                )}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <PersonAvatar name={person.name} photo={person.photo} size="xs" />
                    <span className="font-bold text-zinc-900">{person.name}</span>
                    {isActive && (
                      <span className="rounded-md bg-[#7C3AED] px-1.5 py-0.2 text-[9px] font-black text-white">
                        YOU
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {contributions.length > 0
                    ? contributions
                        .map(([id]) => bill.items.find((i) => i.id === id)?.name || 'Item')
                        .join(', ')
                    : 'None'}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-zinc-900 font-semibold">
                  {formatMoney(itemsShare, bill.currency)}
                </td>
                {hasAdjustments && (
                  <td className="px-4 py-3 text-right tabular-nums text-zinc-900">
                    +{formatMoney(gstShare, bill.currency)}
                  </td>
                )}
                <td className="px-4 py-3 text-right tabular-nums font-bold text-zinc-950">
                  {formatMoney(totalShare, bill.currency)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-zinc-600">
                  {formatMoney(paid, bill.currency)}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={cn(
                      'inline-block px-2.5 py-1 rounded-full text-[11px] font-bold',
                      net > 0
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                        : net < 0
                          ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                          : 'bg-zinc-100 text-zinc-600',
                    )}
                  >
                    {net > 0
                      ? `Gets back ${formatMoney(net, bill.currency)}`
                      : net < 0
                        ? `Owes ${formatMoney(-net, bill.currency)}`
                        : 'Settled ✓'}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
