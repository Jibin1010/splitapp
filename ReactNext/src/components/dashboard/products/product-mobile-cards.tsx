'use client'

import * as React from 'react'
import { User } from 'lucide-react'
import type { Bill, Person, ProductItem } from '@/types/split'
import { assignedIdsOf, lineTotalOf } from '@/lib/calculations'
import { formatMoney } from '@/lib/money'
import { ProductNameInput, ProductQuantityInput, ProductUnitPriceInput } from '@/components/forms/product-form'
import { cn } from '@/lib/utils'
import type { BillTotals } from './adjustments-list'
import { AssignedCell } from './product-cells'
import { ProductRowActions } from './product-row-actions'
import { ProductFoodThumbnail } from './product-food-thumbnail'

interface ProductMobileCardsProps {
  bill: Bill
  displayedItems: ProductItem[]
  effectiveMode: 'user' | 'all'
  isHeadUser: boolean
  activePerson: Person | null
  totals: BillTotals
  totalQuantity: number
  userQuantity: number
  userItemsShare: number
  userAdjustmentShare: number
  userTotalShare: number
  isItemAssignedToActivePerson: (id: string) => boolean
  getItemShareForActivePerson: (id: string) => number
  onOpenAssignment: (id: string) => void
  onDuplicate: (id: string) => void
  onDelete: (item: ProductItem) => void
}

export function ProductMobileCards({
  bill,
  displayedItems,
  effectiveMode,
  isHeadUser,
  activePerson,
  totals,
  totalQuantity,
  userQuantity,
  userItemsShare,
  userAdjustmentShare,
  userTotalShare,
  isItemAssignedToActivePerson,
  getItemShareForActivePerson,
  onOpenAssignment,
  onDuplicate,
  onDelete,
}: ProductMobileCardsProps) {
  return (
    <div className="space-y-2.5 md:hidden">
      <ul className="space-y-2.5">
        {displayedItems.map((item) => {
          const isUserAssigned = activePerson ? isItemAssignedToActivePerson(item.id) : false
          const userShare = activePerson ? getItemShareForActivePerson(item.id) : 0
          const assignedIds = assignedIdsOf(item)
          const lineTotal = lineTotalOf(item)
          const perPersonShare = isUserAssigned && activePerson
            ? userShare
            : Math.round(lineTotal / Math.max(1, assignedIds.length))

          return (
            <li
              key={item.id}
              className={cn(
                'rounded-2xl border p-3.5 transition-all shadow-xs space-y-2.5',
                isUserAssigned
                  ? 'border-indigo-200 bg-indigo-50/25 ring-1 ring-indigo-200/50'
                  : 'border-slate-200/80 bg-white',
              )}
            >
              {/* Product Top: Thumbnail, Name, Personal Share Pill, and Line Total */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <ProductFoodThumbnail
                    name={item.name}
                    imageUrl={item.imageUrl}
                    className="size-10"
                  />
                  <div className="flex flex-col gap-1 min-w-0">
                    {effectiveMode === 'all' && isHeadUser ? (
                      <ProductNameInput
                        item={item}
                        className="h-6 p-0 text-xs font-bold text-slate-900 border-none bg-transparent"
                      />
                    ) : (
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {item.name || 'Untitled item'}
                      </span>
                    )}

                    {/* Personal Share Pill [👤 ₹450.00] */}
                    <div className="inline-flex items-center gap-1 rounded-full bg-[#EEF2FF] px-2 py-0.5 text-[11px] font-semibold text-[#4F46E5] w-fit shadow-2xs">
                      <span className="flex size-3 items-center justify-center rounded-full bg-[#4F46E5] text-white">
                        <User className="size-2" />
                      </span>
                      <span>{formatMoney(perPersonShare, bill.currency)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-bold text-sm text-slate-900 tabular-nums">
                    {formatMoney(lineTotal, bill.currency)}
                  </span>
                </div>
              </div>

              {/* Bottom: Qty, Unit Price, Assigned Popover, and Actions */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Qty</span>
                    {effectiveMode === 'all' && isHeadUser ? (
                      <ProductQuantityInput
                        item={item}
                        className="h-7 w-11 rounded-lg border border-slate-200 bg-white text-center text-xs font-semibold px-1"
                      />
                    ) : (
                      <span className="inline-flex h-7 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800">
                        {item.quantity}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Price</span>
                    {effectiveMode === 'all' && isHeadUser ? (
                      <ProductUnitPriceInput
                        item={item}
                        className="h-7 w-18 rounded-lg border border-slate-200 bg-white text-right text-xs font-semibold px-1.5"
                      />
                    ) : (
                      <span className="text-xs font-semibold text-slate-700">
                        {formatMoney(item.unitPrice, bill.currency)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <AssignedCell
                    item={item}
                    onOpenAdvanced={() => onOpenAssignment(item.id)}
                  />
                  {effectiveMode === 'all' && isHeadUser && (
                    <ProductRowActions
                      item={item}
                      onOpenAssignment={onOpenAssignment}
                      onDuplicate={onDuplicate}
                      onDelete={onDelete}
                    />
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      {/* Mobile Footer Total */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-900">Total</span>
          <span className="text-xs text-slate-400 ml-2">
            {effectiveMode === 'user' ? userQuantity : totalQuantity} items
          </span>
        </div>
        <span className="text-base font-bold text-[#4F46E5] tabular-nums">
          {formatMoney(
            effectiveMode === 'user' ? userItemsShare : totals.itemsTotal,
            bill.currency,
          )}
        </span>
      </div>
    </div>
  )
}
