'use client'

import * as React from 'react'
import { ArrowDown, ArrowUp, Check, ChevronRight } from 'lucide-react'
import { formatMoney } from '@/lib/money'
import { PersonAvatar } from '@/components/ui/person-avatar'
import { cn } from '@/lib/utils'
import type { Bill, CalculationResult, Person } from '@/types/split'

/**
 * Intelligent food emoji selector matching item names
 */
function getItemEmoji(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('pizza')) return '🍕'
  if (lower.includes('bread') || lower.includes('garlic')) return '🥖'
  if (lower.includes('pasta') || lower.includes('spaghetti') || lower.includes('noodle')) return '🍲'
  if (
    lower.includes('coffee') ||
    lower.includes('tea') ||
    lower.includes('drink') ||
    lower.includes('latte') ||
    lower.includes('coke') ||
    lower.includes('soda') ||
    lower.includes('beverage')
  ) {
    return '🥤'
  }
  if (
    lower.includes('brownie') ||
    lower.includes('cake') ||
    lower.includes('dessert') ||
    lower.includes('ice cream') ||
    lower.includes('pastry') ||
    lower.includes('sweet')
  ) {
    return '🧁'
  }
  if (lower.includes('burger')) return '🍔'
  if (lower.includes('salad')) return '🥗'
  if (lower.includes('rice') || lower.includes('biryani')) return '🍚'
  if (lower.includes('taco')) return '🌮'
  if (lower.includes('sushi')) return '🍣'
  return '🍽️'
}

/**
 * Share pill badge palette matching the pastel cards in reference design
 */
const SHARE_BADGE_STYLES = [
  'bg-[#FDF2F4] text-rose-950 border border-rose-100/90',
  'bg-[#EFF6FF] text-blue-950 border border-blue-100/90',
  'bg-[#FFFBEB] text-amber-950 border border-amber-100/90',
  'bg-[#FAF5FF] text-purple-950 border border-purple-100/90',
]

interface BreakdownCardsViewProps {
  bill: Bill
  preview: CalculationResult
  activePerson: Person | null
  setActivePerson: (id: string) => void
  hasAdjustments: boolean
}

export function BreakdownCardsView({
  bill,
  preview,
  activePerson,
  setActivePerson,
  hasAdjustments,
}: BreakdownCardsViewProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {bill.people.map((person, idx) => {
        const personResult = preview.people[person.id]
        const totalShare = personResult?.share ?? 0
        const contributions = Object.entries(personResult?.itemContributions || {}) as [string, number][]

        // Find GST allocation for this person
        const gstShare = bill.adjustments.reduce((sum: number, adj) => {
          return sum + (preview.adjustmentAllocations[adj.id]?.[person.id] || 0)
        }, 0)

        const paid = person.paidAmount || 0
        const net = personResult?.net ?? (paid - totalShare)
        const isActive = activePerson?.id === person.id
        const badgeStyle = SHARE_BADGE_STYLES[idx % SHARE_BADGE_STYLES.length]

        return (
          <div
            key={person.id}
            onClick={() => setActivePerson(person.id)}
            className={cn(
              'relative flex flex-col justify-between rounded-3xl bg-white p-4 sm:p-5 space-y-4 transition-all duration-200 cursor-pointer',
              isActive
                ? 'border-2 border-[#7C3AED] ring-4 ring-purple-100/80 shadow-md'
                : 'border border-zinc-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:border-zinc-300 hover:shadow-xs',
            )}
          >
            <div>
              {/* Card Header: Avatar, Name + YOU badge, item count & Share pill badge */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <PersonAvatar
                    name={person.name}
                    photo={person.photo}
                    size="md"
                    className={isActive ? 'ring-2 ring-[#7C3AED]' : ''}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-zinc-900 whitespace-nowrap">{person.name}</span>
                      {isActive && (
                        <span className="rounded-md bg-[#7C3AED] px-1.5 py-0.2 text-[9px] font-black text-white select-none shrink-0">
                          YOU
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-zinc-500 font-medium block">
                      {contributions.length} {contributions.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                </div>

                {/* Top Right Colored Share Pill Badge */}
                <span className={cn('text-xs sm:text-sm font-extrabold tabular-nums px-2.5 py-1 rounded-xl shadow-2xs shrink-0', badgeStyle)}>
                  {formatMoney(totalShare, bill.currency)}
                </span>
              </div>

              {/* Itemized Food List with Emojis */}
              <div className="mt-3.5 space-y-1.5 border-t border-zinc-100 pt-3">
                {contributions.length > 0 ? (
                  contributions.map(([itemId, amt]) => {
                    const item = bill.items.find((i) => i.id === itemId)
                    const itemName = item?.name || 'Item'
                    const emoji = getItemEmoji(itemName)
                    return (
                      <div key={itemId} className="flex items-center justify-between gap-1.5 text-xs py-0.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm shrink-0 select-none">{emoji}</span>
                          <span className="truncate text-zinc-700 font-medium">{itemName}</span>
                        </div>
                        <span className="tabular-nums font-semibold text-zinc-900 shrink-0">
                          {formatMoney(amt, bill.currency)}
                        </span>
                      </div>
                    )
                  })
                ) : (
                  <span className="italic text-xs text-muted-foreground block py-1">No items assigned</span>
                )}

                {/* GST Share row if adjustments exist */}
                {hasAdjustments && gstShare > 0 && (
                  <div className="flex items-center justify-between gap-1.5 pt-2 mt-1.5 border-t border-zinc-100 text-xs font-semibold text-zinc-800">
                    <span className="text-zinc-600">GST share</span>
                    <span className="tabular-nums text-zinc-900">+{formatMoney(gstShare, bill.currency)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Settlement Pill Button (Gets back / Owes) */}
            <div className="pt-2 border-t border-zinc-100">
              {net > 0 ? (
                <div className="flex items-center justify-between rounded-2xl bg-[#E8F8EE] px-3.5 py-2.5 text-[#0E7A3E] border border-emerald-200/50 shadow-2xs hover:bg-[#DCF3E4] transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="flex size-6 items-center justify-center rounded-full bg-emerald-200/70 text-[#0E7A3E] shrink-0">
                      <ArrowDown className="size-3.5 stroke-[2.5]" />
                    </div>
                    <div className="text-left">
                      <span className="block text-[10px] font-bold uppercase tracking-wider opacity-80">Gets back</span>
                      <span className="text-xs sm:text-sm font-extrabold tabular-nums">{formatMoney(net, bill.currency)}</span>
                    </div>
                  </div>
                  <ChevronRight className="size-4 opacity-70" />
                </div>
              ) : net < 0 ? (
                <div className="flex items-center justify-between rounded-2xl bg-[#FFF3E6] px-3.5 py-2.5 text-[#C25E00] border border-amber-200/50 shadow-2xs hover:bg-[#FFE8CC] transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="flex size-6 items-center justify-center rounded-full bg-amber-200/70 text-[#C25E00] shrink-0">
                      <ArrowUp className="size-3.5 stroke-[2.5]" />
                    </div>
                    <div className="text-left">
                      <span className="block text-[10px] font-bold uppercase tracking-wider opacity-80">Owes</span>
                      <span className="text-xs sm:text-sm font-extrabold tabular-nums">{formatMoney(-net, bill.currency)}</span>
                    </div>
                  </div>
                  <ChevronRight className="size-4 opacity-70" />
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-2xl bg-zinc-100 px-3.5 py-2.5 text-zinc-700 border border-zinc-200/80 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <div className="flex size-6 items-center justify-center rounded-full bg-zinc-200 text-zinc-700 shrink-0">
                      <Check className="size-3.5 stroke-[2.5]" />
                    </div>
                    <span className="text-xs font-bold">Settled</span>
                  </div>
                  <ChevronRight className="size-4 opacity-70" />
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
