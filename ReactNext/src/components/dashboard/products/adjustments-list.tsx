'use client'

import * as React from 'react'
import { ChevronDown, Plus, Trash2, Users, Percent } from 'lucide-react'
import type { Adjustment, AdjustmentKind, CurrencyCode, Paise } from '@/types/split'
import { billTotalsOf, computeAdjustmentAmount } from '@/lib/calculations'
import { formatMoney } from '@/lib/money'
import { useBillStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { FloatInput, MoneyInput } from '@/components/ui/smart-input'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { AdjustmentSharesDialog } from './adjustment-shares-dialog'

export interface BillTotals {
  itemsTotal: Paise
  adjustmentsTotal: Paise
  billTotal: Paise
}

export function AdjustmentRow({ adjustment }: { adjustment: Adjustment }) {
  const { state, dispatch } = useBillStore()
  const [splitDialogOpen, setSplitDialogOpen] = React.useState(false)
  const { itemsTotal } = billTotalsOf(state.bill)
  const amount = computeAdjustmentAmount(adjustment, itemsTotal)
  const hasCustomShares = Boolean(adjustment.shares && Object.keys(adjustment.shares).length > 0)

  return (
    <>
      <li className="flex flex-wrap items-center gap-2 py-2 border-b border-slate-100 last:border-0">
        <Input
          value={adjustment.label}
          onChange={(event) =>
            dispatch({
              type: 'UPDATE_ADJUSTMENT',
              adjustmentId: adjustment.id,
              patch: { label: event.target.value.slice(0, 200) },
            })
          }
          placeholder="Adjustment label"
          aria-label="Adjustment label"
          className="h-8 min-w-28 flex-1 text-xs rounded-xl border-slate-200 bg-white font-medium"
        />
        <Select
          value={adjustment.kind}
          onValueChange={(kind) =>
            dispatch({
              type: 'UPDATE_ADJUSTMENT',
              adjustmentId: adjustment.id,
              patch: { kind: kind as AdjustmentKind },
            })
          }
        >
          <SelectTrigger className="h-8 w-32 text-xs rounded-xl border-slate-200 bg-white" aria-label="Adjustment kind">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="service_charge">Service charge</SelectItem>
            <SelectItem value="tax">Tax / GST</SelectItem>
            <SelectItem value="discount">Discount</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={adjustment.method}
          onValueChange={(method) =>
            dispatch({
              type: 'UPDATE_ADJUSTMENT',
              adjustmentId: adjustment.id,
              patch: { method: method as 'percent' | 'fixed', value: method === 'percent' ? 10 : 0 },
            })
          }
        >
          <SelectTrigger className="h-8 w-24 text-xs rounded-xl border-slate-200 bg-white" aria-label="Adjustment method">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="percent">Percent</SelectItem>
            <SelectItem value="fixed">Fixed</SelectItem>
          </SelectContent>
        </Select>
        {adjustment.method === 'percent' ? (
          <FloatInput
            value={adjustment.value}
            onCommit={(value) => dispatch({ type: 'UPDATE_ADJUSTMENT', adjustmentId: adjustment.id, patch: { value } })}
            min={0}
            max={100}
            suffix="%"
            aria-label="Adjustment percentage"
            className="h-8 w-20 text-xs rounded-xl border-slate-200 bg-white text-right"
          />
        ) : (
          <MoneyInput
            value={adjustment.value}
            onCommit={(value) => dispatch({ type: 'UPDATE_ADJUSTMENT', adjustmentId: adjustment.id, patch: { value } })}
            aria-label="Adjustment fixed amount"
            className="h-8 w-24 text-xs rounded-xl border-slate-200 bg-white text-right"
          />
        )}
        <span
          className={cn(
            'w-20 text-right text-xs font-bold tabular-nums',
            amount < 0 ? 'text-emerald-600' : 'text-slate-800',
          )}
        >
          {formatMoney(amount, state.bill.currency)}
        </span>
        <Button
          variant={hasCustomShares ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSplitDialogOpen(true)}
          className={cn(
            'h-8 px-2.5 text-xs gap-1 rounded-xl',
            hasCustomShares
              ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-indigo-200'
              : 'text-slate-600 hover:text-slate-900 border-slate-200',
          )}
          title="Customize split among people"
        >
          <Users className="size-3.5" />
          {hasCustomShares ? 'Custom %' : 'Split %'}
        </Button>
        <button
          type="button"
          onClick={() => dispatch({ type: 'REMOVE_ADJUSTMENT', adjustmentId: adjustment.id })}
          aria-label={`Remove ${adjustment.label || 'adjustment'}`}
          className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <Trash2 className="size-4" />
        </button>
      </li>

      <AdjustmentSharesDialog
        adjustment={adjustment}
        open={splitDialogOpen}
        onOpenChange={setSplitDialogOpen}
      />
    </>
  )
}

interface AdjustmentsSectionProps {
  adjustments: Adjustment[]
  totals: BillTotals
  currency: CurrencyCode
  isHeadUser: boolean
  onAddAdjustment: () => void
}

export function AdjustmentsSection({
  adjustments,
  totals,
  currency,
  isHeadUser,
  onAddAdjustment,
}: AdjustmentsSectionProps) {
  const [isOpen, setIsOpen] = React.useState(adjustments.length > 0)

  // Keep open if user adds an adjustment
  React.useEffect(() => {
    if (adjustments.length > 0) {
      setIsOpen(true)
    }
  }, [adjustments.length])

  return (
    <div
      id="adjustments-card"
      className="mt-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
        {/* Left: Icon + Title & Description */}
        <div
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-3.5 cursor-pointer select-none flex-1 min-w-0"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#4F46E5] font-bold text-sm">
            <Percent className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Adjustments (Optional)</h3>
              {adjustments.length > 0 && (
                <span className="rounded-full bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                  {adjustments.length} active
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
              Service charge, tax or discount — applied to the items subtotal and split proportionally to everyone's share.
            </p>
          </div>
        </div>

        {/* Right: Expand Toggle & Add Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label={isOpen ? 'Collapse adjustments' : 'Expand adjustments'}
          >
            <ChevronDown className={cn('size-5 transition-transform duration-200', isOpen && 'rotate-180')} />
          </button>

          {isHeadUser && (
            <button
              type="button"
              onClick={onAddAdjustment}
              className="inline-flex items-center gap-1 rounded-xl border border-indigo-400/80 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#4F46E5] hover:bg-indigo-50/70 shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>Add adjustment</span>
            </button>
          )}
        </div>
      </div>

      {/* Expanded Adjustments List */}
      {isOpen && (
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
          {adjustments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-xs text-slate-400">
              No adjustments added yet. Click &ldquo;Add adjustment&rdquo; above to include GST, tips, or service charges.
            </div>
          ) : (
            <div className="rounded-xl border border-indigo-100/80 bg-indigo-50/20 p-3 space-y-2">
              <ul className="space-y-1">
                {adjustments.map((adjustment) => (
                  <AdjustmentRow key={adjustment.id} adjustment={adjustment} />
                ))}
              </ul>

              <div className="flex items-center justify-between border-t border-indigo-100 pt-2 text-xs">
                <span className="text-slate-600 font-medium">Adjustments total</span>
                <span
                  className={cn(
                    'font-bold tabular-nums',
                    totals.adjustmentsTotal < 0 ? 'text-emerald-600' : 'text-slate-800',
                  )}
                >
                  {totals.adjustmentsTotal > 0 ? `+${formatMoney(totals.adjustmentsTotal, currency)}` : formatMoney(totals.adjustmentsTotal, currency)}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200/80 pt-2 text-xs font-semibold">
                <span className="text-slate-900">Grand Total (Products + Adjustments)</span>
                <span className="text-base font-bold text-[#4F46E5] tabular-nums">
                  {formatMoney(totals.billTotal, currency)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
