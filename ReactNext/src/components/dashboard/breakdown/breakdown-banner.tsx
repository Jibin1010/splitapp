'use client'

import * as React from 'react'
import {
  ChevronRight,
  Info,
  Receipt,
  Scale,
  ShoppingBag,
  Users,
} from 'lucide-react'
import { formatMoney } from '@/lib/money'
import type { Bill, CalculationResult } from '@/types/split'

interface BreakdownBannerProps {
  bill: Bill
  preview: CalculationResult
  onEditItems: () => void
}

/**
 * Top Financial Ribbon with Pastel Waves Artwork, Total Bill (Incl. GST),
 * Products Subtotal, GST percentage breakdown, and Split Mode Card.
 */
export function BreakdownBanner({ bill, preview, onEditItems }: BreakdownBannerProps) {
  const gstPercentage = React.useMemo(() => {
    if (preview.itemsTotal <= 0 || preview.adjustmentsTotal <= 0) return 0
    return Math.round((preview.adjustmentsTotal / preview.itemsTotal) * 100)
  }, [preview.itemsTotal, preview.adjustmentsTotal])

  return (
    <div className="relative overflow-hidden rounded-3xl border border-sky-100/70 shadow-xs p-5 sm:p-6 min-h-[145px] flex items-center">
      {/* Background Dining Waves Artwork */}
      <img
        src="/images/production/pastel-dining-banner.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none opacity-95"
      />
      {/* Subtle glass layer */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-[0.5px] pointer-events-none" />

      <div className="relative z-10 w-full flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Left Column: Total Bill (Incl. GST) & Badges */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-zinc-700 block tracking-tight">
            Total Bill (Incl. GST)
          </span>
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 font-sans tabular-nums">
            {formatMoney(preview.billTotal, bill.currency)}
          </div>
          <div className="flex items-center gap-2 pt-0.5">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/85 backdrop-blur-xs border border-white/70 px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-2xs">
              <Receipt className="size-3.5 text-zinc-500" />
              <span>{bill.items.length} items</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/85 backdrop-blur-xs border border-white/70 px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-2xs">
              <Users className="size-3.5 text-zinc-500" />
              <span>{bill.people.length} people</span>
            </span>
          </div>
        </div>

        {/* Middle Column: Products Subtotal & GST breakdown */}
        <div className="flex items-center gap-3.5 bg-white/50 backdrop-blur-xs border border-white/70 rounded-2xl p-3 sm:px-4 sm:py-2.5 shadow-2xs">
          <div className="size-10 rounded-xl bg-blue-50/90 text-blue-600 border border-blue-100/80 flex items-center justify-center shrink-0 shadow-2xs">
            <ShoppingBag className="size-5" />
          </div>
          <div className="space-y-1 text-xs min-w-[210px]">
            <div className="flex items-center justify-between gap-4 text-zinc-600 font-medium">
              <span className="flex items-center gap-1">
                Products Subtotal
                <Info className="size-3 text-zinc-400" />
              </span>
              <span className="font-bold text-zinc-900 tabular-nums">
                {formatMoney(preview.itemsTotal, bill.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-zinc-600 font-medium">
              <span>GST ({gstPercentage}%)</span>
              <span className="font-bold text-zinc-900 tabular-nums">
                {formatMoney(preview.adjustmentsTotal, bill.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 pt-1 border-t border-zinc-200/70 font-bold text-zinc-900">
              <span>Total</span>
              <span className="font-extrabold text-zinc-950 tabular-nums">
                {formatMoney(preview.billTotal, bill.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Floating Split Mode Card */}
        <div
          onClick={onEditItems}
          className="flex items-center justify-between gap-3 bg-white/95 backdrop-blur-sm rounded-2xl border border-white/90 shadow-[0_4px_20px_rgba(0,0,0,0.06)] px-4 py-3 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="size-10 rounded-xl bg-indigo-50/90 text-indigo-600 border border-indigo-100/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Scale className="size-5" />
          </div>
          <div className="text-left pr-2">
            <div className="text-sm font-bold text-zinc-900 leading-snug">
              Split equally
            </div>
            <div className="text-[11px] text-zinc-500">
              or customize per item
            </div>
          </div>
          <ChevronRight className="size-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  )
}
