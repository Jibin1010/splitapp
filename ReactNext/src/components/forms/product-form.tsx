'use client'

import * as React from 'react'
import { Plus } from 'lucide-react'
import type { ProductItem } from '@/types/split'
import { newId } from '@/lib/id'
import { useBillStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { IntInput, MoneyInput } from '@/components/ui/smart-input'
import { cn } from '@/lib/utils'

/**
 * Inline-editable inputs for one product row. Each edit commits straight to
 * the store, so every dependent figure (line total, bill total, allocations,
 * summary cards) updates immediately.
 */
export function ProductNameInput({ item, className }: { item: ProductItem; className?: string }) {
  const { dispatch } = useBillStore()
  return (
    <Input
      value={item.name}
      onChange={(event) => dispatch({ type: 'UPDATE_ITEM', itemId: item.id, patch: { name: event.target.value.slice(0, 300) } })}
      placeholder="Product name"
      aria-label="Product name"
      className={cn('h-8 border-transparent bg-transparent hover:border-slate-200 focus-visible:bg-white focus-visible:border-indigo-400 font-semibold text-sm transition-all', className)}
    />
  )
}

export function ProductQuantityInput({ item, className }: { item: ProductItem; className?: string }) {
  const { dispatch } = useBillStore()
  return (
    <IntInput
      value={item.quantity}
      onCommit={(quantity) => dispatch({ type: 'UPDATE_ITEM', itemId: item.id, patch: { quantity } })}
      min={1}
      max={1_000_000}
      aria-label={`Quantity for ${item.name || 'product'}`}
      className={cn('h-8 border-transparent bg-transparent text-right tabular-nums hover:border-slate-200 focus:bg-white focus:border-indigo-400 text-xs sm:w-16 rounded-md transition-all', className)}
    />
  )
}

export function ProductUnitPriceInput({ item, className }: { item: ProductItem; className?: string }) {
  const { dispatch } = useBillStore()
  return (
    <MoneyInput
      value={item.unitPrice}
      onCommit={(unitPrice) => dispatch({ type: 'UPDATE_ITEM', itemId: item.id, patch: { unitPrice } })}
      aria-label={`Unit price for ${item.name || 'product'}`}
      className={cn('h-8 border-transparent bg-transparent text-right tabular-nums hover:border-slate-200 focus:bg-white focus:border-indigo-400 text-xs sm:w-24 rounded-md transition-all', className)}
    />
  )
}

/** Appends a new empty product row — never navigates away from the dashboard. */
export function AddProductButton({ className }: { className?: string }) {
  const { dispatch } = useBillStore()

  const handleAdd = () => {
    dispatch({
      type: 'ADD_ITEM',
      item: {
        id: newId('item'),
        name: '',
        quantity: 1,
        unitPrice: 0,
        allocation: { mode: 'equal', participantIds: [] },
      },
    })
  }

  return (
    <Button variant="outline" onClick={handleAdd} className={className}>
      <Plus aria-hidden />
      Add Product
    </Button>
  )
}
