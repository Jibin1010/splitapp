'use client'

import * as React from 'react'
import { ChevronRight, Wallet, ArrowUpRight, ArrowDownLeft, CheckCircle2 } from 'lucide-react'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

interface SpotlightMetricsCardsProps {
  share: number
  paid: number
  net: number
  currency: any
  sharePercentage: number
  itemsCount: number
}

export function SpotlightMetricsCards({
  share,
  paid,
  net,
  currency,
  sharePercentage,
  itemsCount,
}: SpotlightMetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* 1. YOUR SHARE */}
      <div className="relative overflow-hidden rounded-[26px] border border-[#BFDBFE] bg-gradient-to-br from-[#F0F6FF] via-[#F4F8FF] to-[#E5F0FF] p-5 sm:p-6 shadow-[0_4px_20px_rgba(37,99,235,0.04)] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-12 items-center justify-center rounded-[18px] bg-[#DBEAFE] text-[#2563EB] shadow-2xs">
                <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                  <path d="M22 12A10 10 0 0 0 12 2v10z" />
                </svg>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Your Share
              </span>
            </div>
            <div className="flex size-8 items-center justify-center rounded-full bg-[#DBEAFE]/80 text-[#2563EB] shadow-2xs">
              <ChevronRight className="size-4 stroke-[2.5]" />
            </div>
          </div>

          <div className="mt-3.5">
            <span className="text-3xl sm:text-[34px] font-black tabular-nums text-slate-900 tracking-tight leading-none">
              {formatMoney(share, currency)}
            </span>
          </div>
          <p className="text-xs text-[#64748B] font-medium mt-1.5">
            {itemsCount > 0 ? `${sharePercentage.toFixed(1)}% of total bill` : 'Assigned items & taxes'}
          </p>
        </div>

        {/* Progress bar at the bottom */}
        <div className="mt-5 flex items-center gap-3 pt-1">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#DBEAFE]">
            <div
              className="h-full rounded-full bg-[#2563EB] transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(3, sharePercentage))}%` }}
            />
          </div>
          <span className="text-xs font-bold tabular-nums text-[#475569] shrink-0">
            {sharePercentage.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* 2. YOU PAID */}
      <div className="relative overflow-hidden rounded-[26px] border border-[#A7F3D0] bg-gradient-to-br from-[#F0FDF4] via-[#F4FBF7] to-[#E6F8F0] p-5 sm:p-6 shadow-[0_4px_20px_rgba(5,150,105,0.04)] flex flex-col justify-between">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-10 -right-10 size-36 rounded-full bg-[#86EFAC]/30 blur-2xl"
        />
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-12 items-center justify-center rounded-[18px] bg-[#D1FAE5] text-[#059669] shadow-2xs">
                <Wallet className="size-6 stroke-[2.4]" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                You Paid
              </span>
            </div>
            <div className="flex size-8 items-center justify-center rounded-full bg-[#D1FAE5]/80 text-[#059669] shadow-2xs">
              <ChevronRight className="size-4 stroke-[2.5]" />
            </div>
          </div>

          <div className="mt-3.5">
            <span className="text-3xl sm:text-[34px] font-black tabular-nums text-slate-900 tracking-tight leading-none">
              {formatMoney(paid, currency)}
            </span>
          </div>
          <p className="text-xs text-[#64748B] font-medium mt-1.5">
            {paid > 0 ? 'Fronted upfront' : 'No payments fronted'}
          </p>
        </div>

        <div className="mt-5 h-2" />
      </div>

      {/* 3. YOU OWE / YOU RECEIVE */}
      <div
        className={cn(
          'relative overflow-hidden rounded-[26px] border p-5 sm:p-6 flex flex-col justify-between',
          net < 0
            ? 'border-[#FECDD3] bg-gradient-to-br from-[#FFF5F5] via-[#FFF0F2] to-[#FFE4E8] shadow-[0_4px_20px_rgba(225,29,72,0.04)]'
            : net > 0
              ? 'border-[#A7F3D0] bg-gradient-to-br from-[#F0FDF4] via-[#F4FBF7] to-[#E6F8F0] shadow-[0_4px_20px_rgba(5,150,105,0.04)]'
              : 'border-slate-200 bg-slate-50/90'
        )}
      >
        {net < 0 && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-10 -right-10 size-36 rounded-full bg-[#FDA4AF]/35 blur-2xl"
          />
        )}

        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  'flex size-12 items-center justify-center rounded-[18px] shadow-2xs',
                  net < 0
                    ? 'bg-[#FFE4E6] text-[#E11D48]'
                    : net > 0
                      ? 'bg-[#D1FAE5] text-[#059669]'
                      : 'bg-slate-100 text-slate-600'
                )}
              >
                {net < 0 ? (
                  <ArrowUpRight className="size-6 stroke-[2.5]" />
                ) : net > 0 ? (
                  <ArrowDownLeft className="size-6 stroke-[2.5]" />
                ) : (
                  <CheckCircle2 className="size-6 stroke-[2.5]" />
                )}
              </div>
              <span
                className={cn(
                  'text-xs font-bold uppercase tracking-wider',
                  net < 0
                    ? 'text-[#E11D48]'
                    : net > 0
                      ? 'text-[#059669]'
                      : 'text-[#64748B]'
                )}
              >
                {net < 0 ? 'You Owe' : net > 0 ? 'You Receive' : 'Balance'}
              </span>
            </div>
            <div
              className={cn(
                'flex size-8 items-center justify-center rounded-full shadow-2xs',
                net < 0
                  ? 'bg-[#FFE4E6]/80 text-[#E11D48]'
                  : net > 0
                    ? 'bg-[#D1FAE5]/80 text-[#059669]'
                    : 'bg-slate-200/60 text-slate-600'
              )}
            >
              <ChevronRight className="size-4 stroke-[2.5]" />
            </div>
          </div>

          <div className="mt-3.5">
            <span
              className={cn(
                'text-3xl sm:text-[34px] font-black tabular-nums tracking-tight leading-none',
                net < 0
                  ? 'text-[#E11D48]'
                  : net > 0
                    ? 'text-[#059669]'
                    : 'text-slate-900'
              )}
            >
              {net < 0
                ? formatMoney(Math.abs(net), currency)
                : net > 0
                  ? `+${formatMoney(net, currency)}`
                  : formatMoney(0, currency)}
            </span>
          </div>
          <p
            className={cn(
              'text-xs font-medium mt-1.5',
              net < 0
                ? 'text-[#E11D48]/85'
                : net > 0
                  ? 'text-[#059669]/85'
                  : 'text-[#64748B]'
            )}
          >
            {net < 0
              ? 'To pay to front payers'
              : net > 0
                ? 'To collect from group'
                : 'All square with group'}
          </p>
        </div>

        <div className="mt-5 h-2" />
      </div>
    </div>
  )
}
