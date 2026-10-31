'use client'

import * as React from 'react'
import { Receipt, ShoppingBag, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProductEmptyStateProps {
  type: 'no-products' | 'no-user-items'
  activePersonName?: string
  totalItemsCount?: number
  isHeadUser?: boolean
  onOpenVision?: () => void
  onSwitchToAll?: () => void
}

export function ProductEmptyState({
  type,
  activePersonName,
  totalItemsCount = 0,
  isHeadUser = false,
  onOpenVision,
  onSwitchToAll,
}: ProductEmptyStateProps) {
  if (type === 'no-products') {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[#DCE7FA] bg-[#F8FAFD] p-8 text-center">
        <div className="size-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
          <Receipt className="size-5" aria-hidden />
        </div>
        <p className="text-sm font-semibold text-slate-800">No products yet</p>
        <p className="max-w-sm text-xs text-slate-500">
          Add the first item from your bill — name, quantity and unit price. You can assign people to each
          product afterwards.
        </p>
        {onOpenVision && isHeadUser && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenVision}
            className="mt-2 gap-1.5 border-indigo-200 bg-white text-indigo-600 hover:bg-indigo-50 text-xs font-medium"
          >
            <Sparkles className="size-3.5 text-indigo-500" aria-hidden />
            Upload Bill / Describe Image
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[#DCE7FA] bg-[#F8FAFD] p-8 text-center">
      <div className="size-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
        <ShoppingBag className="size-5" aria-hidden />
      </div>
      <p className="text-sm font-bold text-slate-800">No items assigned to {activePersonName || 'you'}</p>
      <p className="max-w-sm text-xs text-slate-500">
        You are not included in any items on this bill yet. You can view all group items using the toggle above.
      </p>
      {onSwitchToAll && (
        <Button
          variant="outline"
          size="sm"
          onClick={onSwitchToAll}
          className="mt-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
        >
          View All Group Items ({totalItemsCount})
        </Button>
      )}
    </div>
  )
}
