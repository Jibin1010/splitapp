'use client'

import * as React from 'react'
import { Users } from 'lucide-react'
import type { ProductItem } from '@/types/split'
import { AssignPeoplePopover } from './assign-people-popover'

export const MODE_LABELS: Record<ProductItem['allocation']['mode'], string> = {
  equal: 'Split equally',
  quantity: 'By quantity',
  custom: 'Custom amounts',
  percentage: 'Percentages',
}

export function AssignedCell({
  item,
  onOpenAdvanced,
}: {
  item: ProductItem
  onOpenAdvanced: () => void
}) {
  return (
    <AssignPeoplePopover
      item={item}
      onOpenAdvancedAllocation={onOpenAdvanced}
    />
  )
}

export function ModeCell({
  item,
  onOpen,
}: {
  item: ProductItem
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-slate-600 font-medium transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400 cursor-pointer"
      aria-label={`Split mode for ${item.name || 'product'}: ${MODE_LABELS[item.allocation.mode]} — click to change`}
    >
      <Users className="size-3.5 text-slate-500" />
      <span>{MODE_LABELS[item.allocation.mode]}</span>
    </button>
  )
}
