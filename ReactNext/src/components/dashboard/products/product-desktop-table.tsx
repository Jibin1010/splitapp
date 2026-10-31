'use client'

import * as React from 'react'
import { User } from 'lucide-react'
import type { Bill, Person, ProductItem } from '@/types/split'
import { assignedIdsOf, lineTotalOf } from '@/lib/calculations'
import { formatMoney } from '@/lib/money'
import { ProductNameInput, ProductQuantityInput, ProductUnitPriceInput } from '@/components/forms/product-form'
import { cn } from '@/lib/utils'
import type { BillTotals } from './adjustments-list'
import { AssignedCell, ModeCell } from './product-cells'
import { ProductRowActions } from './product-row-actions'
import { ProductFoodThumbnail } from './product-food-thumbnail'

interface ProductDesktopTableProps {
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

export function ProductDesktopTable({
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
}: ProductDesktopTableProps) {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-left border-collapse">
        {/* Table Header */}
        <thead>
          <tr className="border-b border-slate-200/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <th scope="col" className="py-3 pl-4 pr-3 text-left font-semibold">
              Product
            </th>
            <th scope="col" className="py-3 px-3 text-center font-semibold w-24">
              Qty
            </th>
            <th scope="col" className="py-3 px-3 text-right font-semibold w-28">
              Unit Price
            </th>
            <th scope="col" className="py-3 px-3 text-right font-semibold w-28">
              Total
            </th>
            <th scope="col" className="py-3 px-4 text-left font-semibold min-w-[200px]">
              Assigned To
            </th>
            <th scope="col" className="py-3 px-3 text-left font-semibold w-36">
              Split Mode
            </th>
            <th scope="col" className="py-3 pl-3 pr-4 text-right font-semibold w-24">
              Actions
            </th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y divide-slate-100">
          {displayedItems.map((item) => {
            const isUserAssigned = activePerson ? isItemAssignedToActivePerson(item.id) : false
            const userShare = activePerson ? getItemShareForActivePerson(item.id) : 0
            const assignedIds = assignedIdsOf(item)
            const lineTotal = lineTotalOf(item)
            // Individual per-person share for display in the pill badge
            const perPersonShare = isUserAssigned && activePerson
              ? userShare
              : Math.round(lineTotal / Math.max(1, assignedIds.length))

            return (
              <tr
                key={item.id}
                className={cn(
                  'group transition-colors',
                  isUserAssigned ? 'bg-indigo-50/20 hover:bg-indigo-50/40' : 'hover:bg-slate-50/70',
                )}
              >
                {/* 1. PRODUCT: Thumbnail + Name + Personal Share Pill */}
                <td className="py-3.5 pl-4 pr-3">
                  <div className="flex items-center gap-3">
                    <ProductFoodThumbnail
                      name={item.name}
                      imageUrl={item.imageUrl}
                    />

                    <div className="flex flex-col gap-1 min-w-0">
                      {isHeadUser ? (
                        <ProductNameInput
                          item={item}
                          className="h-6 px-1 font-bold text-sm text-slate-900 border-none bg-transparent hover:bg-white focus:bg-white focus:border-indigo-400"
                        />
                      ) : (
                        <span className="font-bold text-sm text-slate-900 px-1 truncate">
                          {item.name || 'Untitled item'}
                        </span>
                      )}

                      {/* Personal Share Pill [👤 ₹450.00] */}
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF2FF] px-2.5 py-0.5 text-xs font-semibold text-[#4F46E5] w-fit shadow-2xs">
                        <span className="flex size-3.5 items-center justify-center rounded-full bg-[#4F46E5] text-white">
                          <User className="size-2" />
                        </span>
                        <span>{formatMoney(perPersonShare, bill.currency)}</span>
                      </div>
                    </div>
                  </div>
                </td>

                {/* 2. QTY: Styled box centered */}
                <td className="py-3.5 px-3 text-center align-middle">
                  {isHeadUser ? (
                    <ProductQuantityInput
                      item={item}
                      className="h-8.5 w-12 rounded-xl border border-slate-200 bg-white text-center text-xs font-semibold text-slate-800 shadow-2xs focus:border-indigo-500 mx-auto"
                    />
                  ) : (
                    <span className="inline-flex h-8.5 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-2xs">
                      {item.quantity}
                    </span>
                  )}
                </td>

                {/* 3. UNIT PRICE */}
                <td className="py-3.5 px-3 text-right align-middle text-xs font-semibold text-slate-800 tabular-nums">
                  {isHeadUser ? (
                    <ProductUnitPriceInput
                      item={item}
                      className="h-8.5 w-24 text-right rounded-xl border border-slate-200/90 bg-white text-xs font-semibold text-slate-800 tabular-nums shadow-2xs ml-auto"
                    />
                  ) : (
                    <span>{formatMoney(item.unitPrice, bill.currency)}</span>
                  )}
                </td>

                {/* 4. TOTAL: Bold line total */}
                <td className="py-3.5 px-3 text-right align-middle text-sm font-bold text-slate-900 tabular-nums">
                  {formatMoney(lineTotal, bill.currency)}
                </td>

                {/* 5. ASSIGNED TO: Overlapping avatars + [👤 People (N) ⌄] popover */}
                <td className="py-3.5 px-4 align-middle">
                  <AssignedCell
                    item={item}
                    onOpenAdvanced={() => onOpenAssignment(item.id)}
                  />
                </td>

                {/* 6. SPLIT MODE: Icon + text */}
                <td className="py-3.5 px-3 align-middle">
                  <ModeCell
                    item={item}
                    onOpen={() => onOpenAssignment(item.id)}
                  />
                </td>

                {/* 7. ACTIONS: Pencil, Copy, Trash */}
                <td className="py-3.5 pl-3 pr-4 text-right align-middle">
                  <ProductRowActions
                    item={item}
                    onOpenAssignment={onOpenAssignment}
                    onDuplicate={onDuplicate}
                    onDelete={onDelete}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>

        {/* Table Footer: Total Row */}
        <tfoot>
          <tr className="border-t border-slate-200/80 bg-white">
            <td className="py-4 pl-4 pr-3 text-sm font-bold text-slate-900">
              Total
            </td>
            <td className="py-4 px-3 text-center text-xs text-slate-400 font-medium">
              {effectiveMode === 'user' ? userQuantity : totalQuantity} items
            </td>
            <td className="py-4 px-3" />
            <td className="py-4 px-3 text-right text-xl font-bold text-[#4F46E5] tabular-nums">
              {formatMoney(
                effectiveMode === 'user' ? userItemsShare : totals.itemsTotal,
                bill.currency,
              )}
            </td>
            <td className="py-4 px-4" colSpan={3} />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
