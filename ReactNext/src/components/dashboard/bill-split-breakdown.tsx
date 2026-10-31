'use client'

import * as React from 'react'
import {
  Check,
  Copy,
  LayoutGrid,
  Pencil,
  Receipt,
  Table as TableIcon,
  UserPlus,
  Users,
} from 'lucide-react'
import { formatMoney } from '@/lib/money'
import { useBillStore } from '@/lib/store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { BreakdownBanner } from './breakdown/breakdown-banner'
import { BreakdownCardsView } from './breakdown/breakdown-cards-view'
import { BreakdownTableView } from './breakdown/breakdown-table-view'
import { BreakdownSettlementsStrip } from './breakdown/breakdown-settlements-strip'

/**
 * Pastel Dinner Bill-Splitting Dashboard Breakdown:
 * Faithful implementation of reference design:
 * - Header bar: Black receipt icon box, "Dinner" title, people/items metadata, Edit Items, Add People, Copy Split Summary
 * - Top Financial Ribbon Card with Pastel Dining Waves artwork backdrop, Total Bill, Subtotal, GST & floating Split Card
 * - Participant Breakdown cards with Cards/Table view switcher, item food emojis, pastel share pills, and settlement status buttons
 */
export function BillSplitBreakdown() {
  const { state, dispatch, preview, activePerson, setActivePerson } = useBillStore()
  const bill = state.bill
  const [copied, setCopied] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<'cards' | 'table'>('cards')

  // Formatted creation time
  const creationTime = React.useMemo(() => {
    if (!bill.createdAt) return '11:34 AM'
    try {
      const d = new Date(bill.createdAt)
      if (isNaN(d.getTime())) return '11:34 AM'
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
    } catch {
      return '11:34 AM'
    }
  }, [bill.createdAt])

  // Only render if there are people and items in the bill
  if (bill.people.length === 0 || bill.items.length === 0) {
    return null
  }

  const hasAdjustments = preview.adjustmentsTotal !== 0

  const handleCopySummary = () => {
    const lines: string[] = []
    lines.push(`🧾 *${bill.name || 'Dinner'}*`)
    if (bill.date || bill.invoiceNumber) {
      lines.push(`${bill.date ? `📅 ${bill.date} ` : ''}${bill.invoiceNumber ? `#${bill.invoiceNumber}` : ''}`.trim())
    }
    lines.push(
      `Total: *${formatMoney(preview.billTotal, bill.currency)}* (Products: ${formatMoney(preview.itemsTotal, bill.currency)}${
        hasAdjustments ? ` + GST: ${formatMoney(preview.adjustmentsTotal, bill.currency)}` : ''
      })`,
    )
    lines.push('──────────────────────────────')

    bill.people.forEach((p) => {
      const pRes = preview.people[p.id]
      const share = pRes?.share ?? 0
      const itemsShare = Object.values(pRes?.itemContributions || {}).reduce((a, b) => a + b, 0)
      const gstShare = bill.adjustments.reduce((sum, adj) => {
        return sum + (preview.adjustmentAllocations[adj.id]?.[p.id] || 0)
      }, 0)

      let line = `• *${p.name}*: ${formatMoney(share, bill.currency)}`
      if (hasAdjustments) {
        line += ` (Items: ${formatMoney(itemsShare, bill.currency)} + GST: ${formatMoney(gstShare, bill.currency)})`
      }
      if (p.paidAmount > 0) {
        line += ` [Paid ${formatMoney(p.paidAmount, bill.currency)}]`
      }
      lines.push(line)
    })

    if (preview.settlements.length > 0) {
      lines.push('──────────────────────────────')
      lines.push('*Settlements:*')
      preview.settlements.forEach((s) => {
        const from = bill.people.find((p) => p.id === s.fromPersonId)?.name || 'Someone'
        const to = bill.people.find((p) => p.id === s.toPersonId)?.name || 'Someone'
        lines.push(`👉 ${from} pays ${to} ${formatMoney(s.amount, bill.currency)}`)
      })
    }

    navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleEditItems = () => {
    const el = document.getElementById('products-table') || document.getElementById('items-section')
    el?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleAddPeople = () => {
    const name = window.prompt('Enter name of new person to add to this bill:')
    if (name?.trim()) {
      dispatch({ type: 'ADD_PERSON', name: name.trim(), switchTo: false })
    }
  }

  return (
    <section
      id="split-breakdown"
      aria-label="Bill split summary breakdown"
      className="rounded-[28px] border border-zinc-200/90 bg-white p-5 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-6 scroll-mt-20"
    >
      {/* Header bar: Icon, Dinner Title, Metadata & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-5">
        <div className="flex items-center gap-3.5 flex-wrap">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-xs shrink-0">
            <Receipt className="size-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 flex items-center gap-2">
              <span>{bill.name || 'Dinner'}</span>
              {bill.vendor && bill.name !== bill.vendor && (
                <Badge variant="outline" className="text-xs font-semibold">
                  {bill.vendor}
                </Badge>
              )}
            </h2>
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-zinc-500 mt-0.5">
              <span>{bill.people.length} people</span>
              <span>•</span>
              <span>{bill.items.length} items</span>
              <span>•</span>
              <span>Created today, {creationTime}</span>
              {bill.invoiceNumber && <span>• #{bill.invoiceNumber}</span>}
            </div>
          </div>
        </div>

        {/* Action Buttons: Edit Items, Add People, Copy Split Summary */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleEditItems}
            className="h-9 rounded-2xl border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50 hover:text-zinc-950 cursor-pointer"
          >
            <Pencil className="size-3.5 mr-1.5 text-zinc-500" />
            Edit Items
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddPeople}
            className="h-9 rounded-2xl border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50 hover:text-zinc-950 cursor-pointer"
          >
            <UserPlus className="size-3.5 mr-1.5 text-zinc-500" />
            Add People
          </Button>

          <Button
            type="button"
            onClick={handleCopySummary}
            className="h-9 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white px-4 text-xs font-semibold gap-1.5 shadow-xs cursor-pointer"
          >
            {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
            <span>{copied ? 'Copied Summary' : 'Copy Split Summary'}</span>
          </Button>
        </div>
      </div>

      {/* Top Financial Ribbon with Pastel Waves Artwork */}
      <BreakdownBanner
        bill={bill}
        preview={preview}
        onEditItems={handleEditItems}
      />

      {/* Participant Breakdown Section */}
      <div className="space-y-4 pt-1">
        {/* Section Header with View Toggle (Cards vs Table) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm sm:text-base font-bold text-zinc-900 flex items-center gap-2">
            <Users className="size-4 text-zinc-600" />
            <span>Participant Breakdown ({bill.people.length} people)</span>
          </h3>

          <div className="flex items-center gap-1 rounded-xl bg-zinc-100/80 p-1 border border-zinc-200/60 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition-all cursor-pointer',
                viewMode === 'cards'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900',
              )}
            >
              <LayoutGrid className="size-3.5" />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition-all cursor-pointer',
                viewMode === 'table'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900',
              )}
            >
              <TableIcon className="size-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>

        {/* View: Cards or Table */}
        {viewMode === 'cards' ? (
          <BreakdownCardsView
            bill={bill}
            preview={preview}
            activePerson={activePerson}
            setActivePerson={setActivePerson}
            hasAdjustments={hasAdjustments}
          />
        ) : (
          <BreakdownTableView
            bill={bill}
            preview={preview}
            activePerson={activePerson}
            setActivePerson={setActivePerson}
            hasAdjustments={hasAdjustments}
          />
        )}
      </div>

      {/* Settlement Transfers Strip (Who Pays Whom) */}
      <BreakdownSettlementsStrip
        bill={bill}
        settlements={preview.settlements}
      />
    </section>
  )
}
