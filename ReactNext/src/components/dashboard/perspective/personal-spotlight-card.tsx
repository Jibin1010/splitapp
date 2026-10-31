'use client'

import * as React from 'react'
import {
  ChevronDown,
  LayoutGrid,
  ShoppingBag,
  Users,
} from 'lucide-react'
import { useBillStore } from '@/lib/store'
import { PersonAvatar } from '@/components/ui/person-avatar'
import { SpotlightMetricsCards } from './spotlight-metrics-cards'
import { SpotlightSettlementFlow } from './spotlight-settlement-flow'

export function PersonalSpotlightCard({ onOpenSwitcher }: { onOpenSwitcher: () => void }) {
  const { state, preview, activePerson } = useBillStore()
  const bill = state.bill

  if (!activePerson) return null

  const pRes = preview.people[activePerson.id]
  const share = pRes?.share ?? 0
  const paid = activePerson.paidAmount || 0
  const net = pRes?.net ?? (paid - share)
  const isHeadPayer = paid > 0

  const totalBill = preview.billTotal > 0 ? preview.billTotal : 1
  const sharePercentage = (share / totalBill) * 100

  const userItems = bill.items.filter((item) => {
    const itemShare = preview.itemAllocations[item.id]?.[activePerson.id] ?? 0
    return itemShare > 0
  })

  const incoming = preview.settlements.filter((s) => s.toPersonId === activePerson.id)
  const outgoing = preview.settlements.filter((s) => s.fromPersonId === activePerson.id)

  const scrollToBreakdown = () => {
    const el = document.getElementById('split-breakdown')
    el?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-[#DCE7FA] bg-gradient-to-br from-[#FFFFFF] via-[#F8FAFD] to-[#EFF5FD] p-6 sm:p-7 shadow-[0_12px_40px_rgba(79,70,229,0.06),0_2px_8px_rgba(0,0,0,0.02)] space-y-5">
      {/* Decorative 3D Pastel Floating Cards Illustration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1 sm:top-2 right-40 sm:right-48 md:right-52 lg:right-56 select-none z-0"
      >
        <img
          src="/images/production/floating-cards.png"
          srcSet="/images/production/floating-cards.png 1x, /images/production/floating-cards@2x.png 2x"
          alt=""
          className="w-44 sm:w-48 md:w-[218px] h-auto object-contain"
        />
      </div>

      {/* Header Row */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative shrink-0">
            <PersonAvatar
              name={activePerson.name}
              photo={activePerson.photo}
              size="lg"
              className="ring-4 ring-white shadow-sm overflow-hidden"
            />
            <span
              className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full bg-[#10B981] ring-2 ring-white"
              title="Active Profile"
            />
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                Your Part — {activePerson.name}
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] px-3 py-1 text-xs font-bold text-white shadow-2xs">
                <span className="text-[11px]">⚡</span>
                <span>Active Profile</span>
              </span>
              {isHeadPayer && (
                <span className="inline-flex items-center rounded-full border border-amber-400 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                  Head Payer
                </span>
              )}
            </div>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">
              {isHeadPayer ? 'Fronted payment for this group' : 'Split participant'} · Perspective active across all tables
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenSwitcher}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/95 px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-white hover:text-slate-900 transition-all cursor-pointer"
        >
          <Users className="size-3.5 text-[#64748B]" />
          <span>Switch Profile</span>
          <ChevronDown className="size-3.5 text-[#94A3B8]" />
        </button>
      </div>

      <SpotlightMetricsCards
        share={share}
        paid={paid}
        net={net}
        currency={bill.currency}
        sharePercentage={sharePercentage}
        itemsCount={bill.items.length}
      />

      <SpotlightSettlementFlow
        outgoing={outgoing}
        incoming={incoming}
        people={bill.people}
        currency={bill.currency}
      />

      {/* Footer Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-[#64748B]">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-indigo-50/90 border border-indigo-100 text-[#6366F1] shadow-2xs">
            <ShoppingBag className="size-4 stroke-[2.2]" />
          </div>
          <span className="text-xs font-medium text-[#64748B]">
            Included in{' '}
            <strong className="font-black text-slate-900">
              {userItems.length} of {bill.items.length}
            </strong>{' '}
            products
          </span>
        </div>

        <button
          type="button"
          onClick={scrollToBreakdown}
          className="inline-flex items-center gap-2 rounded-xl bg-[#EEF2FF] hover:bg-[#E0E7FF] border border-[#E0E7FF] px-4 py-2 font-bold text-[#4F46E5] shadow-2xs transition-colors cursor-pointer"
        >
          <LayoutGrid className="size-3.5 stroke-[2.4]" />
          <span>View your items in breakdown</span>
          <ChevronDown className="size-3.5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  )
}
