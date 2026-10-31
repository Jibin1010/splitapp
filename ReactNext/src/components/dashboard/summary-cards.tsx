'use client'

import * as React from 'react'
import { ArrowUpRight, CheckCircle2, Package, Receipt, Users, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { formatMoney } from '@/lib/money'
import { useBillStore } from '@/lib/store'
import { cn } from '@/lib/utils'

interface PlaygroundCardProps {
  icon: ReactNode
  tag: string
  label: string
  value: string
  hint: string
  variant: 'blue' | 'yellow' | 'purple' | 'peach'
  onClick?: () => void
}

const PLAYGROUND_VARIANTS = {
  blue: {
    bg: 'bg-[#e0edff]',
    border: 'border-[#c7ddfe]',
    text: 'text-[#0f172a]',
    tag: 'bg-[#d0e3ff] text-[#1e3a8a] border-[#bfdbfe]',
    arrow: 'bg-white/90 text-[#1e3a8a] hover:bg-white',
    subtext: 'text-[#334155]',
  },
  yellow: {
    bg: 'bg-[#fef3c7]',
    border: 'border-[#fde68a]',
    text: 'text-[#3a200a]',
    tag: 'bg-[#fde8a0] text-[#78350f] border-[#fcd34d]',
    arrow: 'bg-white/90 text-[#78350f] hover:bg-white',
    subtext: 'text-[#6b3a0c]',
  },
  purple: {
    bg: 'bg-[#ede9fe]',
    border: 'border-[#ddd6fe]',
    text: 'text-[#2e1065]',
    tag: 'bg-[#e2d9fd] text-[#4c1d95] border-[#c4b5fd]',
    arrow: 'bg-white/90 text-[#4c1d95] hover:bg-white',
    subtext: 'text-[#581c87]',
  },
  peach: {
    bg: 'bg-[#ffedd5]',
    border: 'border-[#fed7aa]',
    text: 'text-[#431407]',
    tag: 'bg-[#fedbb0] text-[#9a3412] border-[#fdba74]',
    arrow: 'bg-white/90 text-[#9a3412] hover:bg-white',
    subtext: 'text-[#7c2d12]',
  },
}

function PlaygroundCard({
  icon,
  tag,
  label,
  value,
  hint,
  variant,
  onClick,
}: PlaygroundCardProps) {
  const t = PLAYGROUND_VARIANTS[variant]

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative flex flex-col justify-between overflow-hidden rounded-3xl border p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md select-none',
        t.bg,
        t.border,
      )}
    >
      {/* Top row: Pill badge tag + diagonal arrow button */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold tracking-wider uppercase backdrop-blur-xs',
            t.tag,
          )}
        >
          {icon}
          {tag}
        </span>
        <span
          className={cn(
            'flex size-8 items-center justify-center rounded-full border border-black/5 shadow-2xs transition-transform duration-200 group-hover:scale-110 group-hover:rotate-12',
            t.arrow,
          )}
          aria-hidden
        >
          <ArrowUpRight className="size-4" />
        </span>
      </div>

      {/* Middle: Big bold geometric value */}
      <div className="my-4">
        <p className={cn('text-xs font-semibold tracking-wide uppercase opacity-75', t.subtext)}>
          {label}
        </p>
        <p className={cn('truncate text-2xl sm:text-3xl font-extrabold tracking-tight font-sans', t.text)}>
          {value}
        </p>
      </div>

      {/* Bottom: Contextual hint */}
      <div className={cn('truncate text-xs font-medium', t.subtext)}>
        {hint}
      </div>
    </div>
  )
}

/**
 * Four top-level figures derived live from the shared calculation engine.
 * Styled in the Playground Neo-Grotesk pastel cards aesthetic (Taras Migulko).
 */
export function SummaryCards() {
  const { state, preview, activePerson } = useBillStore()
  const bill = state.bill

  const hasAdjustments = preview.adjustmentsTotal !== 0
  const unassigned = preview.unassignedValue
  const activePersonShare = activePerson ? (preview.people[activePerson.id]?.share ?? 0) : null
  const activePersonPct = activePersonShare !== null && preview.billTotal > 0
    ? ((activePersonShare / preview.billTotal) * 100).toFixed(1)
    : null

  return (
    <section aria-label="Bill summary" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <PlaygroundCard
        variant="blue"
        icon={<Receipt className="size-3.5" />}
        tag={activePerson ? `You: ${formatMoney(activePersonShare || 0, bill.currency)}` : "Total Bill"}
        label="Bill Total (incl. GST)"
        value={formatMoney(preview.billTotal, bill.currency)}
        hint={
          activePerson && activePersonShare !== null
            ? `🌟 ${activePerson.name}’s share: ${formatMoney(activePersonShare, bill.currency)} (${activePersonPct}%)`
            : hasAdjustments
              ? `Items ${formatMoney(preview.itemsTotal, bill.currency)} + GST ${formatMoney(preview.adjustmentsTotal, bill.currency)}`
              : 'Sum of all product lines'
        }
        onClick={() => {
          const el = document.getElementById('products-table')
          el?.scrollIntoView({ behavior: 'smooth' })
        }}
      />
      <PlaygroundCard
        variant="yellow"
        icon={<Users className="size-3.5" />}
        tag="People"
        label="Participants"
        value={String(bill.people.length)}
        hint={bill.people.length === 0 ? 'Add people splitting this bill' : `${bill.people.length} sharing this expense`}
        onClick={() => {
          const el = document.getElementById('split-breakdown')
          el?.scrollIntoView({ behavior: 'smooth' })
        }}
      />
      <PlaygroundCard
        variant="purple"
        icon={<Package className="size-3.5" />}
        tag="Items"
        label="Products"
        value={String(bill.items.length)}
        hint={bill.items.length === 0 ? 'Add bill items' : `${bill.items.length} line items recorded`}
        onClick={() => {
          const el = document.getElementById('products-table')
          el?.scrollIntoView({ behavior: 'smooth' })
        }}
      />
      <PlaygroundCard
        variant="peach"
        icon={unassigned > 0 ? <TriangleAlert className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
        tag={unassigned > 0 ? 'Pending' : 'Completed'}
        label="Unassigned"
        value={formatMoney(unassigned, bill.currency)}
        hint={unassigned > 0 ? 'Value not yet assigned' : 'All items assigned ✓'}
        onClick={() => {
          const el = document.getElementById('products-table')
          el?.scrollIntoView({ behavior: 'smooth' })
        }}
      />
    </section>
  )
}

