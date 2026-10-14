'use client'

import { AlertCircle, Package, Receipt, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { formatMoney } from '@/lib/money'
import { useBillStore } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

function SummaryCard({
  icon,
  label,
  value,
  hint,
  tone = 'default',
}: {
  icon: ReactNode
  label: string
  value: string
  hint: string
  tone?: 'default' | 'warning'
}) {
  return (
    <Card className={cn('overflow-hidden', tone === 'warning' && 'border-warning/40')}>
      <CardContent className="flex items-start gap-3 p-4">
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-lg',
            tone === 'warning' ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary',
          )}
          aria-hidden
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p
            className={cn(
              'truncate text-xl font-bold tabular-nums tracking-tight sm:text-2xl',
              tone === 'warning' && 'text-warning',
            )}
          >
            {value}
          </p>
          <p className="truncate text-xs text-muted-foreground">{hint}</p>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Four top-level figures, all derived live from the shared calculation
 * engine — never typed in by hand.
 */
export function SummaryCards() {
  const { state, preview } = useBillStore()
  const bill = state.bill

  const hasAdjustments = preview.adjustmentsTotal !== 0
  const unassigned = preview.unassignedValue

  return (
    <section aria-label="Bill summary" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <SummaryCard
        icon={<Receipt />}
        label="Bill Total"
        value={formatMoney(preview.billTotal, bill.currency)}
        hint={hasAdjustments ? `Products ${formatMoney(preview.itemsTotal, bill.currency)} + adjustments ${formatMoney(preview.adjustmentsTotal, bill.currency)}` : 'Sum of all product line totals'}
      />
      <SummaryCard
        icon={<Users />}
        label="People"
        value={String(bill.people.length)}
        hint={bill.people.length === 0 ? 'Add the people splitting this bill' : 'Participants in this bill'}
      />
      <SummaryCard
        icon={<Package />}
        label="Items"
        value={String(bill.items.length)}
        hint={bill.items.length === 0 ? 'Add products and prices' : 'Distinct product rows'}
      />
      <SummaryCard
        icon={<AlertCircle />}
        label="Unassigned"
        value={formatMoney(unassigned, bill.currency)}
        hint={unassigned > 0 ? 'Value not yet allocated to people' : 'Everything is assigned'}
        tone={unassigned > 0 ? 'warning' : 'default'}
      />
    </section>
  )
}
