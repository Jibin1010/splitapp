'use client'

import * as React from 'react'
import { CheckCircle2, Clock, FileText } from 'lucide-react'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'
import type { CurrencyCode } from '@/types/split'

interface SettlementPayerProgressProps {
  billTotal: number
  totalPaid: number
  currency: CurrencyCode
  isPaidBalanced: boolean
  paidDiff: number
}

/**
 * Financial Status Progress Card:
 * Displays Bill Total, Paid upfront, and Remaining balance with a responsive progress bar.
 */
export function SettlementPayerProgress({
  billTotal,
  totalPaid,
  currency,
  isPaidBalanced,
  paidDiff,
}: SettlementPayerProgressProps) {
  const percentagePaid = Math.min(100, Math.max(0, (totalPaid / (billTotal || 1)) * 100))

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Bill Total */}
        <div className="flex items-center gap-3.5">
          <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-500 border border-blue-100/60 shadow-2xs shrink-0">
            <FileText className="size-5 stroke-[1.8]" />
          </div>
          <div>
            <span className="block text-xs font-medium text-slate-400">Bill Total</span>
            <span className="text-2xl font-black tracking-tight text-[#0F172A] font-sans tabular-nums">
              {formatMoney(billTotal, currency)}
            </span>
          </div>
        </div>

        <div className="hidden sm:block h-10 w-[1px] bg-slate-200/60" />

        {/* Paid */}
        <div className="flex items-center gap-3.5">
          <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 border border-emerald-100/60 shadow-2xs shrink-0">
            <CheckCircle2 className="size-5 stroke-[1.8]" />
          </div>
          <div>
            <span className="block text-xs font-medium text-slate-400">Paid</span>
            <span className="text-2xl font-black tracking-tight text-emerald-600 font-sans tabular-nums">
              {formatMoney(totalPaid, currency)}
            </span>
          </div>
        </div>

        <div className="hidden sm:block h-10 w-[1px] bg-slate-200/60" />

        {/* Remaining / Status */}
        <div className="flex items-center gap-3.5">
          <div
            className={cn(
              'flex size-11 items-center justify-center rounded-xl shadow-2xs shrink-0',
              isPaidBalanced
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/60'
                : 'bg-amber-50 text-amber-600 border border-amber-100/60',
            )}
          >
            {isPaidBalanced ? <CheckCircle2 className="size-5 stroke-[1.8]" /> : <Clock className="size-5 stroke-[1.8]" />}
          </div>
          <div>
            <span
              className={cn(
                'text-xl sm:text-2xl font-bold font-sans tabular-nums',
                isPaidBalanced ? 'text-emerald-700' : 'text-[#B45309]',
              )}
            >
              {isPaidBalanced
                ? 'Balanced ✓'
                : paidDiff > 0
                  ? `${formatMoney(paidDiff, currency)} remaining`
                  : `${formatMoney(-paidDiff, currency)} overpaid`}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar & Percentages on the same line */}
      <div className="flex items-center gap-4 pt-1">
        <div className="flex-1 h-2 rounded-full bg-blue-100/70 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              isPaidBalanced ? 'bg-emerald-500' : 'bg-[#2563EB]',
            )}
            style={{ width: `${percentagePaid}%` }}
          />
        </div>
        <div className="flex items-center gap-6 text-xs font-semibold shrink-0">
          <span className="text-slate-600 font-sans">
            {Math.round(percentagePaid)}% paid
          </span>
          <span className="text-slate-400 font-sans">
            {isPaidBalanced
              ? '0% remaining'
              : `${Math.round(Math.max(0, 100 - percentagePaid))}% remaining`}
          </span>
        </div>
      </div>
    </div>
  )
}
